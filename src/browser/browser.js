const { chromium } = require("playwright");
const browserConfig = require("./browserConfig");

async function launchBrowser() {

    const context = await chromium.launchPersistentContext(
        browserConfig.userDataDir,
        {
            headless: browserConfig.headless,
            slowMo: browserConfig.slowMo
        }
    );

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