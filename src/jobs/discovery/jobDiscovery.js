const { launchBrowser } = require("../../browser/browser");

const {
    loginToNaukri
} = require("../naukri/naukriLogin");

const {
    discoverNaukriJobs
} = require("./sources/naukriSource");
const { discoverHiristJobs } = require("./sources/hiristSource");
const { removeDuplicates } = require("../storage/jobDeduplicator");
const { jobAgeHours } = require("../../config/application.json");

function isPlatformEnabled(value) {
    return String(value ?? "true").trim().toLowerCase() === "true";
}

async function discoverJobs() {
    const platforms = [
        {
            name: "naukri",
            enabled: isPlatformEnabled(process.env.ENABLE_NAUKRI),
            login: loginToNaukri,
            discover: discoverNaukriJobs,
            options: {
                keyword: "Node.js Backend Developer",
                location: "Bangalore",
                maxJobs: 10,
                maxAgeHours: jobAgeHours
            }
        },
        {
            name: "hirist",
            enabled: isPlatformEnabled(process.env.ENABLE_HIRIST),
            discover: discoverHiristJobs,
            options: { maxJobs: 10, maxAgeHours: jobAgeHours }
        }
    ];

    const enabledPlatforms = platforms.filter(platform => platform.enabled);
    if (enabledPlatforms.length === 0) {
        console.log("⚠️ No job platform is enabled. Set ENABLE_NAUKRI=true and/or ENABLE_HIRIST=true in .env.");
        return [];
    }

    const { context, page } = await launchBrowser();

    try {
        console.log(`\n🔎 Discovering jobs across ${enabledPlatforms.length} enabled platforms...`);
        const jobsByPlatform = [];

        for (let index = 0; index < enabledPlatforms.length; index++) {
            const platform = enabledPlatforms[index];
            platform.page ||= index === 0
                ? page
                : await context.newPage();

            console.log(`\n🌐 Discovery tab opened for ${platform.name}.`);
            if (platform.login) await platform.login(platform.page);

            const jobs = await platform.discover(platform.page, platform.options);
            jobsByPlatform.push(...jobs);
            console.log(`📋 ${platform.name}: ${jobs.length} recent jobs.`);
        }

        const jobs = removeDuplicates(jobsByPlatform);

        console.log(
            `\n📋 Recent jobs across platforms: ${jobs.length}`
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
