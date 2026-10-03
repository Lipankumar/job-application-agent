require("dotenv").config();

const { chromium } = require("playwright");
const { fillForm } = require("./formFiller");
const candidate = require("../config/candidate.json");
const candidateData = {
    name: "Lipan Kumar Dakua",
    email: process.env.CANDIDATE_EMAIL,
    phone: process.env.CANDIDATE_PHONE,
    location: candidate.preferredLocations[0],
    experience: "3.9",
    currentCompany: candidate.experience.currentCompany
};

async function main() {

    const browser = await chromium.launch({
        headless: false
    });

    const page = await browser.newPage();

    await page.setContent(`
        <html>
        <body>

            <h2>Test Job Application</h2>

            <form>

                <label>Full Name</label>
                <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                />

                <br><br>

                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                />

                <br><br>

                <label>Mobile Number</label>
                <input
                    type="tel"
                    name="phone"
                    placeholder="Enter mobile number"
                />

                <br><br>

                <label>Location</label>
                <input
                    type="text"
                    name="location"
                />

                <br><br>

                <label>Years of Experience</label>
                <input
                    type="number"
                    name="experience"
                />

                <br><br>

                <label>Current Company</label>
                <input
                    type="text"
                    name="currentCompany"
                />

                <br><br>

                <button type="submit">
                    Apply
                </button>

            </form>

        </body>
        </html>
    `);

    await fillForm(page, candidateData);

    await page.waitForTimeout(5000);

    await browser.close();
}

main().catch(error => {
    console.error("Form autofill failed:");
    console.error(error);
});