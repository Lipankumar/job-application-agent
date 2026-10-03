const {
    addApplication,
    getHistory,
    getApplicationsByDate,
    getApplicationsByStatus
} = require("./applicationHistory");


// Add successful application
addApplication({
    platform: "naukri",
    company: "ABC Technologies",
    jobTitle: "SDE-2",
    jobUrl: "https://example.com/job/1",
    matchScore: 86,
    status: "APPLIED"
});


// Add failed application
addApplication({
    platform: "linkedin",
    company: "XYZ Tech",
    jobTitle: "Backend Engineer",
    jobUrl: "https://example.com/job/2",
    matchScore: 79,
    status: "FAILED",
    failureReason: "Login required"
});


// Add skipped application
addApplication({
    platform: "naukri",
    company: "Test Corp",
    jobTitle: "Node.js Developer",
    jobUrl: "https://example.com/job/3",
    matchScore: 54,
    status: "SKIPPED",
    failureReason: "Match score below threshold"
});


console.log("\n========== ALL APPLICATIONS ==========\n");

console.log(getHistory());


const today = new Date()
    .toISOString()
    .split("T")[0];

console.log("\n========== TODAY ==========\n");

console.log(
    getApplicationsByDate(today)
);


console.log("\n========== APPLIED ==========\n");

console.log(
    getApplicationsByStatus("APPLIED")
);