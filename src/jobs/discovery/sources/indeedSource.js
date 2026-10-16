const { createJob } = require("../../job");
const normalizePostedAt = require("../../normalizeJobDate");
const { getIndeedAccessIssue } = require("../../indeedAccessGuard");
const { shouldIncludeJobByAge } = require("../../jobAgePolicy");

async function discoverIndeedJobs(page, options = {}) {
    const {
        keyword = "Node.js Backend Developer",
        location = "Bangalore",
        maxJobs = 10,
        maxAgeHours = 24,
        includeOlderJobs = false,
        searchUrl
    } = options;

    const url = searchUrl || `https://in.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(location)}`;
    console.log("\n🔎 Searching Indeed...");
    console.log(`🔑 Keyword: ${keyword}`);
    console.log(`📍 Location: ${location}`);
    console.log(`🌐 Opening: ${url}`);

    await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    await page.locator('a[href*="/viewjob"]').first().waitFor({
        state: "attached",
        timeout: 15000
    }).catch(() => {});

    const listings = await page.locator('a[href*="/viewjob"]').evaluateAll(links => {
        const seen = new Set();
        return links.flatMap(link => {
            const rawHref = link.href;
            if (!rawHref) return [];

            let parsedUrl;
            try {
                parsedUrl = new URL(rawHref);
            } catch {
                return [];
            }
            parsedUrl.search = "";
            parsedUrl.hash = "";
            const href = parsedUrl.toString();
            if (seen.has(href)) return [];
            seen.add(href);

            const card = link.closest("[data-jk], .job_seen_beacon, .result, li") || link.parentElement;
            const read = selectors => {
                for (const selector of selectors) {
                    const value = card?.querySelector(selector)?.innerText?.trim();
                    if (value) return value;
                }
                return "";
            };
            const dateNode = card?.querySelector("[class*='date'], time[datetime]");

            return [{
                title: link.innerText?.trim() || link.getAttribute("aria-label") || link.getAttribute("title") || "",
                company: read(["[data-testid='company-name']", ".companyName", "[class*='companyName']"]),
                location: read(["[data-testid='text-location']", ".companyLocation", "[class*='companyLocation']"]),
                experience: read(["[class*='experience']"]),
                postedAtText: dateNode?.getAttribute("datetime") || dateNode?.innerText?.trim() || "",
                url: href
            }];
        });
    });

    if (listings.length === 0) {
        const pageText = await page.locator("body").innerText().catch(() => "");
        const accessIssue = getIndeedAccessIssue(page.url(), pageText);
        if (accessIssue) {
            throw new Error(accessIssue);
        }
    }

    console.log(`📋 Indeed job links detected: ${listings.length}`);

    const jobs = [];
    let unknownDateCount = 0;
    let outsideWindowCount = 0;

    for (const listing of listings) {
        if (!listing.title) continue;

        const postedAt = normalizePostedAt(listing.postedAtText);
        const ageHours = postedAt
            ? (Date.now() - new Date(postedAt).getTime()) / (60 * 60 * 1000)
            : NaN;

        if (!Number.isFinite(ageHours)) {
            unknownDateCount++;
        } else if (ageHours > maxAgeHours) {
            outsideWindowCount++;
        }

        if (!shouldIncludeJobByAge(postedAt, maxAgeHours, includeOlderJobs)) {
            const ageMessage = ageHours < 0
                ? "posting time is in the future"
                : `posted more than ${maxAgeHours} hours ago`;
            console.log(`⏭️ Indeed skipped ${listing.title}: ${ageMessage}`);
            continue;
        }

        jobs.push(createJob({
            title: listing.title,
            company: listing.company || "Unknown",
            location: listing.location || location,
            url: listing.url,
            source: "indeed",
            description: "",
            experience: listing.experience || "",
            postedAt
        }));
    }

    jobs.sort((a, b) => {
        const aTime = a.postedAt ? new Date(a.postedAt).getTime() : NaN;
        const bTime = b.postedAt ? new Date(b.postedAt).getTime() : NaN;
        if (!Number.isFinite(aTime)) return Number.isFinite(bTime) ? 1 : 0;
        if (!Number.isFinite(bTime)) return -1;
        return bTime - aTime;
    });

    const prioritizedJobs = jobs.slice(0, maxJobs);
    console.log(`📊 Indeed jobs: ${prioritizedJobs.length}; older than ${maxAgeHours}h retained as fallback: ${outsideWindowCount}; undated retained as final fallback: ${unknownDateCount}`);
    return prioritizedJobs;
}

module.exports = { discoverIndeedJobs };