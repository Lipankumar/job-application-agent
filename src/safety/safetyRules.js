const CAPTCHA_PATTERNS = [
    "captcha",
    "recaptcha",
    "hcaptcha",
    "i am not a robot",
    "verify you are human",
    "verify human"
];

const SENSITIVE_PATTERNS = [
    "password",
    "credit card",
    "card number",
    "cvv",
    "bank account",
    "bank account number",
    "otp",
    "one time password",
    "transaction password"
];

const SUSPICIOUS_PATTERNS = [
    "install extension",
    "install software",
    "download software",
    "run command",
    "send money",
    "payment required",
    "pay to apply"
];

module.exports = {
    CAPTCHA_PATTERNS,
    SENSITIVE_PATTERNS,
    SUSPICIOUS_PATTERNS
};