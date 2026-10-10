const { chromium } = require("playwright");
const browserConfig = require("../browser/browserConfig");
const { detectForm } = require("../browser/formDetector");
const { scanForm } = require("../safety/safetyScanner");

const {fillForm} = require("../browser/formFiller");

class ApplicationSession {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async start() {
        this.context = await chromium.launchPersistentContext(
            browserConfig.userDataDir,
            {
                headless: browserConfig.headless,
                slowMo: browserConfig.slowMo,
                channel: browserConfig.channel
            }
        );

        this.page = this.context.pages()[0] || await this.context.newPage();

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

        // Search results usually link to a job detail page. Open its Apply
        // action first so the form filler works on the application form.
        const applyAction = this.page
            .locator("a, button, [role='button']")
            .filter({ hasText: /^\s*apply(?:\s+now)?\s*$/i })
            .first();

        if (await applyAction.count()) {
            const popupPromise = this.context.waitForEvent("page", {
                timeout: 1500
            }).catch(() => null);

            await applyAction.click({ timeout: 5000 }).catch(() => {});
            const popup = await popupPromise;

            if (popup) {
                this.page = popup;
            }

            await this.page.waitForLoadState("domcontentloaded", {
                timeout: 10000
            }).catch(() => {});
            await this.page.waitForTimeout(1500);
        }

        console.log(`✅ Page loaded: ${this.page.url()}`);
    }

    async detectAndFill(candidateData) {
        console.log("🔎 Detecting application form...");

        await this.page
            .locator("input:visible, textarea:visible, select:visible")
            .first()
            .waitFor({ state: "visible", timeout: 8000 })
            .catch(() => {});

        const fields = await detectForm(this.page);

        console.log(`🧩 Detected ${fields.length} fields`);

        console.log("✍️ Filling safe fields...");

        const filledFields = await fillForm(this.page, candidateData, fields);

        if (filledFields.length === 0) {
            console.log(
                `⚠️ No supported blank fields were found on ${this.page.url()}. The page may still be on a redirect, login, or external application step.`
            );
        } else {
            console.log(`✅ Autofilled ${filledFields.length} field(s)`);
        }

        return filledFields;
    }

    async submitApplication() {
        const fields = await detectForm(this.page);
        const safety = scanForm(fields);

        if (!safety.safe) {
            return {
                submitted: false,
                reason: `Safety check stopped submission (${safety.findings.map(item => item.type).join(", ")})`
            };
        }

        const invalidFields = this.page.locator(":invalid");
        const invalidCount = await invalidFields.count();

        if (invalidCount > 0) {
            const invalidDetails = await invalidFields.evaluateAll(elements => elements.map(element => {
                const label = element.labels
                    ? Array.from(element.labels, item => item.innerText).join(" ")
                    : "";
                return label || element.getAttribute("aria-label") ||
                    element.getAttribute("placeholder") || element.name || element.id || element.type || "unnamed field";
            }));

            return {
                submitted: false,
                reason: `Required or invalid fields need attention: ${invalidDetails.join(", ")}`
            };
        }

        const submitSelector = "button, input[type='submit'], [role='button']";
        const submitIndex = await this.page.locator(submitSelector).evaluateAll(elements =>
            elements.findIndex(element => {
                const text = (element.innerText || element.value || element.getAttribute("aria-label") || "").trim();
                return element.getClientRects().length > 0 &&
                    /^(?:submit|submit application|apply|apply now)$/i.test(text);
            })
        );

        if (submitIndex < 0) {
            return {
                submitted: false,
                reason: "No clear application submit button was found"
            };
        }

        await this.page.locator(submitSelector).nth(submitIndex).click({ timeout: 5000 });
        await this.page.waitForTimeout(3000);

        const confirmationText = await this.page.locator("body").innerText();
        const confirmed = /application (?:has been )?submitted|successfully applied|applied successfully|application sent|thank you for applying|already applied/i
            .test(confirmationText);

        return {
            submitted: confirmed,
            reason: confirmed
                ? null
                : "Submit action was clicked, but the site did not confirm receipt"
        };
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
