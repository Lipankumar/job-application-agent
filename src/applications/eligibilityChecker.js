function normalize(value = "") {
    return value
        .toLowerCase()
        .trim();
}

function locationMatches(job, candidate) {
    const jobLocations = (job.locations || []).map(normalize);
    const preferredLocations = (candidate.preferredLocations || []).map(normalize);

    if (jobLocations.length === 0) {
        return false;
    }

    return jobLocations.some(jobLocation =>
        preferredLocations.some(preferredLocation =>
            jobLocation.includes(preferredLocation) ||
            preferredLocation.includes(jobLocation)
        )
    );
}

function experienceMatches(job, candidate) {
    const candidateExperience = Number(candidate.experience || 0);

    const minExperience = Number(job.minExperience || 0);
    const maxExperience = Number(job.maxExperience || Infinity);

    return (
        candidateExperience >= minExperience &&
        candidateExperience <= maxExperience
    );
}

function matchScorePassed(job) {
    return Number(job.matchScore || 0) >= 70;
}

function notAlreadyApplied(job, applicationTracker) {
    return !applicationTracker.some(
        application =>
            application.jobId === job.id
    );
}

function checkEligibility({
    job,
    candidate,
    applicationTracker = [],
    safetyPassed = false
}) {

    const checks = {
        matchScore: matchScorePassed(job),
        location: locationMatches(job, candidate),
        experience: experienceMatches(job, candidate),
        notAlreadyApplied: notAlreadyApplied(
            job,
            applicationTracker
        ),
        safety: safetyPassed
    };

    const eligible = Object.values(checks).every(Boolean);

    return {
        eligible,
        checks,
        reason: eligible
            ? "All eligibility checks passed"
            : "One or more eligibility checks failed"
    };
}

module.exports = {
    checkEligibility,
    locationMatches,
    experienceMatches,
    matchScorePassed,
    notAlreadyApplied
};