const ApplicationQueue = require("./applicationQueue");
const readline = require("readline");
const ApplicationSession = require("./applicationSession");
const candidateData = require("../config/candidate.json");

class ApplicationAgent {
    constructor() {
        this.queue = new ApplicationQueue();
        this.session = new ApplicationSession();
        this.candidateData = candidateData;

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.shouldQuit = false;
    }

    addJobs(jobs = []) {
        this.queue.addMany(jobs);
    }

    async processBatch() {
        const jobs = this.queue.getPendingJobs();

        console.log(`\nFound ${jobs.length} pending jobs.\n`);

        if (jobs.length === 0) {
            console.log("No pending jobs.");
            return;
        }

        await this.session.start();

        try {
            for (const job of jobs) {
                if (this.shouldQuit) {
                    break;
                }

                await this.processJob(job);
            }
        } finally {
            await this.session.close();
            this.rl.close();

            console.log("\n=================================");
            console.log("Application batch finished.");
            console.log("=================================\n");
        }
    }

    async processJob(job) {
        console.log("\n────────────────────────────────");
        console.log(`📌 Job: ${job.title}`);
        console.log(`🏢 Company: ${job.company}`);
        console.log(`📊 Match: ${job.matchScore}%`);
        console.log("────────────────────────────────");

        try {
            // --------------------------------
            // 1. Mark job as processing
            // --------------------------------

            this.queue.markProcessing(job.id);

            console.log("🌐 Opening application...");
            console.log(`🔗 Opening: ${job.url}`);

            await this.session.openJob(job.url);

            // --------------------------------
            // 2. Detect + autofill
            // --------------------------------

            console.log("🔎 Detecting and filling application form...");

            await this.session.detectAndFill(this.candidateData);

            // --------------------------------
            // 3. Wait for human
            // --------------------------------

            this.queue.markWaitingForHuman(job.id);

            console.log("\n🛑 HUMAN REVIEW REQUIRED");
            console.log("Review the application in the browser.");
            console.log("Submit the application manually.");

            // --------------------------------
            // 4. Wait until S/K/Q
            // --------------------------------

            const choice = await this.waitForHumanDecision();

            // --------------------------------
            // 5. Handle decision
            // --------------------------------

            if (choice === "S") {
                this.queue.markCompleted(job.id);

                console.log("\n✅ Application marked as COMPLETED.");
                console.log("📋 Status: submitted by human.");

                return;
            }

            if (choice === "K") {
                this.queue.markSkipped(
                    job.id,
                    "Skipped by user during human review."
                );

                console.log("\n⏭️ Application skipped.");
                console.log("📋 Status: SKIPPED.");

                return;
            }

            if (choice === "Q") {
                this.shouldQuit = true;

                console.log("\n🛑 Batch stopped by user.");
                console.log(
                    "📋 Current application remains WAITING_FOR_HUMAN."
                );

                return;
            }
        } catch (error) {
            console.error("\n❌ Application processing failed:");
            console.error(error.message);

            console.log("📋 Job remains available for later processing.");
        }
    }

    waitForHumanDecision() {
        return new Promise((resolve) => {
            const ask = () => {
                this.rl.question(
                    "\nAfter you finish, choose an option:\n" +
                    "[S] Submitted  [K] Skip  [Q] Quit batch: ",
                    (answer) => {
                        const choice = answer.trim().toUpperCase();

                        if (
                            choice === "S" ||
                            choice === "K" ||
                            choice === "Q"
                        ) {
                            resolve(choice);
                            return;
                        }

                        console.log(
                            "\n⚠️ Invalid choice."
                        );

                        console.log(
                            "Please enter only S, K, or Q."
                        );

                        ask();
                    }
                );
            };

            ask();
        });
    }
}

module.exports = ApplicationAgent;