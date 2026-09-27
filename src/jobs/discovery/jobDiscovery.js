const { createJob } = require("../job");

async function discoverJobs() {

    const jobs = [];

    // Temporary test job
    const job = createJob({
        title: "Node.js Backend Developer",
        company: "Test Company",
        location: "Bangalore",
        url: "https://example.com/job/123",
        source: "test",
        description: `
            Looking for a Node.js backend developer
            with experience in JavaScript, MongoDB,
            Redis and REST APIs.
        `,
        experience: "3-5 years"
    });

    jobs.push(job);

    return jobs;
}

module.exports = {
    discoverJobs
};