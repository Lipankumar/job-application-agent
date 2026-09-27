function createJob({
    title,
    company,
    location,
    url,
    source,
    description = "",
    experience = null
}) {
    return {
        title,
        company,
        location,
        url,
        source,
        description,
        experience,
        discoveredAt: new Date().toISOString()
    };
}

module.exports = {
    createJob
};