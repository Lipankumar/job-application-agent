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
        const eligibleJobs = jobs
            .filter(job => {
                const result = this.isEligible(job);

                console.log(
                    `${result.eligible ? "✅" : "❌"} ${job.title}`
                );

                if (!result.eligible) {
                    console.log(`   Reason: ${result.reason}`);
                }

                return result.eligible;
        })
        .slice(0, config.maxApplicationsPerBatch);

        console.log(
            `\n📊 Eligible jobs: ${eligibleJobs.length}/${jobs.length}`
        );

        if (eligibleJobs.length === 0) {
            console.log("No eligible jobs found.");
            return;
        }

        // 2. Add jobs to application queue
        this.agent.addJobs(eligibleJobs);

        // 3. Start batch processing
        await this.agent.processBatch();
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

        // Job age check
        if (job.postedAt) {
            const postedTime = new Date(job.postedAt);
            const currentTime = new Date();

            const ageMs = currentTime - postedTime;
            const ageHours = ageMs / (1000 * 60 * 60);

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