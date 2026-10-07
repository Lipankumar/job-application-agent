const { runBatch } = require("../batch/runBatch");
const config = require("../config/agentConfig");

function startScheduler() {
    const runHour = config.scheduler.hour;
    const runMinute = config.scheduler.minute;

    console.log(
        `⏰ Scheduler started. Batch will run daily at ${runHour}:${String(runMinute).padStart(2, "0")}`
    );

    setInterval(async () => {
        const now = new Date();

        if (
            now.getHours() === runHour &&
            now.getMinutes() === runMinute
        ) {
            console.log("\n⏰ Scheduled batch starting...\n");

            try {
                await runBatch();
            } catch (error) {
                console.error("❌ Scheduled batch failed:", error.message);
            }
        }
    }, 60 * 1000);
}

startScheduler();