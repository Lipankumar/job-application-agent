const ApplicationQueue = require("./applicationQueue");
const readline = require("readline");
const ApplicationSession = require("./applicationSession");
const candidateData = require("../config/candidate.json");
const applicationConfig = require("../config/application.json");
const { addApplication, getHistory } = require("./applicationHistory");

class ApplicationAgent {
    constructor() {
        this.queue = new ApplicationQueue();
        this.session = new ApplicationSession();
        this.candidateData = {
            ...candidateData,
            email: candidateData.email || process.env.CANDIDATE_EMAIL || "",
            phone: candidateData.phone || process.env.CANDIDATE_PHONE || "",
            location: candidateData.location || candidateData.preferredLocations?.[0] || ""
        };

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.shouldQuit = false;
        this.runStartedAt = Date.now();
    }

    addJobs(jobs = []) {
        this.queue.addMany(jobs);
    }

    async processBatch() {
        const jobs = this.queue.getPendingJobs();

        console.log(`\nFound ${jobs.length} pending jobs.\n`);

        if (jobs.length === 0) {
            console.log("No pending jobs.");
            this.rl.close();
            return this.printSummary();
        }

        try {
            await this.session.start();

            for (const job of jobs) {
                if (this.shouldQuit) {
                    break;
                }

                await this.processJob(job);
            }
        } catch (error) {
            for (const job of this.queue.getPendingJobs()) {
                this.queue.markFailed(job, `Browser/session startup failed: ${error.message}`);
            }
            console.error(`Application batch could not start: ${error.message}`);
        } finally {
            await this.session.close().catch(error => {
                console.error(`Could not close browser: ${error.message}`);
            });
            this.rl.close();
            this.printSummary();
        }

        return this.getSummary();
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

            this.queue.markProcessing(job);

            console.log("🌐 Opening application...");
            console.log(`🔗 Opening: ${job.url}`);

            await this.session.openJob(job.url);

            // --------------------------------
            // 2. Detect + autofill
            // --------------------------------

            console.log("🔎 Detecting and filling application form...");

            await this.session.detectAndFill(this.candidateData);

            let reviewReason = "Automatic submission is disabled";
            if (applicationConfig.autoSubmit) {
                console.log("🚀 Attempting automatic submission...");
                const result = await this.session.submitApplication();

                if (result.submitted) {
                    this.queue.markCompleted(job);
                    addApplication({
                        platform: new URL(job.url).hostname,
                        company: job.company,
                        jobTitle: job.title,
                        jobUrl: job.url,
                        matchScore: job.matchScore,
                        status: "APPLIED"
                    });
                    console.log(`📋 ${job.title} at ${job.company}: APPLIED (automatic confirmation)`);
                    console.log("✅ Application submission confirmed and recorded.");
                    return;
                }

                reviewReason = result.reason;
                console.log(`⚠️ Automatic submission paused: ${result.reason}`);
            }

            // --------------------------------
            // 3. Wait for human
            // --------------------------------

                this.queue.markWaitingForHuman(job, reviewReason);

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
                this.queue.markCompleted(job);

                addApplication({
                    platform: new URL(job.url).hostname,
                    company: job.company,
                    jobTitle: job.title,
                    jobUrl: job.url,
                    matchScore: job.matchScore,
                    status: "APPLIED"
                });

                console.log("\n✅ Application marked as COMPLETED.");
                console.log("📋 Status: submitted by human.");
                console.log(`📋 ${job.title} at ${job.company}: APPLIED (confirmed by user)`);

                return;
            }

            if (choice === "K") {
                this.queue.markSkipped(
                    job,
                    "Skipped by user during human review."
                );

                console.log("\n⏭️ Application skipped.");
                console.log("📋 Status: SKIPPED.");
                console.log(`📋 ${job.title} at ${job.company}: SKIPPED (user choice)`);

                return;
            }

            if (choice === "Q") {
                this.shouldQuit = true;

                console.log("\n🛑 Batch stopped by user.");
                console.log(
                    "📋 Current application remains WAITING_FOR_HUMAN."
                );
                console.log(`📋 ${job.title} at ${job.company}: NEEDS REVIEW`);

                return;
            }
        } catch (error) {
            console.error("\n❌ Application processing failed:");
            console.error(error.message);

            this.queue.markFailed(job, error.message);
            if (job.status === "completed") {
                console.log(`📋 ${job.title} at ${job.company}: APPLIED; history update failed — ${error.message}`);
            } else {
                console.log(`📋 ${job.title} at ${job.company}: FAILED — ${error.message}`);
            }
        }
    }

    getAppliedUrlsThisRun() {
        return new Set(getHistory()
            .filter(application => application.status === "APPLIED")
            .filter(application => {
                const timestamp = application.createdAt
                    ? new Date(application.createdAt).getTime()
                    : Number(application.id?.match(/^app_(\d+)/)?.[1]);
                return Number.isFinite(timestamp) && timestamp >= this.runStartedAt;
            })
            .map(application => application.jobUrl)
            .filter(Boolean)
            .map(url => url.split("?")[0]));
    }

    getSummary() {
        const jobs = this.queue.getAll();
        const count = status => jobs.filter(job => job.status === status).length;
        const appliedUrls = this.getAppliedUrlsThisRun();

        const wasApplied = job => job.outcome === "applied" ||
            appliedUrls.has(job.url?.split("?")[0]);

        return {
            total: jobs.length,
            applied: jobs.filter(wasApplied).length,
            skipped: jobs.filter(job => job.status === "skipped" && !wasApplied(job)).length,
            failed: count("failed"),
            needsReview: count("waiting_for_human"),
            notProcessed: count("pending")
        };
    }

    printSummary() {
        const summary = this.getSummary();
        console.log("\n=================================");
        console.log("APPLICATION RUN SUMMARY");
        console.log("=================================");
        console.log(`Total queued: ${summary.total}`);
        console.log(`Applied: ${summary.applied}`);
        console.log(`Skipped: ${summary.skipped}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Needs human review: ${summary.needsReview}`);
        console.log(`Not processed: ${summary.notProcessed}`);

        const appliedUrls = this.getAppliedUrlsThisRun();
        for (const job of this.queue.getAll()) {
            const appliedInHistory = appliedUrls.has(job.url?.split("?")[0]);
            const outcome = job.outcome === "applied" || appliedInHistory
                ? "APPLIED"
                : job.outcome || job.status.toUpperCase();
            const reason = appliedInHistory && job.outcome !== "applied"
                ? " — confirmed in application history"
                : job.reason ? ` — ${job.reason}` : "";
            console.log(`• ${job.title} at ${job.company}: ${outcome.toUpperCase()}${reason}`);
        }

        console.log("=================================\n");
        return summary;
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
