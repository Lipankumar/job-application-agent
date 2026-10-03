require("dotenv").config();

const { chromium } = require("playwright");

const {
    loginToNaukri
} = require("./naukriLogin");


async function searchNaukriJobs({
    keyword = "Node.js Backend Developer",
    location = "Bangalore",
    experience = "3"
} = {}) {

    const browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext();

    const page = await context.newPage();

    try {

        console.log("Opening Naukri...");

        await loginToNaukri(page);

        console.log("Login completed.");

        const searchUrl =
            `https://www.naukri.com/${encodeURIComponent(keyword)
                .replace(/%20/g, "-")}-jobs-in-${encodeURIComponent(location)
                .replace(/%20/g, "-")}`;

        console.log("Opening job search...");

        await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        await page.waitForTimeout(5000);

        console.log("Job search page loaded.");

        const jobs = await page.evaluate(() => {

            const jobCards = document.querySelectorAll(
                "div.srp-jobtuple-wrapper"
            );

            return Array.from(jobCards).map(card => {

                const titleElement =
                    card.querySelector("a.title");

                const companyElement =
                    card.querySelector("a.comp-name");

                const locationElement =
                    card.querySelector(".locWdth");

                const experienceElement =
                    card.querySelector(".expwdth");

                const salaryElement =
                    card.querySelector(".sal");

                const descriptionElement =
                    card.querySelector(".job-desc");

                return {
                    title: titleElement?.innerText?.trim() || null,
                    company: companyElement?.innerText?.trim() || null,
                    location: locationElement?.innerText?.trim() || null,
                    experience: experienceElement?.innerText?.trim() || null,
                    salary: salaryElement?.innerText?.trim() || null,
                    description: descriptionElement?.innerText?.trim() || null,
                    url: titleElement?.href || null
                };
            });
        });

        console.log(`Found ${jobs.length} jobs.`);

        return jobs;

    } catch (error) {

        console.error(
            "Naukri job search failed:",
            error.message
        );

        return [];

    } finally {

        console.log(
            "Naukri search completed. Browser remains open."
        );
    }
}


if (require.main === module) {

    searchNaukriJobs({
        keyword: "Node.js Backend Developer",
        location: "Bangalore",
        experience: "3"
    });
}


module.exports = {
    searchNaukriJobs
};