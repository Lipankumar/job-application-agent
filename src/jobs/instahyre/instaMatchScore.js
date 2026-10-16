const DEFAULT_INSTAHYRE_MATCH_THRESHOLD = 70;

function getInstahyreMatchThreshold(value = process.env.INSTAHYRE_MATCH_THRESHOLD) {
    if (value === undefined || String(value).trim() === "") {
        return DEFAULT_INSTAHYRE_MATCH_THRESHOLD;
    }

    const threshold = Number(value);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
        throw new Error("INSTAHYRE_MATCH_THRESHOLD must be a number from 0 to 100.");
    }

    return threshold;
}

function parseInstahyreMatchScore(text = "") {
    const normalizedText = String(text).replace(/\s+/g, " ").trim();
    const match = normalizedText.match(
        /\b(?:your\s+)?instamatch\s+score\b\s*(?:is\s*)?[:\-]?\s*(\d{1,3}(?:\.\d+)?)\s*%?/i
    );

    if (!match) return null;

    const score = Number(match[1]);
    return score <= 100 ? score : null;
}

module.exports = {
    DEFAULT_INSTAHYRE_MATCH_THRESHOLD,
    getInstahyreMatchThreshold,
    parseInstahyreMatchScore
};