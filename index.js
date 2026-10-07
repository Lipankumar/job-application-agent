require("dotenv").config();

const { runBatch } = require("./src/batch/runBatch");

console.log("=================================");
console.log("     AI JOB APPLICATION AGENT");
console.log("=================================");

console.log("Environment:", process.env.NODE_ENV);

async function main() {
    try {
        console.log("Agent started successfully.");

        await runBatch();

    } catch (error) {
        console.error("Agent failed to start:");
        console.error(error);
        process.exit(1);
    }
}

main();