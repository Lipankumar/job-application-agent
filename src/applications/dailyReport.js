const {
    getApplicationsByDate
} = require("./applicationHistory");

function generateDailyReport(date) {

    const applications = getApplicationsByDate(date);

    const total = applications.length;

    const successful = applications.filter(
        app => app.status === "APPLIED"
    ).length;

    const failed = applications.filter(
        app => app.status === "FAILED"
    ).length;

    const skipped = applications.filter(
        app => app.status === "SKIPPED"
    ).length;


    // Platform statistics
    const platformStats = {};

    for (const app of applications) {

        const platform = app.platform;

        if (!platformStats[platform]) {
            platformStats[platform] = 0;
        }

        platformStats[platform]++;
    }


    // Status statistics
    const statusStats = {};

    for (const app of applications) {

        const status = app.status;

        if (!statusStats[status]) {
            statusStats[status] = 0;
        }

        statusStats[status]++;
    }


    // Match score
    const scores = applications
        .map(app => app.matchScore)
        .filter(score => typeof score === "number");

    const averageMatchScore =
        scores.length > 0
            ? (
                scores.reduce(
                    (sum, score) => sum + score,
                    0
                ) / scores.length
            ).toFixed(2)
            : 0;


    // Failed applications
    const failures = applications
        .filter(app => app.status === "FAILED")
        .map(app => ({
            company: app.company,
            jobTitle: app.jobTitle,
            platform: app.platform,
            reason: app.failureReason
        }));


    return {
        date,

        total,

        successful,

        failed,

        skipped,

        platformStats,

        statusStats,

        averageMatchScore,

        failures
    };
}


function printDailyReport(report) {

    console.log("\n");
    console.log("==========================================");
    console.log("       DAILY APPLICATION REPORT");
    console.log("==========================================");

    console.log(`Date: ${report.date}`);

    console.log("\nSummary");
    console.log("------------------------------------------");

    console.log(`Total applications : ${report.total}`);
    console.log(`Successful         : ${report.successful}`);
    console.log(`Failed             : ${report.failed}`);
    console.log(`Skipped            : ${report.skipped}`);


    console.log("\nBy Platform");
    console.log("------------------------------------------");

    for (const platform in report.platformStats) {

        console.log(
            `${platform.padEnd(18)}: ${report.platformStats[platform]}`
        );
    }


    console.log("\nBy Status");
    console.log("------------------------------------------");

    for (const status in report.statusStats) {

        console.log(
            `${status.padEnd(18)}: ${report.statusStats[status]}`
        );
    }


    console.log("\nAverage Match Score");
    console.log("------------------------------------------");

    console.log(
        `${report.averageMatchScore}%`
    );


    console.log("\nFailures");
    console.log("------------------------------------------");

    if (report.failures.length === 0) {

        console.log("No failures 🎉");

    } else {

        report.failures.forEach((failure, index) => {

            console.log(
                `${index + 1}. ${failure.company} - ${failure.jobTitle}`
            );

            console.log(
                `   Platform: ${failure.platform}`
            );

            console.log(
                `   Reason: ${failure.reason}`
            );
        });
    }


    console.log("\n==========================================\n");
}


module.exports = {
    generateDailyReport,
    printDailyReport
};