const {
    discoverNaukriJobs
} = require("./naukriJobDiscovery");

const {
    matchJob
} = require("../../matching/jobMatcher");

const fs = require("fs");
const path = require("path");


function loadCandidate() {

    const candidatePath = path.join(
        __dirname,
        "../../config/candidate.json"
    );

    const candidateData = fs.readFileSync(
        candidatePath,
        "utf-8"
    );

    return JSON.parse(candidateData);
}


/*
 * Convert Naukri experience text into
 * the minimum required experience.
 *
 * Examples:
 *
 * "3-5 Yrs"  -> 3
 * "4-8 Yrs"  -> 4
 * "5 Yrs"    -> 5
 */
function parseExperience(experienceText = "") {

    const match = experienceText.match(
        /(\d+(?:\.\d+)?)/
    );

    if (!match) {
        return null;
    }

    return parseFloat(match[1]);
}


/*
 * Convert job description into a basic
 * skill list that our existing matcher understands.
 *
 * We will improve this later with the LLM.
 */
function extractSkills(job) {

    const text = `
        ${job.title || ""}
        ${job.description || ""}
    `.toLowerCase();

    const knownSkills = [
        "node.js",
        "nodejs",
        "typescript",
        "javascript",
        "express.js",
        "express",
        "mongodb",
        "mysql",
        "postgresql",
        "redis",
        "kafka",
        "rabbitmq",
        "aws",
        "docker",
        "kubernetes",
        "microservices",
        "rest api",
        "rest apis",
        "elasticsearch",
        "nestjs",
        "graphql"
    ];

    const foundSkills = [];

    for (const skill of knownSkills) {

        if (text.includes(skill)) {

            let normalizedSkill = skill;

            if (skill === "nodejs") {
                normalizedSkill = "node.js";
            }

            if (skill === "express") {
                normalizedSkill = "express.js";
            }

            if (
                skill === "rest api" ||
                skill === "rest apis"
            ) {
                normalizedSkill = "rest apis";
            }

            if (!foundSkills.includes(normalizedSkill)) {
                foundSkills.push(normalizedSkill);
            }
        }
    }

    return foundSkills;
}


/*
 * Convert a Naukri job into the format
 * expected by matchJob().
 */
function convertNaukriJob(job) {

    return {
        title: job.title,

        company: job.company,

        location: job.location,

        experience: parseExperience(
            job.experience
        ),

        skills: extractSkills(job),

        description: job.description,

        url: job.url
    };
}


async function matchNaukriJobs() {

    console.log("\n================================");
    console.log("Naukri Job Matching Started");
    console.log("================================\n");


    const candidate = loadCandidate();


    const jobs = await discoverNaukriJobs({
        keyword: "Node.js Backend Developer",
        location: "Bangalore",
        experience: "3"
    });


    console.log(
        `Jobs received: ${jobs.length}`
    );


    const results = [];


    for (const [index, job] of jobs.entries()) {

        const normalizedJob =
            convertNaukriJob(job);


        const matchResult = matchJob(
            normalizedJob,
            candidate
        );


        const result = {
            job: normalizedJob,
            match: matchResult
        };


        results.push(result);


        console.log("\n----------------------------");

        console.log(
            `Job #${index + 1}`
        );

        console.log(
            "Title:",
            normalizedJob.title
        );

        console.log(
            "Company:",
            normalizedJob.company
        );

        console.log(
            "Location:",
            normalizedJob.location
        );

        console.log(
            "Experience:",
            normalizedJob.experience
        );

        console.log(
            "Detected Skills:",
            normalizedJob.skills
        );

        console.log(
            "Match Score:",
            matchResult.score
        );

        console.log(
            "Matched:",
            matchResult.matched
        );

        console.log(
            "Matched Skills:",
            matchResult.matchedSkills
        );

        console.log(
            "Missing Skills:",
            matchResult.missingSkills
        );

        console.log(
            "Experience Match:",
            matchResult.experienceMatch
        );

        console.log(
            "Location Match:",
            matchResult.locationMatch
        );

        console.log(
            "Role Match:",
            matchResult.roleMatch
        );
    }


    console.log("\n================================");
    console.log("Naukri Job Matching Completed");
    console.log("================================\n");


    return results;
}


if (require.main === module) {

    matchNaukriJobs();

}


module.exports = {
    matchNaukriJobs,
    convertNaukriJob,
    extractSkills,
    parseExperience
};