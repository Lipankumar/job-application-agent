const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

async function analyzeJob(jobDescription) {

    const prompt = `
You are a job description analyzer.

Analyze the following job description and return ONLY valid JSON.

Do not use markdown.
Do not use \`\`\`json.
Do not add any explanation.

Extract:

- jobTitle
- company
- experienceRequired
- requiredSkills
- preferredSkills
- location
- workMode
- salary
- noticePeriod
- employmentType
- responsibilities

If information is not available, use null.

Job Description:

${jobDescription}
`;

    const response = await client.chat.completions.create({
        model: "openrouter/free",

        messages: [
            {
                role: "system",
                content: "You extract structured information from job descriptions."
            },
            {
                role: "user",
                content: prompt
            }
        ],

        temperature: 0
    });

    let result = response.choices[0].message.content;

    console.log("LLM RAW RESPONSE:");
    console.log(result);

    // Remove markdown code fences
    result = result
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    return JSON.parse(result);
}

module.exports = {
    analyzeJob
};