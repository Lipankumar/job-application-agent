const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../../data");

const jobsFile = path.join(dataDir, "jobs.json");

function saveJobs(jobs) {

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
        jobsFile,
        JSON.stringify(jobs, null, 2)
    );

    console.log(`${jobs.length} jobs saved`);
}

function getJobs() {

    if (!fs.existsSync(jobsFile)) {
        return [];
    }

    const data = fs.readFileSync(jobsFile, "utf-8");

    return JSON.parse(data);
}

module.exports = {
    saveJobs,
    getJobs
};