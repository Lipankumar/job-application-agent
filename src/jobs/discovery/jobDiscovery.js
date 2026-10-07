const { chromium } = require("playwright");

const {
    loginToNaukri
} = require("../naukri/naukriLogin");

const {
    discoverNaukriJobs
} = require("./sources/naukriSource");

async function discoverJobs() {

    console.log("\n🔎 Discovering jobs from Naukri...");

    const browser = await chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

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
            maxJobs: 10
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

        await browser.close();

        console.log(
            "🌐 Discovery browser closed."
        );
    }
}

module.exports = {
    discoverJobs
};