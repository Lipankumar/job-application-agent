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
    const belowThreshold = [];

    for (const job of jobs) {
        const result = matchJob(job, candidate);

        job.matchScore = result.score;
        job.matchResult = result;

        console.log(
            `📊 ${job.title} → ${result.score}%`
        );

        if (result.score >= MATCH_THRESHOLD) {
            matchedJobs.push(job);
        } else {
            belowThreshold.push(job);
            console.log(
                `⏭️ ${job.title} at ${job.company}: SKIPPED — match score ${result.score}% is below ${MATCH_THRESHOLD}%`
            );
        }
    }

    console.log(
        `\n✅ ${matchedJobs.length} jobs passed the ${MATCH_THRESHOLD}% threshold.\n`
    );

    if (matchedJobs.length === 0) {
        console.log("⚠️ No suitable jobs found.");
        console.log(`Run totals: discovered ${jobs.length}, applied 0, skipped ${belowThreshold.length}, failed 0, needs review 0.`);
        return;
    }

    // 3. Send matching jobs to ApplicationAgent
    const applicationAgent = new ApplicationAgent();

    applicationAgent.addJobs(matchedJobs);

    // 4. Start application process
    const applicationSummary = await applicationAgent.processBatch();

    console.log("\n=================================");
    console.log("FULL RUN TOTALS");
    console.log("=================================");
    console.log(`Discovered: ${jobs.length}`);
    console.log(`Applied: ${applicationSummary.applied}`);
    console.log(`Skipped: ${belowThreshold.length + applicationSummary.skipped} (${belowThreshold.length} below match threshold)`);
    console.log(`Failed: ${applicationSummary.failed}`);
    console.log(`Needs human review: ${applicationSummary.needsReview}`);
    console.log(`Not processed: ${applicationSummary.notProcessed}`);
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
