const ApplicationAgent = require("./applicationAgent");
const candidate = require("../config/candidateProfile");
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

        // Apply recent listings first, then older listings, with undated jobs
        // as the last fallback when there are not enough recent matches.
        eligibleBeforeLimit.sort((a, b) => {
            const aTime = a.postedAt ? new Date(a.postedAt).getTime() : NaN;
            const bTime = b.postedAt ? new Date(b.postedAt).getTime() : NaN;
            if (!Number.isFinite(aTime)) return Number.isFinite(bTime) ? 1 : 0;
            if (!Number.isFinite(bTime)) return -1;
            return bTime - aTime;
        });

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

        // Date availability and age affect priority, not eligibility. Reject
        // only a known future date; old or undated jobs remain fallback options.
        const postedTime = job.postedAt ? new Date(job.postedAt) : null;
        const ageHours = postedTime && Number.isFinite(postedTime.getTime())
            ? (Date.now() - postedTime.getTime()) / (1000 * 60 * 60)
            : NaN;

        if (Number.isFinite(ageHours) && ageHours < 0) {
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
