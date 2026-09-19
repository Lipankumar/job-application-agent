const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const { extractResumeText } = require("./extractResume");

require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function parseResume() {
  // 1. Resume path
  const resumePath = path.join(
    __dirname,
    "../documents/resume.pdf"
  );

  // 2. Extract resume text
  const resumeText = await extractResumeText(resumePath);

  console.log("✅ Resume text extracted");

  // 3. Send resume text to LLM
  const response = await client.chat.completions.create({
    model: "openrouter/free",

    messages: [
      {
        role: "system",
        content: `
You are a resume parser.

Extract ONLY information explicitly available in the resume.

Return valid JSON with exactly these fields:

{
  "name": "",
  "email": "",
  "phone": "",
  "experience": {
    "years": 0,
    "level": "",
    "currentRole": "",
    "primaryDomain": ""
  },
  "skills": []
}

Rules:
- Do not invent information.
- If information is missing, use an empty string.
- experience.years must be a number.
- skills must be an array.
- Return JSON only.
        `,
      },
      {
        role: "user",
        content: resumeText,
      },
    ],
  });

  // 4. Get LLM response
  const content = response.choices[0].message.content;

  console.log("===== LLM RESPONSE =====");
  console.log(content);

  // 5. Convert JSON string → JavaScript object
  const parsedResume = JSON.parse(content);

  // 6. Read existing candidate.json
  const candidatePath = path.join(
    __dirname,
    "../config/candidate.json"
  );

  const existingCandidate = JSON.parse(
    fs.readFileSync(candidatePath, "utf-8")
  );

  // 7. Merge resume data with existing candidate data
  const updatedCandidate = {
    ...existingCandidate,

    name: parsedResume.name || existingCandidate.name,
    email: parsedResume.email || existingCandidate.email,
    phone: parsedResume.phone || existingCandidate.phone,

    experience: {
      ...existingCandidate.experience,
      ...parsedResume.experience,
    },

    skills:
      parsedResume.skills?.length > 0
        ? parsedResume.skills
        : existingCandidate.skills,
  };

  // 8. Save updated candidate profile
  fs.writeFileSync(
    candidatePath,
    JSON.stringify(updatedCandidate, null, 2)
  );

  console.log("✅ candidate.json updated successfully");
}

parseResume().catch((error) => {
  console.error("❌ Resume parsing failed:");
  console.error(error);
});

module.exports = {
  parseResume,
};