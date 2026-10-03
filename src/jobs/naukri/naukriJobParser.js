function normalizeText(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/\s+/g, " ")
        .trim();
}


function parseNaukriJob(rawJob = {}) {

    return {
        platform: "naukri",

        title: normalizeText(rawJob.title),

        company: normalizeText(rawJob.company),

        location: normalizeText(rawJob.location),

        experience: normalizeText(rawJob.experience),

        salary: normalizeText(rawJob.salary),

        description: normalizeText(rawJob.description),

        url: normalizeText(rawJob.url),

        source: "naukri",

        scrapedAt: new Date().toISOString()
    };
}


function parseNaukriJobs(rawJobs = []) {

    if (!Array.isArray(rawJobs)) {
        return [];
    }

    return rawJobs
        .filter(job => job && normalizeText(job.title))
        .map(parseNaukriJob);
}


module.exports = {
    normalizeText,
    parseNaukriJob,
    parseNaukriJobs
};