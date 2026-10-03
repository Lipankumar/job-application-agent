const {
    trackApplication
} = require("./applicationTracker");


// ================================
// Successful application
// ================================

trackApplication({
    platform: "naukri",
    company: "ABC Technologies",
    jobTitle: "SDE-2",
    jobUrl: "https://example.com/job/101",
    matchScore: 88,
    status: "APPLIED"
});


// ================================
// Failed application
// ================================

trackApplication({
    platform: "linkedin",
    company: "XYZ Technologies",
    jobTitle: "Backend Engineer",
    jobUrl: "https://example.com/job/102",
    matchScore: 81,
    status: "FAILED",
    failureReason: "Login required"
});


// ================================
// Skipped application
// ================================

trackApplication({
    platform: "naukri",
    company: "Random Tech",
    jobTitle: "Frontend Developer",
    jobUrl: "https://example.com/job/103",
    matchScore: 45,
    status: "SKIPPED",
    failureReason: "Match score below threshold"
});


console.log("\nApplication flow completed.");