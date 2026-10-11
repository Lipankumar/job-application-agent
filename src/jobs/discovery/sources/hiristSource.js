const { createJob } = require("../../job");
const normalizePostedAt = require("../../normalizeJobDate");

async function discoverHiristJobs(page, options = {}) {
    const {
        maxJobs = 10,
        maxAgeHours = 24,
        searchUrl = "https://www.hirist.tech/k/nodejs-jobs"
    } = options;

    console.log("\n🔎 Searching Hirist.tech...");
    await page.goto(searchUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });
    const jobLinkSelector = 'a[href*="/j/"], a[href*="/job/"]';
    await page.locator(jobLinkSelector).first().waitFor({
        state: "attached",
        timeout: 15000
    }).catch(() => {});
    await page.waitForTimeout(1500);

    const listings = await page.locator(jobLinkSelector).evaluateAll(links => {
        const seen = new Set();
        return links.flatMap(link => {
            const href = link.href;
            if (!href || seen.has(href)) return [];
            seen.add(href);

            let card = link;
            let current = link;
            for (let depth = 0; depth < 6 && current.parentElement; depth++) {
                current = current.parentElement;
                const text = current.innerText || "";
                if (/posted\s+(?:today|\d+\s+(?:minutes?|mins?|hours?|hrs?|days?)\s+ago)/i.test(text) && text.length < 2500) {
                    card = current;
                    break;
                }
            }

            const read = selectors => {
                for (const selector of selectors) {
                    const value = card.querySelector(selector)?.innerText?.trim();
                    if (value) return value;
                }
                return "";
            };

            const cardText = card.innerText || "";
            const postedAtText = cardText.match(/posted\s+(?:today|\d+\s+(?:minutes?|mins?|hours?|hrs?|days?)\s+ago)/i)?.[0] ||
                Array.from(card.querySelectorAll("time[datetime]"))[0]?.getAttribute("datetime") || "";

            return [{
                url: href,
                title: read(["h1", "h2", "h3", "[class*='title']"]) || link.innerText.trim().split("\n")[0],
                company: read(["[class*='company']", "[data-testid*='company']"]),
                location: read(["[class*='location']", "[data-testid*='location']"]),
                experience: read(["[class*='experience']", "[data-testid*='experience']"]),
                postedAtText
            }];
        });
    });

    const currentUrl = page.url();
    const pageTitle = await page.title().catch(() => "unknown title");
    console.log(`📋 Hirist page: ${pageTitle} (${currentUrl})`);
    console.log(`📋 Hirist job links detected: ${listings.length}`);

    if (listings.length === 0) {
        const pageText = (await page.locator("body").innerText().catch(() => ""))
            .replace(/\s+/g, " ")
            .slice(0, 300);
        if (/captcha|verify you are human|access denied|unusual traffic/i.test(pageText)) {
            throw new Error(`Hirist blocked the listing page with a security check: ${pageText}`);
        }
        console.log(`ℹ️ No Hirist job links were present after waiting for the page to load. Page text: ${pageText}`);
    }

    const jobs = [];
    let skippedUnknownDate = 0;
    let skippedOutsideWindow = 0;

    for (const listing of listings) {
        const postedAt = normalizePostedAt(listing.postedAtText);
        const ageHours = postedAt
            ? (Date.now() - new Date(postedAt).getTime()) / (60 * 60 * 1000)
            : NaN;

        if (!Number.isFinite(ageHours)) {
            skippedUnknownDate++;
            console.log(`⏭️ Hirist skipped ${listing.title || listing.url}: posting time unavailable`);
            continue;
        }

        if (ageHours < 0 || ageHours > maxAgeHours) {
            skippedOutsideWindow++;
            console.log(`⏭️ Hirist skipped ${listing.title || listing.url}: posted ${ageHours.toFixed(1)} hours ago`);
            continue;
        }

        if (!listing.title) continue;

        jobs.push(createJob({
            title: listing.title,
            company: listing.company || "Unknown",
            location: listing.location || "",
            url: listing.url,
            source: "hirist",
            description: "",
            experience: listing.experience || "",
            postedAt
        }));

        if (jobs.length >= maxJobs) break;
    }

    console.log(`📊 Hirist recent jobs: ${jobs.length}; skipped outside 24h: ${skippedOutsideWindow}; unknown posting time: ${skippedUnknownDate}`);
    return jobs;
}

module.exports = { discoverHiristJobs };
