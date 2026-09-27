const { analyzeJob } = require("./jobAnalyzer");

async function main() {

    const jobDescription = `
    We are looking for an SDE-2 Backend Engineer.

    Requirements:
    - 3+ years of backend development experience
    - Strong experience with Node.js and TypeScript
    - Experience with MongoDB and Redis
    - Knowledge of Kafka
    - Experience with AWS
    - Strong system design skills

    Location: Bangalore
    Work Mode: Hybrid

    Notice period: Immediate to 30 days

    Responsibilities:
    - Design scalable backend services
    - Build REST APIs
    - Work with distributed systems
    - Improve application performance
    `;

    const result = await analyzeJob(jobDescription);

    console.log(
        JSON.stringify(result, null, 2)
    );
}

main();