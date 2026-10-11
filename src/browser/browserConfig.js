const path = require("path");
const os = require("os");
require("dotenv").config();

const configuredUserDataDir = process.env.BROWSER_USER_DATA_DIR?.trim();
const userDataDir = configuredUserDataDir
    ? path.resolve(configuredUserDataDir.replace(/^~(?=$|[\\/])/, os.homedir()))
    : path.join(process.cwd(), "data", "browser-profile");

const browserConfig = {
    headless: false,

    // Use the installed Chrome browser so interactive sign-in happens in
    // Chrome instead of an editor webview or Playwright's bundled browser.
    channel: process.env.BROWSER_CHANNEL || "chrome",

    userDataDir,

    slowMo: 100
};

module.exports = browserConfig;
