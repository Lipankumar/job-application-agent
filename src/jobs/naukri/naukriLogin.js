require("dotenv").config();

async function loginToNaukri(page) {
    const email = process.env.NAUKRI_EMAIL;
    const password = process.env.NAUKRI_PASSWORD;

    if (!email || !password) {
        throw new Error("NAUKRI_EMAIL or NAUKRI_PASSWORD is missing from .env");
    }

    console.log("Opening Naukri login page...");

    await page.goto("https://www.naukri.com/nlogin/login", {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await page.waitForTimeout(1500);

    // Naukri has used both email and mobile/username fields, and its
    // placeholder casing varies. Match these attributes case-insensitively.
    const emailInput = page.locator([
        'input[type="email"]',
        'input[name*="email" i]',
        'input[name*="username" i]',
        'input[placeholder*="email" i]',
        'input[placeholder*="mobile" i]',
        'input[aria-label*="email" i]'
    ].join(", ")).first();

    try {
        await emailInput.waitFor({ state: "visible", timeout: 10000 });
    } catch {
        const currentUrl = page.url();

        // A saved Naukri session may redirect straight past the login page.
        if (
            currentUrl.includes("naukri.com") &&
            !currentUrl.includes("/nlogin/login")
        ) {
            console.log(`✅ Existing Naukri session detected: ${currentUrl}`);
            return true;
        }

        const pageText = await page.locator("body").innerText().catch(() => "");
        if (/captcha|verify you are human|unusual traffic|access denied/i.test(pageText)) {
            throw new Error(
                `Naukri is showing a security check instead of the login form (${currentUrl}). Complete it in Chrome, then rerun the agent.`
            );
        }

        const title = await page.title().catch(() => "unknown title");
        throw new Error(
            `Naukri login form was not found. Page title: "${title}"; URL: ${currentUrl}. The page may have changed or blocked automation.`
        );
    }

    const passwordInput = page.locator(
        'input[type="password"], input[placeholder*="password" i], input[name*="password" i]'
    ).first();

    if (!(await passwordInput.isVisible().catch(() => false))) {
        throw new Error(
            `Naukri showed an email/mobile field but no password field (${page.url()}). Select password login in Chrome and rerun.`
        );
    }

    await emailInput.fill(email);
    await passwordInput.fill(password);

    console.log("Login credentials entered.");

    const loginButton = page.locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")'
    ).first();

    if (!(await loginButton.isVisible().catch(() => false))) {
        throw new Error(`Naukri login button was not found (${page.url()}).`);
    }

    await loginButton.click();
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes("/nlogin/login")) {
        const pageText = await page.locator("body").innerText().catch(() => "");
        const message = pageText.match(/invalid[^\n]{0,100}|incorrect[^\n]{0,100}|captcha[^\n]{0,100}/i);
        throw new Error(
            message
                ? `Naukri login did not complete: ${message[0]}`
                : "Naukri login did not complete; the browser is still on the login page."
        );
    }

    console.log("✅ Naukri login successful.");
    return true;
}

module.exports = { loginToNaukri };
