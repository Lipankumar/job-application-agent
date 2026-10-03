const {
    canApply
} = require("./applicationGuard");


const jobs = [

    {
        company: "ABC Technologies",
        jobTitle: "SDE-2",
        jobUrl: "https://example.com/job/101"
    },

    {
        company: "New Company",
        jobTitle: "Backend Engineer",
        jobUrl: "https://example.com/job/999"
    }

];


for (const job of jobs) {

    const result = canApply(job);

    console.log("\n----------------------------");

    console.log(
        `${job.company} - ${job.jobTitle}`
    );

    console.log(
        "Allowed:",
        result.allowed
    );

    console.log(
        "Reason:",
        result.reason
    );
}
