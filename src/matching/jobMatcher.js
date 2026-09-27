function normalize(value) {
    return value
        .toLowerCase()
        .trim();
}

function normalizeArray(values = []) {
    return values.map(normalize);
}

function matchSkills(jobSkills = [], candidateSkills = []) {

    const normalizedJobSkills = normalizeArray(jobSkills);
    const normalizedCandidateSkills = normalizeArray(candidateSkills);

    const matchedSkills = normalizedJobSkills.filter(skill =>
        normalizedCandidateSkills.includes(skill)
    );

    const missingSkills = normalizedJobSkills.filter(skill =>
        !normalizedCandidateSkills.includes(skill)
    );

    return {
        matchedSkills,
        missingSkills
    };
}


function matchExperience(jobExperience, candidateExperience) {

    if (!jobExperience) {
        return true;
    }

    const requiredYears = parseFloat(jobExperience);

    if (isNaN(requiredYears)) {
        return true;
    }

    return candidateExperience >= requiredYears;
}


function matchLocation(jobLocation, preferredLocations = []) {

    if (!jobLocation || preferredLocations.length === 0) {
        return true;
    }

    const normalizedJobLocation = normalize(jobLocation);

    return preferredLocations.some(location =>
        normalizedJobLocation.includes(normalize(location))
    );
}


function matchRole(jobTitle, targetRoles = []) {

    if (!jobTitle || targetRoles.length === 0) {
        return true;
    }

    const normalizedJobTitle = normalize(jobTitle);

    return targetRoles.some(role =>
        normalizedJobTitle.includes(normalize(role))
    );
}


function calculateScore({
    skillMatchPercentage,
    experienceMatch,
    locationMatch,
    roleMatch
}) {

    let score = 0;

    // Skills = 50%
    score += skillMatchPercentage * 0.5;

    // Experience = 20%
    if (experienceMatch) {
        score += 20;
    }

    // Location = 15%
    if (locationMatch) {
        score += 15;
    }

    // Role = 15%
    if (roleMatch) {
        score += 15;
    }

    return Math.round(score);
}


function matchJob(job, candidate) {

    const {
        matchedSkills,
        missingSkills
    } = matchSkills(
        job.skills || [],
        candidate.skills || []
    );

    const totalJobSkills = job.skills?.length || 0;

    const skillMatchPercentage =
        totalJobSkills === 0
            ? 100
            : (matchedSkills.length / totalJobSkills) * 100;

    const experienceMatch = matchExperience(
        job.experience,
        candidate.experience?.years || 0
    );

    const locationMatch = matchLocation(
        job.location,
        candidate.preferredLocations || []
    );

    const roleMatch = matchRole(
        job.title,
        candidate.targetRoles || []
    );

    const score = calculateScore({
        skillMatchPercentage,
        experienceMatch,
        locationMatch,
        roleMatch
    });

    return {
        matched: score >= 70,
        score,

        matchedSkills,
        missingSkills,

        experienceMatch,
        locationMatch,
        roleMatch
    };
}


module.exports = {
    matchJob
};