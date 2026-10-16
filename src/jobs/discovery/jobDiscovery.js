const { launchBrowser } = require("../../browser/browser");

const {
    loginToNaukri
} = require("../naukri/naukriLogin");
const {
    loginToInstahyre
} = require("../instahyre/instahyreLogin");

const {
    discoverNaukriJobs
} = require("./sources/naukriSource");
const { discoverHiristJobs } = require("./sources/hiristSource");
const { discoverIndeedJobs } = require("./sources/indeedSource");
const { discoverInstahyreJobs } = require("./sources/instahyreSource");
const { removeDuplicates } = require("../storage/jobDeduplicator");
const { jobAgeHours } = require("../../config/application.json");
const { isOlderJobsEnabled } = require("../jobAgePolicy");

function isPlatformEnabled(value) {
    return String(value ?? "true").trim().toLowerCase() === "true";
}

async function discoverJobs() {
    const includeOlderJobs = isOlderJobsEnabled();
    const maxJobs = includeOlderJobs ? Infinity : 10;
    console.log(`🕒 Jobs older than ${jobAgeHours} hours: ${includeOlderJobs ? "included" : "hidden"} (ENABLE_OLDER_JOBS=${includeOlderJobs})`);

    const platforms = [
        {
            name: "naukri",
            enabled: isPlatformEnabled(process.env.ENABLE_NAUKRI),
            login: loginToNaukri,
            discover: discoverNaukriJobs,
            options: {
                keyword: "Node.js Backend Developer",
                location: "Bangalore",
                maxJobs,
                maxAgeHours: jobAgeHours,
                includeOlderJobs
            }
        },
        {
            name: "hirist",
            enabled: isPlatformEnabled(process.env.ENABLE_HIRIST),
            discover: discoverHiristJobs,
            options: { maxJobs, maxAgeHours: jobAgeHours, includeOlderJobs }
        },
        {
            name: "indeed",
            enabled: isPlatformEnabled(process.env.ENABLE_INDEED),
            discover: discoverIndeedJobs,
            options: {
                keyword: "Node.js Backend Developer",
                location: "Bangalore",
                maxJobs,
                maxAgeHours: jobAgeHours,
                includeOlderJobs
            }
        },
        {
            name: "instahyre",
            enabled: isPlatformEnabled(process.env.ENABLE_INSTAHYRE),
            login: loginToInstahyre,
            discover: discoverInstahyreJobs,
            options: {
                keyword: "Node.js Backend Developer",
                location: "Bangalore",
                maxJobs,
                maxAgeHours: jobAgeHours,
                includeOlderJobs
            }
        }
    ];

    const enabledPlatforms = platforms.filter(platform => platform.enabled);
    if (enabledPlatforms.length === 0) {
        console.log("⚠️ No job platform is enabled. Set ENABLE_NAUKRI=true, ENABLE_HIRIST=true, ENABLE_INDEED=true, and/or ENABLE_INSTAHYRE=true in .env.");
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
        jobs.sort((a, b) => {
            const aTime = a.postedAt ? new Date(a.postedAt).getTime() : NaN;
            const bTime = b.postedAt ? new Date(b.postedAt).getTime() : NaN;
            if (!Number.isFinite(aTime)) return Number.isFinite(bTime) ? 1 : 0;
            if (!Number.isFinite(bTime)) return -1;
            return bTime - aTime;
        });

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
