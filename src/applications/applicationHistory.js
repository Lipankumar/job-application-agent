const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(
    __dirname,
    "../data/applicationHistory.json"
);

function ensureHistoryFile() {
    const directory = path.dirname(HISTORY_FILE);

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    if (!fs.existsSync(HISTORY_FILE)) {
        fs.writeFileSync(
            HISTORY_FILE,
            JSON.stringify([], null, 2)
        );
    }
}

function getHistory() {
    ensureHistoryFile();

    const data = fs.readFileSync(
        HISTORY_FILE,
        "utf-8"
    );

    return JSON.parse(data);
}

function saveHistory(history) {
    ensureHistoryFile();

    fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(history, null, 2)
    );
}

function generateApplicationId() {
    return `app_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;
}

function addApplication(application) {
    const history = getHistory();

    const record = {
        id:
            application.id ||
            generateApplicationId(),

        date:
            application.date ||
            new Date().toISOString().split("T")[0],

        platform:
            application.platform ||
            "unknown",

        company:
            application.company ||
            "unknown",

        jobTitle:
            application.jobTitle ||
            "unknown",

        jobUrl:
            application.jobUrl ||
            null,

        matchScore:
            application.matchScore ?? null,

        status:
            application.status ||
            "UNKNOWN",

        failureReason:
            application.failureReason ||
            null
    };

    history.push(record);

    saveHistory(history);

    return record;
}

function updateApplicationStatus(
    applicationId,
    status,
    failureReason = null
) {
    const history = getHistory();

    const application = history.find(
        item => item.id === applicationId
    );

    if (!application) {
        throw new Error(
            `Application not found: ${applicationId}`
        );
    }

    application.status = status;

    application.failureReason =
        failureReason;

    application.lastUpdatedAt =
        new Date().toISOString();

    saveHistory(history);

    return application;
}

function getApplicationsByDate(date) {
    const history = getHistory();

    return history.filter(
        application =>
            application.date === date
    );
}

function getApplicationsByStatus(status) {
    const history = getHistory();

    return history.filter(
        application =>
            application.status === status
    );
}

function hasAlreadyApplied(jobUrl) {
    if (!jobUrl) {
        return false;
    }

    const history = getHistory();

    return history.some(
        application =>
            application.jobUrl === jobUrl &&
            application.status === "APPLIED"
    );
}

function getApplicationById(applicationId) {
    const history = getHistory();

    return (
        history.find(
            application =>
                application.id === applicationId
        ) || null
    );
}

module.exports = {
    getHistory,
    saveHistory,
    addApplication,
    updateApplicationStatus,
    getApplicationsByDate,
    getApplicationsByStatus,
    hasAlreadyApplied,
    getApplicationById
};