async function openPage(page, url) {

    console.log(`Opening: ${url}`);

    await page.goto(url, {
        waitUntil: "domcontentloaded"
    });

    console.log(`Current URL: ${page.url()}`);
}


async function takeScreenshot(page, name = "screenshot") {

    const filePath = `data/${name}.png`;

    await page.screenshot({
        path: filePath,
        fullPage: true
    });

    console.log(`Screenshot saved: ${filePath}`);
}


async function wait(page, milliseconds) {

    await page.waitForTimeout(milliseconds);
}


module.exports = {
    openPage,
    takeScreenshot,
    wait
};