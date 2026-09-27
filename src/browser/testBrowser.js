const { launchBrowser } = require("./browser");
const {
    openPage,
    takeScreenshot,
    wait
} = require("./actions");

async function main() {

    const { context, page } = await launchBrowser();

    try {

        await openPage(
    page,
    "https://www.linkedin.com/"
);

        console.log("Page title:", await page.title());

        await takeScreenshot(
            page,
            "naukri-home"
        );

        await wait(page, 5000);

    } finally {

        await context.close();
    }
}

main().catch(error => {

    console.error("Browser automation failed:");
    console.error(error);

});