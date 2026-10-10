const { launchBrowser } = require("../../../browser/browser");
const { loginToNaukri } = require("../../naukri/naukriLogin");
const { discoverNaukriJobs } = require("../sources/naukriSource");

async function test() {
    const { context, page } = await launchBrowser();

    try {
        await loginToNaukri(page);

        const jobs = await discoverNaukriJobs(page, {
            keyword: "Node.js Backend Developer",
            location: "Bangalore",
            maxJobs: 10
        });

        console.log("\n==============================");
        console.log("REAL NAUKRI JOBS");
        console.log("==============================");

        console.dir(jobs, {
            depth: null
        });

        console.log("\nPress Ctrl+C when finished reviewing.");
        await new Promise(resolve => process.once("SIGINT", resolve));

    } catch (error) {
        console.error("\n❌ Naukri discovery failed:");
        console.error(error);
    } finally {
        await context.close();
    }
}

test();
