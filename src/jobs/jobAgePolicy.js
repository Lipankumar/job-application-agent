function isOlderJobsEnabled(value = process.env.ENABLE_OLDER_JOBS) {
    return String(value ?? "false").trim().toLowerCase() === "true";
}

function shouldIncludeJobByAge(postedAt, maxAgeHours, includeOlderJobs = false, now = Date.now()) {
    if (!postedAt) return true;

    const postedTime = new Date(postedAt).getTime();
    if (!Number.isFinite(postedTime)) return true;

    const ageHours = (now - postedTime) / (60 * 60 * 1000);
    if (ageHours < 0) return false;
    return includeOlderJobs || ageHours <= maxAgeHours;
}

module.exports = {
    isOlderJobsEnabled,
    shouldIncludeJobByAge
};