const { discoverJobs } = require("../jobs/discovery/jobDiscovery");
const { matchJob } = require("../matching/jobMatcher");
const BatchPipeline = require("./batchPipeline");
const candidate = require("../config/candidate.json");

async function runBatch() {
    console.log("\n🚀 Starting job application batch...\n");

    try {
        // 1. Discover jobs
        console.log("🔎 Discovering jobs...");

        const discoveredJobs = await discoverJobs();

        console.log(`📋 Discovered ${discoveredJobs.length} jobs\n`);

        if (discoveredJobs.length === 0) {
            console.log("ℹ️ No jobs found.");
            return;
        }

        // 2. Match every job against candidate
        console.log("🎯 Matching jobs with candidate profile...\n");

        const matchedJobs = discoveredJobs.map(job => {
            const result = matchJob(job, candidate);

            console.log(`📌 ${job.title}`);
            console.log(`   Match Score: ${result.score}`);
            console.log(
                `   Skills: ${result.matchedSkills.length} matched`
            );
            console.log(
                `   Experience: ${result.experienceMatch ? "✅" : "❌"}`
            );
            console.log(
                `   Location: ${result.locationMatch ? "✅" : "❌"}`
            );
            console.log(
                `   Role: ${result.roleMatch ? "✅" : "❌"}`
            );

            return {
                ...job,

                // BatchPipeline expects matchScore
                matchScore: result.score,

                // Keep complete matching information
                matchResult: result
            };
        });

        console.log(`\n🎯 Matched ${matchedJobs.length} jobs\n`);

        // 3. Eligibility + application pipeline
        const pipeline = new BatchPipeline();

        await pipeline.run(matchedJobs);

        console.log("\n✅ Batch finished.");
    } catch (error) {
        console.error("\n❌ Batch failed:");
        console.error(error);
    }
}

runBatch();