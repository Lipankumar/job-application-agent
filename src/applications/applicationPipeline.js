const fs = require("fs");
const path = require("path");

function processJob(job, matchResult, eligibilityResult) {

    console.log("\n==============================");
    console.log("Processing Job");
    console.log("==============================");

    console.log("Company:", job.company);
    console.log("Title:", job.title);

    // -------------------------
    // Eligibility Gate
    // -------------------------

    if (!eligibilityResult.eligible) {

        console.log("❌ Job skipped");

        console.log(
            "Reason:",
            eligibilityResult.reason
        );

        recordApplication({
            job,
            status: "SKIPPED",
            reason: eligibilityResult.reason,
            matchScore: matchResult.matchScore
        });

        return {
            status: "SKIPPED",
            reason: eligibilityResult.reason
        };
    }

    // -------------------------
    // Eligible
    // -------------------------

    console.log("✅ Job is eligible");

    /*
     * Application logic will be connected here.
     *
     * Example:
     *
     * const result = await applyToJob(job);
     */

    const applicationResult = {
        status: "READY_TO_APPLY",
        message: "Job passed eligibility gate"
    };

    recordApplication({
        job,
        status: applicationResult.status,
        reason: applicationResult.message,
        matchScore: matchResult.matchScore
    });

    return applicationResult;
}


// -------------------------
// Application Tracking
// -------------------------

function recordApplication(data) {

    const filePath = path.join(
        __dirname,
        "../data/application-history.json"
    );

    let history = [];

    if (fs.existsSync(filePath)) {
        history = JSON.parse(
            fs.readFileSync(filePath, "utf-8")
        );
    }

    history.push({
        ...data,
        processedAt: new Date().toISOString()
    });

    fs.writeFileSync(
        filePath,
        JSON.stringify(history, null, 2)
    );
}


module.exports = {
    processJob
};