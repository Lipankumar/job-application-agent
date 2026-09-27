const path = require("path");

const browserConfig = {
    headless: false,

    userDataDir: path.join(
        process.cwd(),
        "data",
        "browser-profile"
    ),

    slowMo: 100
};

module.exports = browserConfig;