const { detectForm } = require("../browser/formDetector");
const { fillForm } = require("../browser/formFiller");
const { scanForm } = require("../safety/safetyScanner");

async function processApplication(page, candidate) {

    console.log("\n==============================");
    console.log("STARTING APPLICATION");
    console.log("==============================\n");

    // --------------------------------
    // STEP 1: Detect form
    // --------------------------------

    const fields = await detectForm(page);

    console.log(`Detected ${fields.length} fields`);

    // --------------------------------
    // STEP 2: Safety scan
    // --------------------------------

    const safetyResult = scanForm(fields);

    if (!safetyResult.safe) {

        console.log("\n🛑 SAFETY CHECK FAILED\n");

        for (const finding of safetyResult.findings) {

            console.log(`Type   : ${finding.type}`);
            console.log(`Reason : ${finding.reason}`);
            console.log(`Field  : ${finding.field}`);
            console.log("--------------------------------");
        }

        console.log("\nApplication has been stopped.\n");

        return {
            success: false,
            stopped: true,
            reason: "Safety check failed",
            findings: safetyResult.findings
        };
    }

    console.log("✅ Safety check passed");

    // --------------------------------
    // STEP 3: Autofill
    // --------------------------------

    const filledFields = await fillForm(
        page,
        candidate
    );

    return {
        success: true,
        stopped: false,
        filledFields
    };
}

module.exports = {
    processApplication
};