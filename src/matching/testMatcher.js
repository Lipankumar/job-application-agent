const { matchJob } = require("./jobMatcher");

const candidate = {
    experience: {
        years: 3.9
    },

    skills: [
        "Node.js",
        "JavaScript",
        "TypeScript",
        "MongoDB",
        "MySQL",
        "Redis",
        "RabbitMQ",
        "System Design"
    ],

    targetRoles: [
        "SDE-2",
        "Backend Engineer",
        "Node.js Developer"
    ],

    preferredLocations: [
        "Bangalore",
        "Bengaluru",
        "Remote"
    ]
};


const job = {
    title: "SDE-2 Backend Engineer",

    company: "ABC Technologies",

    location: "Bangalore",

    experience: "3",

    skills: [
        "Node.js",
        "TypeScript",
        "MongoDB",
        "Redis",
        "Kafka"
    ],

    description: "Backend development using Node.js and TypeScript.",

    url: "https://example.com/job",

    source: "Naukri"
};


const result = matchJob(job, candidate);

console.log(JSON.stringify(result, null, 2));