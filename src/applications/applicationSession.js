const { chromium } = require("playwright");

const {detectForm} = require("../browser/formDetector");
const {fillForm} = require("../browser/formFiller");

class ApplicationSession {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async start() {
        this.context = await chromium.launchPersistentContext(
            "./browser-profile",
            {
                headless: false
            }
        );

        this.page = await this.context.newPage();

        console.log("🌐 Browser started");
    }

    async openJob(url) {
        if (!this.page) {
            throw new Error("Browser session not started");
        }

        console.log(`🔗 Opening: ${url}`);

        await this.page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        await this.page.waitForTimeout(2000);

        console.log(`✅ Page loaded: ${this.page.url()}`);
    }

    async detectAndFill(candidateData) {
        console.log("🔎 Detecting application form...");

        const fields = await detectForm(this.page);

        console.log(`🧩 Detected ${fields.length} fields`);

        console.log("✍️ Filling safe fields...");

        await fillForm(this.page, candidateData, fields);

        console.log("✅ Autofill completed");
    }

    async close() {
        if (this.context) {
            await this.context.close();
        }

        this.browser = null;
        this.context = null;
        this.page = null;
    }
}

module.exports = ApplicationSession;