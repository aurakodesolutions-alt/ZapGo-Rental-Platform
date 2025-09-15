const https = require("https");

function post(path, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data || {});
        const req = https.request({
            hostname: "zapgorental.in",
            port: 443,
            path,
            method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        }, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); });
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

(async () => {
    try {
        const status = await post("/api/v1/admin/alerts/refresh", { dueSoonDays: 3, startingSoonDays: 7 });
        console.log("[alerts-cron] refresh status:", status);
        process.exit(0);
    } catch (e) {
        console.error("[alerts-cron] error:", e);
        process.exit(1);
    }
})();
