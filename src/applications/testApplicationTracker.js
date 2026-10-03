const {
    trackApplication,
    updateApplicationStatus
} = require("./applicationTracker");

const job = {
    jobId: "linkedin-12345",
    company: "ABC Technologies",
    jobTitle: "Backend Engineer",
    jobUrl: "https://example.com/job/12345",
    source: "linkedin",
    location: "Bangalore",
    matchScore: 87
};

console.log("Tracking job...");

const result = trackApplication(job);

console.log(result);

console.log("\nUpdating status...");

const updated = updateApplicationStatus(
    job.jobId,
    "APPLIED"
);

console.log(updated);