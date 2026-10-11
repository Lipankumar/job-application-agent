const { chromium } = require("playwright");
const browserConfig = require("./browserConfig");

async function launchBrowser() {
    console.log(`🌐 Launching Chrome with profile: ${browserConfig.userDataDir}`);

    let context;
    try {
        context = await chromium.launchPersistentContext(
            browserConfig.userDataDir,
            {
                headless: browserConfig.headless,
                slowMo: browserConfig.slowMo,
                channel: browserConfig.channel
            }
        );
    } catch (error) {
        if (process.env.BROWSER_USER_DATA_DIR) {
            throw new Error(
                `Could not open the configured Chrome profile. Close every Chrome window, then retry. ${error.message}`
            );
        }
        throw error;
    }

    let page = context.pages()[0];

    if (!page) {
        page = await context.newPage();
    }

    return {
        context,
        page
    };
}

module.exports = {
    launchBrowser
};
