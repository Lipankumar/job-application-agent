require("dotenv").config();

const profile = require("./candidate.json");

function numberFromEnv(key, fallback) {
    const value = process.env[key];
    if (value === undefined || value.trim() === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function booleanFromEnv(key, fallback) {
    const value = process.env[key];
    if (value === undefined || value.trim() === "") return fallback;
    return value.trim().toLowerCase() === "true";
}

module.exports = {
    ...profile,
    name: process.env.CANDIDATE_NAME || "",
    email: process.env.CANDIDATE_EMAIL || "",
    phone: process.env.CANDIDATE_PHONE || "",
    location: process.env.CANDIDATE_LOCATION || "",
    experience: {
        ...profile.experience,
        years: numberFromEnv("CANDIDATE_EXPERIENCE_YEARS", profile.experience?.years),
        level: process.env.CANDIDATE_EXPERIENCE_LEVEL || profile.experience?.level || "",
        currentRole: process.env.CANDIDATE_CURRENT_ROLE || "",
        currentCompany: process.env.CANDIDATE_CURRENT_COMPANY || "",
        primaryDomain: process.env.CANDIDATE_PRIMARY_DOMAIN || ""
    },
    noticePeriod: {
        ...profile.noticePeriod,
        days: numberFromEnv("CANDIDATE_NOTICE_PERIOD_DAYS", profile.noticePeriod?.days),
        currentlyServing: booleanFromEnv(
            "CANDIDATE_CURRENTLY_SERVING_NOTICE",
            profile.noticePeriod?.currentlyServing
        )
    }
};
