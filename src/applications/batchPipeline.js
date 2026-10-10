const ApplicationAgent = require("./applicationAgent");
const candidate = require("../config/candidate.json");
const config = require("../config/application.json");

class BatchPipeline {
    constructor() {
        this.agent = new ApplicationAgent();
    }

    async run(jobs) {
        console.log("\n🚀 Starting job application pipeline\n");

        // 1. Filter eligible jobs
        const eligibleBeforeLimit = [];
        const rejectedJobs = [];

        for (const job of jobs) {
            const result = this.isEligible(job);
            console.log(`${result.eligible ? "✅" : "⏭️"} ${job.title}`);

            if (result.eligible) {
                eligibleBeforeLimit.push(job);
            } else {
                rejectedJobs.push({ job, reason: result.reason });
                console.log(`   Status: SKIPPED — ${result.reason}`);
            }
        }

        const eligibleJobs = eligibleBeforeLimit.slice(0, config.maxApplicationsPerBatch);
        const cappedJobs = eligibleBeforeLimit.slice(config.maxApplicationsPerBatch);
        for (const job of cappedJobs) {
            rejectedJobs.push({
                job,
                reason: `Batch limit of ${config.maxApplicationsPerBatch} reached`
            });
            console.log(`⏭️ ${job.title} at ${job.company}: SKIPPED — batch limit reached`);
        }

        const rejectedCount = rejectedJobs.length;
        const cappedCount = cappedJobs.length;

        console.log(
            `\n📊 Eligible jobs: ${eligibleJobs.length}/${jobs.length}`
        );
        console.log(`📊 Rejected or capped: ${rejectedCount} (${cappedCount} over batch limit)`);

        if (eligibleJobs.length === 0) {
            console.log("No eligible jobs found.");
            console.log(`Run totals: applied 0, skipped ${jobs.length}, failed 0, needs review 0.`);
            return;
        }

        // 2. Add jobs to application queue
        this.agent.addJobs(eligibleJobs);

        // 3. Start batch processing
        const applicationSummary = await this.agent.processBatch();

        console.log("\nFULL PIPELINE TOTALS");
        console.log(`Received: ${jobs.length}`);
        console.log(`Applied: ${applicationSummary.applied}`);
        console.log(`Skipped: ${rejectedCount + applicationSummary.skipped}`);
        console.log(`Failed: ${applicationSummary.failed}`);
        console.log(`Needs human review: ${applicationSummary.needsReview}`);
        console.log(`Not processed: ${applicationSummary.notProcessed}`);
    }

    isEligible(job) {
        if (!job.url) {
            return {
                eligible: false,
                reason: "No application URL"
            };
        }

        if (
            typeof job.matchScore !== "number" ||
            job.matchScore < config.minimumMatchScore
        ) {
            return {
                eligible: false,
                reason: `Match score below ${config.minimumMatchScore}`
            };
        }

        // Enforce the age limit only when the source provided a real date.
        if (!job.postedAt) {
            return {
                eligible: false,
                reason: "Posting time is unavailable"
            };
        }

        const postedTime = new Date(job.postedAt);
        const ageHours = (Date.now() - postedTime.getTime()) / (1000 * 60 * 60);

        if (!Number.isFinite(ageHours)) {
            return {
                eligible: false,
                reason: "Posting time is invalid"
            };
        }

        if (ageHours > config.jobAgeHours) {
            return {
                eligible: false,
                reason: `Job is older than ${config.jobAgeHours} hours`
            };
        }

        if (ageHours < 0) {
            return {
                eligible: false,
                reason: "Invalid future postedAt time"
            };
        }

        // Location check
        if (
            candidate.preferredLocations &&
            candidate.preferredLocations.length > 0 &&
            job.location
        ) {
            const jobLocation = job.location.toLowerCase();

            const locationMatch =
                candidate.preferredLocations.some(
                    preferred =>
                        jobLocation.includes(
                            preferred.toLowerCase()
                        )
                );

            if (!locationMatch) {
                return {
                    eligible: false,
                    reason: "Location mismatch"
                };
            }
        }

        return {
            eligible: true,
            reason: "Passed eligibility checks"
        };
    }
}

module.exports = BatchPipeline;
