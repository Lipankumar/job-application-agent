const {
    parseNaukriJobs
} = require("./naukriJobParser");


const rawJobs = [
    {
        title: "Senior Backend Engineer - Node.js",
        company: "ABC Technologies",
        location: "Bangalore",
        experience: "3-6 Yrs",
        salary: "15-25 LPA",
        description:
            "Looking for backend engineer with Node.js, Redis, Kafka and MySQL experience.",
        url: "https://www.naukri.com/job-123"
    },

    {
        title: "Node.js Developer",
        company: "XYZ Pvt Ltd",
        location: "Remote",
        experience: "3-5 Yrs",
        salary: "12-20 LPA",
        description:
            "Node.js developer required for backend API development.",
        url: "https://www.naukri.com/job-456"
    }
];


const parsedJobs = parseNaukriJobs(rawJobs);


console.log(
    JSON.stringify(parsedJobs, null, 2)
);