const {
    checkEligibility
} = require("./eligibilityChecker");

const candidate = {
    experience: "3.9",
    preferredLocations: [
        "Bangalore",
        "Remote"
    ]
};

const job = {
    id: "job-101",

    title: "SDE-2 Backend Engineer",

    matchScore: 82,

    locations: [
        "Bangalore"
    ],

    minExperience: 3,
    maxExperience: 5
};

const applicationTracker = [];

const safetyPassed = true;

const result = checkEligibility({
    job,
    candidate,
    applicationTracker,
    safetyPassed
});

console.log(
    JSON.stringify(result, null, 2)
);