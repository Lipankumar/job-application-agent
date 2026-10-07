const { chromium } = require("playwright");
const { loginToNaukri } = require("../../naukri/naukriLogin");
const { discoverNaukriJobs } = require("../sources/naukriSource");

async function test() {
    const browser = chromium.launchPersistentContext("./browser-profile", {
                        headless: false
                    });

    const page = await browser.newPage();

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
        await new Promise(() => {});

    } catch (error) {
        console.error("\n❌ Naukri discovery failed:");
        console.error(error);
    }
}

test();