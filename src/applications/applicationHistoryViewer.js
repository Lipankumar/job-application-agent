const {
    getHistory,
    getApplicationsByStatus
} = require("./applicationHistory");

function displayApplicationHistory() {
    const history = getHistory();

    console.log("\n================================");
    console.log("📋 APPLICATION HISTORY");
    console.log("================================");

    if (history.length === 0) {
        console.log("No applications found.");
        return;
    }

    history.forEach((application, index) => {
        console.log(`\n#${index + 1}`);

        console.log(
            `🏢 Company: ${application.company}`
        );

        console.log(
            `💼 Job: ${application.jobTitle}`
        );

        console.log(
            `🌐 Platform: ${application.platform}`
        );

        console.log(
            `📊 Match: ${application.matchScore ?? "N/A"}%`
        );

        console.log(
            `📌 Status: ${application.status}`
        );

        console.log(
            `📅 Date: ${application.date}`
        );

        if (application.jobUrl) {
            console.log(
                `🔗 URL: ${application.jobUrl}`
            );
        }

        if (application.failureReason) {
            console.log(
                `❌ Reason: ${application.failureReason}`
            );
        }

        if (application.lastUpdatedAt) {
            console.log(
                `🕐 Updated: ${application.lastUpdatedAt}`
            );
        }
    });

    console.log("\n================================\n");
}

function displayStatusSummary() {
    const history = getHistory();

    console.log("\n================================");
    console.log("📊 APPLICATION STATUS SUMMARY");
    console.log("================================");

    const statuses = [
        "FORM_FILLED",
        "APPLIED",
        "SKIPPED",
        "FAILED"
    ];

    statuses.forEach(status => {
        const applications =
            getApplicationsByStatus(status);

        console.log(
            `${status.padEnd(15)} ${applications.length}`
        );
    });

    console.log(
        `TOTAL`.padEnd(15),
        history.length
    );

    console.log("================================\n");
}

module.exports = {
    displayApplicationHistory,
    displayStatusSummary
};