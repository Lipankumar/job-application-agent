require("dotenv").config();
async function loginToNaukri(page) {
    const email = process.env.NAUKRI_EMAIL;
    const password = process.env.NAUKRI_PASSWORD;

    if (!email || !password) {
        throw new Error(
            "NAUKRI_EMAIL or NAUKRI_PASSWORD is missing from .env"
        );
    }

    console.log("Opening Naukri login page...");

    await page.goto("https://www.naukri.com/nlogin/login", {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await page.waitForTimeout(3000);

    const emailInput = page.locator(
        'input[placeholder*="Email"], input[type="email"], input[name="email"]'
    ).first();

    const passwordInput = page.locator(
        'input[type="password"], input[placeholder*="password" i]'
    ).first();

    await emailInput.waitFor({
        state: "visible",
        timeout: 15000
    });

    await emailInput.fill(email);
    await passwordInput.fill(password);

    console.log("Login credentials entered.");

    const loginButton = page.locator(
        'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")'
    ).first();

    await loginButton.click();

    await page.waitForTimeout(5000);

    console.log("Login attempt completed.");

    // Verify login
    const currentUrl = page.url();

    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes("/nlogin/login")) {
        throw new Error(
            "Naukri login was not successful. Still on login page."
        );
    }

    console.log("✅ Naukri login successful.");

    return true;
}

module.exports = {
    loginToNaukri
};