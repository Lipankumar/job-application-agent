const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const APPLICATION_FILE = path.join(DATA_DIR, "applications.json");

function ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(APPLICATION_FILE)) {
        fs.writeFileSync(
            APPLICATION_FILE,
            JSON.stringify([], null, 2)
        );
    }
}

function getApplications() {
    ensureStorage();

    const data = fs.readFileSync(APPLICATION_FILE, "utf-8");

    return JSON.parse(data);
}

function saveApplications(applications) {
    ensureStorage();

    fs.writeFileSync(
        APPLICATION_FILE,
        JSON.stringify(applications, null, 2)
    );
}

function addApplication(application) {
    const applications = getApplications();

    applications.push(application);

    saveApplications(applications);

    return application;
}

module.exports = {
    getApplications,
    saveApplications,
    addApplication
};