const {
    hasAlreadyApplied
} = require("./applicationHistory");


function canApply(job) {

    if (!job.jobUrl) {
        return {
            allowed: false,
            reason: "Job URL is missing"
        };
    }


    if (hasAlreadyApplied(job.jobUrl)) {
        return {
            allowed: false,
            reason: "Already applied to this job"
        };
    }


    return {
        allowed: true,
        reason: null
    };
}


module.exports = {
    canApply
};