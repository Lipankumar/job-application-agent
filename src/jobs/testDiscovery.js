const { discoverJobs } = require("./discovery/jobDiscovery");
const { saveJobs, getJobs } = require("./storage/jobStore");
const { removeDuplicates } = require("./storage/jobDeduplicator");

async function main() {

    console.log("Starting job discovery...");

    const jobs = await discoverJobs();

    console.log("Jobs discovered:", jobs.length);

    const uniqueJobs = removeDuplicates(jobs);

    console.log("Unique jobs:", uniqueJobs.length);

    saveJobs(uniqueJobs);

    const storedJobs = getJobs();

    console.log("Jobs stored:", storedJobs.length);
}

main();