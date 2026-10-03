const {
    addApplication
} = require("./applicationHistory");


function trackApplication({
    platform,
    company,
    jobTitle,
    jobUrl,
    matchScore,
    status,
    failureReason = null
}) {

    const record = addApplication({
        platform,
        company,
        jobTitle,
        jobUrl,
        matchScore,
        status,
        failureReason
    });

    console.log(
        `Application history saved: ${record.id}`
    );

    return record;
}


module.exports = {
    trackApplication
};