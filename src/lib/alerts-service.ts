import { getConnection, sql } from "./db";

export type AlertStatus = "open" | "snoozed" | "closed";
export type AlertType = "RENTAL_OVERDUE" | "RENTAL_DUE_SOON" | "RENTAL_STARTING_SOON";

type RefreshOpts = {
    dueSoonDays?: number;       // returns due within N days
    startingSoonDays?: number;  // rentals starting within N days
};

export async function refreshAlerts(opts: RefreshOpts = {}) {
    const dueSoonDays = opts.dueSoonDays ?? 3;
    const startingSoonDays = opts.startingSoonDays ?? 7;

    const pool = await getConnection();

    // 1) OVERDUE (ExpectedReturnDate < now, not returned, active/ongoing)
    await pool.request()
        .query(`
      MERGE dbo.Alerts AS tgt
      USING (
        SELECT
          CAST(r.RentId AS NVARCHAR(64)) AS RelatedId,
          r.ExpectedReturnDate           AS DueDate,
          CONCAT('Rental ', r.RentId, ' is overdue (expected ', CONVERT(varchar(19), r.ExpectedReturnDate, 120), ').') AS Msg
        FROM dbo.Rentals r
        WHERE r.ActualReturnDate IS NULL
          AND r.Status IN ('ongoing','active','booked') -- adjust to your statuses
          AND r.ExpectedReturnDate < SYSUTCDATETIME()
      ) AS src
      ON (tgt.Type = 'RENTAL_OVERDUE' AND tgt.RelatedId = src.RelatedId AND tgt.Status IN ('open','snoozed'))
      WHEN MATCHED THEN
        UPDATE SET tgt.DueDate = src.DueDate, tgt.Message = src.Msg, tgt.UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (Type, RelatedId, Message, DueDate, Status, CreatedAt, UpdatedAt)
        VALUES ('RENTAL_OVERDUE', src.RelatedId, src.Msg, src.DueDate, 'open', SYSUTCDATETIME(), SYSUTCDATETIME());
    `);

    // Close overdue alerts that are no longer overdue
    await pool.request().query(`
    UPDATE a SET Status='closed', UpdatedAt=SYSUTCDATETIME()
    FROM dbo.Alerts a
    LEFT JOIN dbo.Rentals r ON a.RelatedId = CAST(r.RentId AS NVARCHAR(64))
    WHERE a.Type='RENTAL_OVERDUE' AND a.Status IN ('open','snoozed')
      AND (
        r.RentId IS NULL
        OR r.ActualReturnDate IS NOT NULL
        OR r.ExpectedReturnDate >= SYSUTCDATETIME()
      )
  `);

    // 2) DUE SOON (ExpectedReturnDate BETWEEN now and now+N, not returned)
    await pool.request()
        .input("dueSoonDays", sql.Int, dueSoonDays)
        .query(`
      MERGE dbo.Alerts AS tgt
      USING (
        SELECT
          CAST(r.RentId AS NVARCHAR(64)) AS RelatedId,
          r.ExpectedReturnDate           AS DueDate,
          CONCAT('Return due soon for rental ', r.RentId, ' (', CONVERT(varchar(19), r.ExpectedReturnDate, 120), ').') AS Msg
        FROM dbo.Rentals r
        WHERE r.ActualReturnDate IS NULL
          AND r.Status IN ('ongoing','active','booked')
          AND r.ExpectedReturnDate >= SYSUTCDATETIME()
          AND r.ExpectedReturnDate < DATEADD(DAY, @dueSoonDays, SYSUTCDATETIME())
      ) AS src
      ON (tgt.Type='RENTAL_DUE_SOON' AND tgt.RelatedId = src.RelatedId AND tgt.Status IN ('open','snoozed'))
      WHEN MATCHED THEN
        UPDATE SET tgt.DueDate = src.DueDate, tgt.Message = src.Msg, tgt.UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (Type, RelatedId, Message, DueDate, Status, CreatedAt, UpdatedAt)
        VALUES ('RENTAL_DUE_SOON', src.RelatedId, src.Msg, src.DueDate, 'open', SYSUTCDATETIME(), SYSUTCDATETIME());
    `);

    await pool.request()
        .input("dueSoonDays", sql.Int, dueSoonDays)
        .query(`
      UPDATE a SET Status='closed', UpdatedAt=SYSUTCDATETIME()
      FROM dbo.Alerts a
      LEFT JOIN dbo.Rentals r ON a.RelatedId = CAST(r.RentId AS NVARCHAR(64))
      WHERE a.Type='RENTAL_DUE_SOON' AND a.Status IN ('open','snoozed')
        AND (
          r.RentId IS NULL
          OR r.ActualReturnDate IS NOT NULL
          OR r.ExpectedReturnDate < SYSUTCDATETIME()
          OR r.ExpectedReturnDate >= DATEADD(DAY, @dueSoonDays, SYSUTCDATETIME())
        )
  `);

    // 3) STARTING SOON (StartDate BETWEEN now and now+N; "booked/scheduled")
    await pool.request()
        .input("startDays", sql.Int, startingSoonDays)
        .query(`
      MERGE dbo.Alerts AS tgt
      USING (
        SELECT
          CAST(r.RentId AS NVARCHAR(64)) AS RelatedId,
          r.StartDate                    AS DueDate,
          CONCAT('Rental ', r.RentId, ' starts on ', CONVERT(varchar(19), r.StartDate, 120), '.') AS Msg
        FROM dbo.Rentals r
        WHERE r.Status IN ('booked','scheduled')
          AND r.StartDate >= SYSUTCDATETIME()
          AND r.StartDate < DATEADD(DAY, @startDays, SYSUTCDATETIME())
      ) AS src
      ON (tgt.Type='RENTAL_STARTING_SOON' AND tgt.RelatedId = src.RelatedId AND tgt.Status IN ('open','snoozed'))
      WHEN MATCHED THEN
        UPDATE SET tgt.DueDate = src.DueDate, tgt.Message = src.Msg, tgt.UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (Type, RelatedId, Message, DueDate, Status, CreatedAt, UpdatedAt)
        VALUES ('RENTAL_STARTING_SOON', src.RelatedId, src.Msg, src.DueDate, 'open', SYSUTCDATETIME(), SYSUTCDATETIME());
    `);

    await pool.request()
        .input("startDays", sql.Int, startingSoonDays)
        .query(`
      UPDATE a SET Status='closed', UpdatedAt=SYSUTCDATETIME()
      FROM dbo.Alerts a
      LEFT JOIN dbo.Rentals r ON a.RelatedId = CAST(r.RentId AS NVARCHAR(64))
      WHERE a.Type='RENTAL_STARTING_SOON' AND a.Status IN ('open','snoozed')
        AND (
          r.RentId IS NULL
          OR r.Status NOT IN ('booked','scheduled')
          OR r.StartDate < SYSUTCDATETIME()
          OR r.StartDate >= DATEADD(DAY, @startDays, SYSUTCDATETIME())
        )
  `);
}

export async function getAlertsSummary() {
    const pool = await getConnection();
    const res = await pool.request().query(`
    SELECT
      Type,
      SUM(CASE WHEN Status='open' THEN 1 ELSE 0 END)  AS OpenCount,
      SUM(CASE WHEN Status='snoozed' THEN 1 ELSE 0 END) AS SnoozedCount,
      SUM(CASE WHEN Status='closed' THEN 1 ELSE 0 END) AS ClosedCount
    FROM dbo.Alerts
    GROUP BY Type
  `);
    const byType: Record<string, { open: number; snoozed: number; closed: number }> = {};
    for (const r of res.recordset) {
        byType[r.Type] = { open: Number(r.OpenCount), snoozed: Number(r.SnoozedCount), closed: Number(r.ClosedCount) };
    }
    // total overdue open (for red dot)
    const overdueOpen = byType["RENTAL_OVERDUE"]?.open ?? 0;
    return { byType, overdueOpen };
}
