const path = require("path");

const browserConfig = {
    headless: false,

    // Use the installed Chrome browser so interactive sign-in happens in
    // Chrome instead of an editor webview or Playwright's bundled browser.
    channel: process.env.BROWSER_CHANNEL || "chrome",

    userDataDir: path.join(
        process.cwd(),
        "data",
        "browser-profile"
    ),

    slowMo: 100
};

module.exports = browserConfig;
