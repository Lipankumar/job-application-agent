require("dotenv").config();

function getInstahyreCredentials() {
    const email = process.env.INSTAHYRE_EMAIL || process.env.CANDIDATE_EMAIL || process.env.NAUKRI_EMAIL;
    const password = process.env.INSTAHYRE_PASSWORD || process.env.NAUKRI_PASSWORD;

    if (!email || !password) {
        throw new Error("INSTAHYRE_EMAIL / INSTAHYRE_PASSWORD are missing from .env. Fallbacks: CANDIDATE_EMAIL / NAUKRI_PASSWORD");
    }

    return { email, password };
}

async function loginToInstahyre(page) {
    const { email, password } = getInstahyreCredentials();

    console.log("Opening Instahyre login page...");
    await page.goto("https://www.instahyre.com/login/", {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    if (currentUrl.includes("instahyre.com") && !currentUrl.includes("/login")) {
        console.log(`✅ Existing Instahyre session detected: ${currentUrl}`);
        return true;
    }

    const emailInput = page.locator([
        'input[type="email"]',
        'input[name*="email" i]',
        'input[placeholder*="email" i]',
        'input[type="text"][name*="email" i]'
    ].join(", ")).first();

    try {
        await emailInput.waitFor({ state: "visible", timeout: 15000 });
    } catch {
        const pageText = await page.locator("body").innerText().catch(() => "");
        if (/captcha|verify you are human|unusual traffic|access denied|not secure/i.test(pageText)) {
            throw new Error(
                `Instahyre is showing a security check instead of the login form (${page.url()}). Complete it in Chrome, then rerun the agent.`
            );
        }

        throw new Error(
            `Instahyre login form was not found (${page.url()}). The page may have changed or blocked automation.`
        );
    }

    const passwordInput = page.locator([
        'input[type="password"]',
        'input[name*="password" i]',
        'input[placeholder*="password" i]'
    ].join(", ")).first();

    if (!(await passwordInput.isVisible().catch(() => false))) {
        throw new Error(`Instahyre showed an email field but no password field (${page.url()}).`);
    }

    await emailInput.fill(email);
    await passwordInput.fill(password);

    console.log("Login credentials entered.");

    const loginButton = page.locator([
        'button[type="submit"]',
        'button:has-text("Log in")',
        'button:has-text("Login")',
        'button:has-text("Sign in")',
        'input[type="submit"]'
    ].join(", ")).first();

    if (!(await loginButton.isVisible().catch(() => false))) {
        throw new Error(`Instahyre login button was not found (${page.url()}).`);
    }

    await loginButton.click();
    await page.waitForTimeout(6000);

    const settledUrl = page.url();
    if (settledUrl.includes("/login") || settledUrl.includes("/candidates/register")) {
        const pageText = await page.locator("body").innerText().catch(() => "");
        const message = pageText.match(/invalid.*(email|password)|incorrect.*(email|password)|check.*(email|password)|login failed|couldn.t sign you in/i);
        if (message) {
            throw new Error(`Instahyre login did not complete: ${message[0]}`);
        }
    }

    console.log("✅ Instahyre login successful.");
    return true;
}

module.exports = { loginToInstahyre, getInstahyreCredentials };
