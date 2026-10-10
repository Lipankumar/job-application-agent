const { launchBrowser } = require("../../browser/browser");

const {
    loginToNaukri
} = require("../naukri/naukriLogin");

const {
    discoverNaukriJobs
} = require("./sources/naukriSource");
const { jobAgeHours } = require("../../config/application.json");

async function discoverJobs() {

    console.log("\n🔎 Discovering jobs from Naukri...");

    const { context, page } = await launchBrowser();

    try {

        /*
         * Login to Naukri
         */
        await loginToNaukri(page);

        /*
         * Discover real jobs
         */
        const jobs = await discoverNaukriJobs(page, {
            keyword: "Node.js Backend Developer",
            location: "Bangalore",
            maxJobs: 10,
            maxAgeHours: jobAgeHours
        });

        console.log(
            `\n📋 Real jobs discovered: ${jobs.length}`
        );

        return jobs;

    } catch (error) {

        console.error(
            "\n❌ Job discovery failed:"
        );

        console.error(error);

        throw error;

    } finally {

        await context.close();

        console.log(
            "🌐 Discovery browser closed."
        );
    }
}

module.exports = {
    discoverJobs
};
