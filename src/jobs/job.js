function createJob({
    id,
    title,
    company,
    location,
    url,
    source,
    skills = [],
    description = "",
    experience = null,
    matchScore = null,
    postedAt = null
}) {
    return {
        id: id || `${source}-${Date.now()}`,

        title,
        company,
        location,
        url,
        source,

        skills,
        description,
        experience,

        matchScore,
        postedAt
    };
}

module.exports = {
    createJob
};