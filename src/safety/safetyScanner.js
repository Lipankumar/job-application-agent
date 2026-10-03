const {
    CAPTCHA_PATTERNS,
    SENSITIVE_PATTERNS,
    SUSPICIOUS_PATTERNS
} = require("./safetyRules");

function normalize(text = "") {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function containsPattern(text, patterns) {

    const normalizedText = normalize(text);

    return patterns.some(pattern =>
        normalizedText.includes(
            normalize(pattern)
        )
    );
}

function getFieldText(field) {

    return normalize(
        [
            field.name,
            field.id,
            field.placeholder,
            field.ariaLabel,
            field.type,
            field.text
        ]
            .filter(Boolean)
            .join(" ")
    );
}

function scanField(field) {

    const fieldText = getFieldText(field);

    // CAPTCHA
    if (
        containsPattern(
            fieldText,
            CAPTCHA_PATTERNS
        )
    ) {
        return {
            safe: false,
            type: "CAPTCHA",
            reason: "CAPTCHA detected",
            field: fieldText
        };
    }

    // Sensitive information
    if (
        containsPattern(
            fieldText,
            SENSITIVE_PATTERNS
        )
    ) {
        return {
            safe: false,
            type: "SENSITIVE_FIELD",
            reason: "Sensitive field detected",
            field: fieldText
        };
    }

    // Suspicious instructions
    if (
        containsPattern(
            fieldText,
            SUSPICIOUS_PATTERNS
        )
    ) {
        return {
            safe: false,
            type: "SUSPICIOUS_FIELD",
            reason: "Suspicious field detected",
            field: fieldText
        };
    }

    return {
        safe: true
    };
}

function scanForm(fields = []) {

    const findings = [];

    for (const field of fields) {

        const result = scanField(field);

        if (!result.safe) {
            findings.push(result);
        }
    }

    return {
        safe: findings.length === 0,
        findings
    };
}

module.exports = {
    scanField,
    scanForm
};