const { discoverJobs } = require("../jobs/discovery/jobDiscovery");
const { matchJob } = require("../matching/jobMatcher");
const ApplicationAgent = require("../applications/applicationAgent");

const candidate = require("../config/candidate.json");
const config = require("../config/agentConfig");

const MATCH_THRESHOLD = config.matching.threshold;

async function runBatch() {
    console.log("\n====================================");
    console.log("🤖 JOB APPLICATION AGENT");
    console.log("====================================\n");

    // 1. Discover jobs
    console.log("🔎 Discovering jobs...\n");

    const jobs = await discoverJobs();

    console.log(`📋 Discovered ${jobs.length} jobs.\n`);

    if (jobs.length === 0) {
        console.log("⚠️ No jobs found.");
        return;
    }

    // 2. Match jobs
    const matchedJobs = [];

    for (const job of jobs) {
        const result = matchJob(job, candidate);

        job.matchScore = result.score;
        job.matchResult = result;

        console.log(
            `📊 ${job.title} → ${result.score}%`
        );

        if (result.score >= MATCH_THRESHOLD) {
            matchedJobs.push(job);
        }
    }

    console.log(
        `\n✅ ${matchedJobs.length} jobs passed the ${MATCH_THRESHOLD}% threshold.\n`
    );

    if (matchedJobs.length === 0) {
        console.log("⚠️ No suitable jobs found.");
        return;
    }

    // 3. Send matching jobs to ApplicationAgent
    const applicationAgent = new ApplicationAgent();

    applicationAgent.addJobs(matchedJobs);

    // 4. Start application process
    await applicationAgent.processBatch();
}

module.exports = {
    runBatch
};

if (require.main === module) {
    runBatch().catch(error => {
        console.error("\n❌ Batch failed:");
        console.error(error);
    });
}