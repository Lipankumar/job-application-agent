async function loginToHirist(page) {
    // Hirist exposes Google sign-in in its registration flow. Its /login route
    // currently renders only the public jobs page for browser automation.
    await page.goto("https://www.hirist.tech/register", {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });
    await page.waitForTimeout(1500);

    const isHiristSignedIn = async targetPage => {
        if (targetPage.isClosed()) return false;
        const url = targetPage.url();
        if (!/hirist\.tech$/i.test(new URL(url).hostname)) return false;
        const text = await targetPage.locator("body").innerText().catch(() => "");
        return /logout|my profile|my account/i.test(text) ||
            (!/\/login|\/register/i.test(new URL(url).pathname));
    };

    if (await isHiristSignedIn(page)) {
        console.log("✅ Existing Hirist session detected.");
        return true;
    }

    const googleControl = page.locator([
        'button:has-text("Google")',
        'a:has-text("Google")',
        '[role="button"]:has-text("Google")',
        '[aria-label*="Google" i]',
        '[title*="Google" i]',
        'iframe[title*="Google" i]'
    ].join(", ")).first();
    const googleText = page.getByText(/continue with google/i).first();

    const googleVisible = await googleControl.isVisible().catch(() => false) ||
        await googleText.isVisible().catch(() => false);
    if (googleVisible) {
        if (await googleControl.isVisible().catch(() => false)) {
            await googleControl.click();
        } else {
            await googleText.click();
        }
        console.log("Complete Google account selection and any verification in the agent's Chrome window.");
    } else {
        console.log("Hirist did not expose its Google button to automation. Use the agent's Chrome window to open Login/Register and choose Continue with Google.");
    }

    const deadline = Date.now() + 120000;
    let signedIn = false;
    while (Date.now() < deadline) {
        for (const targetPage of page.context().pages()) {
            if (await isHiristSignedIn(targetPage)) {
                signedIn = true;
                break;
            }
        }
        if (signedIn) break;
        await page.waitForTimeout(1000);
    }
    if (!signedIn) {
        throw new Error("Hirist sign-in was not completed within 2 minutes. Sign in through Google in the agent's Chrome window, then rerun.");
    }

    console.log("✅ Hirist sign-in completed.");
    return true;
}

module.exports = { loginToHirist };
