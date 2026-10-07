const ApplicationAgent = require("./applicationAgent");

const agent = new ApplicationAgent();

const jobs = [
    {
        id: "job-001",
        title: "Backend Engineer",
        company: "Company A",
        matchScore: 87,
        url: "https://example.com/job/1",
        source: "naukri"
    },
    {
        id: "job-002",
        title: "Node.js Developer",
        company: "Company B",
        matchScore: 83,
        url: "https://example.com/job/2",
        source: "linkedin"
    },
    {
        id: "job-003",
        title: "SDE-2 Backend",
        company: "Company C",
        matchScore: 79,
        url: "https://example.com/job/3",
        source: "naukri"
    }
];

async function main() {
    try {
        agent.addJobs(jobs);

        await agent.processBatch();

    } catch (error) {
        console.error("\n❌ Batch failed:");
        console.error(error.message);
    }
}

main();