function getJobKey(job) {

    return `${job.company}|${job.title}|${job.location}`
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function removeDuplicates(jobs) {

    const seen = new Set();
    const uniqueJobs = [];

    for (const job of jobs) {

        const key = getJobKey(job);

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        uniqueJobs.push(job);
    }

    return uniqueJobs;
}

module.exports = {
    getJobKey,
    removeDuplicates
};