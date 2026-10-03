const {
    searchNaukriJobs
} = require("./naukriJobSearch");

const {
    parseNaukriJobs
} = require("./naukriJobParser");


async function discoverNaukriJobs({
    keyword = "Node.js Backend Developer",
    location = "Bangalore",
    experience = "3"
} = {}) {

    console.log("\n================================");
    console.log("Naukri Job Discovery Started");
    console.log("================================\n");

    // Step 1: Search Naukri
    const rawJobs = await searchNaukriJobs({
        keyword,
        location,
        experience
    });

    console.log(
        `Raw jobs found: ${rawJobs.length}`
    );

    // Step 2: Parse / normalize
    const jobs = parseNaukriJobs(rawJobs);

    console.log(
        `Valid jobs after parsing: ${jobs.length}`
    );

    // Step 3: Display jobs
    jobs.forEach((job, index) => {

        console.log("\n----------------------------");

        console.log(`Job #${index + 1}`);
        console.log(`Title      : ${job.title}`);
        console.log(`Company    : ${job.company}`);
        console.log(`Location   : ${job.location}`);
        console.log(`Experience : ${job.experience}`);
        console.log(`Salary     : ${job.salary}`);
        console.log(`URL        : ${job.url}`);

    });

    console.log("\n================================");
    console.log("Naukri Job Discovery Completed");
    console.log("================================\n");

    return jobs;
}


// Run directly
if (require.main === module) {

    discoverNaukriJobs({
        keyword: "Node.js Backend Developer",
        location: "Bangalore",
        experience: "3"
    });
}


module.exports = {
    discoverNaukriJobs
};