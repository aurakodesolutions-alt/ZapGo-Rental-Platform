import sql from "mssql";

const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER || "localhost",
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    requestTimeout: 45000,
    pool: { min: 1, max: 10, idleTimeoutMillis: 30000 },
    port:1433
};

let pool: sql.ConnectionPool;

export async function getConnection() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

export { sql };

