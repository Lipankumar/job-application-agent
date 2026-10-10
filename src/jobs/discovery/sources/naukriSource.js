const { createJob } = require("../../job");
const { removeDuplicates } = require("../../storage/jobDeduplicator");
const normalizePostedAt = require("../../normalizeJobDate");

async function discoverNaukriJobs(page, options = {}) {
    const {
        keyword = "Node.js Backend Developer",
        location = "Bangalore",
        maxJobs = 10,
        maxAgeHours = 24
    } = options;

    console.log("\n🔎 Searching Naukri...");
    console.log(`🔑 Keyword: ${keyword}`);
    console.log(`📍 Location: ${location}`);

    const keywordSlug = keyword
        .toLowerCase()
        .replace(/\s+/g, "-");

    const locationSlug = location
        .toLowerCase()
        .replace(/\s+/g, "-");

    const searchUrl =
        `https://www.naukri.com/${encodeURIComponent(
            keywordSlug
        )}-jobs-in-${encodeURIComponent(
            locationSlug
        )}?jobAge=1`;

    console.log(`🌐 Opening: ${searchUrl}`);

    await page.goto(searchUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await page.waitForTimeout(5000);

    console.log(`✅ Page loaded: ${page.url()}`);

    const cards = page.locator(
        "article.jobTuple, .cust-job-tuple, .srp-jobtuple-wrapper"
    );

    const cardCount = await cards.count();

    console.log(`📋 Job cards detected: ${cardCount}`);

    const jobs = [];

    /*
     * Read more cards than requested because Naukri
     * may contain duplicate cards.
     */
    const scanLimit = cardCount;
    let skippedUnknownDate = 0;
    let skippedOld = 0;

    for (let i = 0; i < scanLimit; i++) {
        const card = cards.nth(i);

        try {
            const titleLocator = card.locator(
                "a.title, .title a, a[class*='title']"
            ).first();

            const companyLocator = card.locator(
                ".comp-name, .companyInfo a, a[class*='comp']"
            ).first();

            const locationLocator = card.locator(
                ".locWdth, .loc, [class*='location']"
            ).first();

            const experienceLocator = card.locator(
                ".expwdth, .experience, [class*='experience']"
            ).first();

            const title = await titleLocator
                .textContent()
                .catch(() => null);

            const company = await companyLocator
                .textContent()
                .catch(() => null);

            const jobLocation = await locationLocator
                .textContent()
                .catch(() => null);

            const experience = await experienceLocator
                .textContent()
                .catch(() => null);

            const link = await titleLocator
                .getAttribute("href")
                .catch(() => null);

            const postedLabel = await card.evaluate(element => {
                const relativeDate = /(?:just now|just posted|moments ago|today|yesterday|few (?:minutes|hours) ago|\d+\s*(?:minutes?|mins?|hours?|hrs?|days?)\s*ago)/i;
                const candidates = Array.from(element.querySelectorAll(
                    'time[datetime], [class*="post-day" i], [class*="posted" i], [class*="date" i], span, small'
                ));
                const match = candidates
                    .map(node => ({
                        text: (node.innerText || node.textContent || "").trim(),
                        datetime: node.getAttribute("datetime")
                    }))
                    .filter(item => item.datetime || relativeDate.test(item.text))
                    .sort((a, b) => a.text.length - b.text.length)[0];

                return match?.datetime || match?.text || null;
            }).catch(() => null);

            if (!title || !link) {
                continue;
            }

            const postedAt = normalizePostedAt(postedLabel);
            if (!postedAt) {
                skippedUnknownDate++;
                console.log(`⏭️ Skipped: ${title.trim()} — ${company?.trim() || "Unknown"} (posting time unavailable)`);
                continue;
            }

            const ageHours = (Date.now() - new Date(postedAt).getTime()) / (60 * 60 * 1000);
            if (ageHours < 0 || ageHours > maxAgeHours) {
                skippedOld++;
                console.log(`⏭️ Skipped: ${title.trim()} — ${company?.trim() || "Unknown"} (posted ${ageHours.toFixed(1)} hours ago)`);
                continue;
            }

            const cleanTitle = title.trim();

            const cleanCompany = company
                ? company.trim()
                : "Unknown";

            const cleanLocation = jobLocation
                ? jobLocation.trim()
                : location;

            const cleanExperience = experience
                ? experience.trim()
                : "";

            const normalizedUrl = link
                .split("?")[0]
                .trim();

            const job = createJob({
                title: cleanTitle,
                company: cleanCompany,
                location: cleanLocation,
                url: normalizedUrl,
                source: "naukri",
                skills: [],
                description: "",
                experience: cleanExperience,
                postedAt
            });

            jobs.push(job);

        } catch (error) {
            console.log(
                `⚠️ Could not parse job ${i + 1}: ${error.message}`
            );
        }
    }

    console.log(`\n📦 Raw jobs collected: ${jobs.length}`);
    console.log(`🕒 Skipped outside the last ${maxAgeHours} hours: ${skippedOld}`);
    console.log(`❔ Skipped because posting time was unavailable: ${skippedUnknownDate}`);

    /*
     * Use the existing shared deduplicator.
     */
    const uniqueJobs = removeDuplicates(jobs);

    console.log(
        `🧹 Unique jobs after deduplication: ${uniqueJobs.length}`
    );

    const finalJobs = uniqueJobs.slice(0, maxJobs);

    console.log(
        `📊 Returning ${finalJobs.length} unique Naukri jobs`
    );

    finalJobs.forEach((job, index) => {
        console.log(
            `✅ ${index + 1}. ${job.title} — ${job.company}`
        );
        console.log(`   Posted: ${job.postedAt}`);
    });

    return finalJobs;
}

module.exports = {
    discoverNaukriJobs
};
