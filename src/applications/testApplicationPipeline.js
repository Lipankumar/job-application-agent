const {
    processJob
} = require("./applicationPipeline");

const job = {
    id: "job-001",
    title: "Backend Engineer",
    company: "Example Tech",
    location: "Bangalore"
};

const matchResult = {
    matchScore: 84,
    strongSkills: [
        "Node.js",
        "TypeScript",
        "REST API"
    ],
    missingSkills: [
        "Kubernetes"
    ]
};

const eligibilityResult = {
    eligible: true,

    checks: {
        matchScore: true,
        location: true,
        experience: true,
        notAlreadyApplied: true,
        safety: true
    },

    reason: "All eligibility checks passed"
};

const result = processJob(
    job,
    matchResult,
    eligibilityResult
);

console.log("\nFinal Result:");
console.log(result);