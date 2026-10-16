const { createJob } = require("../../job");
const normalizePostedAt = require("../../normalizeJobDate");
const { shouldIncludeJobByAge } = require("../../jobAgePolicy");

const CITY_ALIASES = [
    { keys: ["bangalore", "bengaluru"], label: "Bangalore" },
    { keys: ["hyderabad"], label: "Hyderabad" },
    { keys: ["mumbai"], label: "Mumbai" },
    { keys: ["pune"], label: "Pune" },
    { keys: ["gurgaon", "gurugram"], label: "Gurgaon" },
    { keys: ["delhi", "new delhi"], label: "Delhi" },
    { keys: ["chennai"], label: "Chennai" },
    { keys: ["noida"], label: "Noida" },
    { keys: ["kochi"], label: "Kochi" },
    { keys: ["remote"], label: "Remote" },
    { keys: ["work from home", "work-from-home"], label: "Work From Home" }
];

function toTitleCase(value = "") {
    return value
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter(Boolean)
        .map(word => {
            const lower = word.toLowerCase();
            if (["ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"].includes(lower)) {
                return word.toUpperCase();
            }
            return word.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ");
}

function normalizeCompanyName(value = "") {
    const cleaned = value
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleaned) return "Unknown";

    const lowered = cleaned.toLowerCase();
    if (lowered.includes("bluevine")) {
        return "BlueVine";
    }

    return cleaned
        .split(" ")
        .filter(Boolean)
        .map(part => {
            const lower = part.toLowerCase();
            if (["and", "of", "the", "for", "at"].includes(lower)) {
                return lower;
            }
            return part.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(" ");
}

function normalizeLocationName(value = "") {
    const cleaned = value
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleaned) return "";

    const lower = cleaned.toLowerCase();
    const matches = [];
    for (const city of CITY_ALIASES) {
        const hit = city.keys.some(key => lower.includes(key));
        if (hit) {
            matches.push(city.label);
        }
    }

    if (matches.length > 0) {
        return [...new Set(matches)].join(", ");
    }

    if (lower.includes("remote")) {
        return "Remote";
    }

    if (lower.includes("work from home") || lower.includes("work-from-home")) {
        return "Work From Home";
    }

    return toTitleCase(cleaned);
}

function parseInstahyreJobUrl(url = "") {
    if (!url) {
        return { title: "", company: "Unknown", location: "", url: "" };
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        return { title: "", company: "Unknown", location: "", url };
    }

    const pathname = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
    if (!pathname.startsWith("job-")) {
        return { title: "", company: "Unknown", location: "", url };
    }

    const slug = pathname.replace(/^job-\d+-/, "");
    if (!slug) {
        return { title: "", company: "Unknown", location: "", url };
    }

    const atIndex = slug.lastIndexOf("-at-");
    let titleSlug = slug;
    let companyLocationSlug = "";

    if (atIndex >= 0) {
        titleSlug = slug.slice(0, atIndex);
        companyLocationSlug = slug.slice(atIndex + 4);
    }

    const title = toTitleCase(titleSlug.replace(/-/g, " ")) || "Unknown role";

    if (!companyLocationSlug) {
        return {
            title,
            company: "Unknown",
            location: "",
            url
        };
    }

    const segments = companyLocationSlug
        .split("-")
        .filter(Boolean)
        .map(segment => segment.trim());

    if (segments.length === 0) {
        return {
            title,
            company: "Unknown",
            location: "",
            url
        };
    }

    const locationText = normalizeLocationName(segments.join(" "));
    const locationIndex = segments.findIndex(segment => {
        const lower = segment.toLowerCase();
        return CITY_ALIASES.some(city => city.keys.some(key => lower.includes(key)));
    });

    const companySegments = locationIndex >= 0
        ? segments.slice(0, locationIndex)
        : segments;

    const company = normalizeCompanyName(companySegments.join(" "));

    return {
        title,
        company,
        location: locationText,
        url
    };
}

async function discoverInstahyreJobs(page, options = {}) {
    const {
        keyword = "Node.js Backend Developer",
        location = "Bangalore",
        maxJobs = 10,
        maxAgeHours = 24,
        includeOlderJobs = false,
        searchUrl = `https://www.instahyre.com/search-jobs/?q=${encodeURIComponent(keyword)}${location ? `&location=${encodeURIComponent(location)}` : ""}`
    } = options;

    console.log("\n🔎 Searching Instahyre...");
    await page.goto(searchUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000
    });

    const jobLinkSelector = 'a[href*="/job-"]';
    await page.locator(jobLinkSelector).first().waitFor({
        state: "attached",
        timeout: 20000
    }).catch(() => {});
    await page.waitForTimeout(1500);

    const rawListings = await page.locator(jobLinkSelector).evaluateAll(links => {
        const seen = new Set();
        return links.flatMap(link => {
            const href = link.href || link.getAttribute("href");
            if (!href || seen.has(href)) return [];
            seen.add(href);

            const text = (link.textContent || "").replace(/\s+/g, " ").trim();
            const cardText = (link.closest("div, article, li, section, tr")?.innerText || text || "")
                .replace(/\s+/g, " ")
                .trim();

            return [{
                url: href,
                title: text,
                company: "",
                location: "",
                postedAtText: cardText
            }];
        });
    });

    const currentUrl = page.url();
    const pageTitle = await page.title().catch(() => "unknown title");
    console.log(`📋 Instahyre page: ${pageTitle} (${currentUrl})`);
    console.log(`📋 Instahyre job links detected: ${rawListings.length}`);

    if (rawListings.length === 0) {
        const pageText = (await page.locator("body").innerText().catch(() => ""))
            .replace(/\s+/g, " ")
            .slice(0, 300);

        if (/captcha|verify you are human|access denied|unusual traffic|security check/i.test(pageText)) {
            throw new Error(`Instahyre blocked the listing page with a security check: ${pageText}`);
        }

        console.log(`ℹ️ No Instahyre job links were present after waiting for the page to load. Page text: ${pageText}`);
    }

    const jobs = [];
    let unknownDateCount = 0;
    let outsideWindowCount = 0;

    for (const jobListing of rawListings) {
        const parsed = parseInstahyreJobUrl(jobListing.url);
        const title = parsed.title || jobListing.title || "Unknown role";
        const company = parsed.company || jobListing.company || "Unknown";
        const location = parsed.location || jobListing.location || "";
        const postedAt = normalizePostedAt(jobListing.postedAtText || "");
        const ageHours = postedAt
            ? (Date.now() - new Date(postedAt).getTime()) / (60 * 60 * 1000)
            : NaN;

        if (!title) continue;

        if (!Number.isFinite(ageHours)) {
            unknownDateCount++;
        } else if (ageHours > maxAgeHours) {
            outsideWindowCount++;
        }

        if (!shouldIncludeJobByAge(postedAt, maxAgeHours, includeOlderJobs)) {
            const ageMessage = ageHours < 0
                ? "posting time is in the future"
                : `posted more than ${maxAgeHours} hours ago`;
            console.log(`⏭️ Instahyre skipped ${title}: ${ageMessage}`);
            continue;
        }

        jobs.push(createJob({
            title,
            company,
            location,
            url: jobListing.url,
            source: "instahyre",
            description: "",
            experience: "",
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
    console.log(`📊 Instahyre jobs: ${prioritizedJobs.length}; within ${maxAgeHours}h prioritized: ${prioritizedJobs.filter(job => job.postedAt && (Date.now() - new Date(job.postedAt).getTime()) / 3600000 <= maxAgeHours).length}; older retained as fallback: ${outsideWindowCount}; undated retained as final fallback: ${unknownDateCount}`);
    return prioritizedJobs;
}

module.exports = {
    parseInstahyreJobUrl,
    discoverInstahyreJobs
};
