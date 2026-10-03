const { chromium } = require("playwright");
const { detectForm } = require("./formDetector");

async function main() {
    const browser = await chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

    await page.goto("https://www.linkedin.com/jobs/", {
        waitUntil: "domcontentloaded"
    });

    const form = await detectForm(page);

    console.log("\nDetected elements:\n");

    console.log(JSON.stringify(form, null, 2));

    await page.waitForTimeout(5000);

    await browser.close();
}

main().catch((error) => {
    console.error("Form detection failed:");
    console.error(error);
});