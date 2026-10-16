const assert = require("node:assert/strict");
const {
    isOlderJobsEnabled,
    shouldIncludeJobByAge
} = require("./jobAgePolicy");
const normalizePostedAt = require("./normalizeJobDate");

const now = Date.parse("2026-10-16T12:00:00.000Z");
const fresh = "2026-10-16T11:00:00.000Z";
const old = "2026-10-15T10:00:00.000Z";
const future = "2026-10-16T13:00:00.000Z";

assert.equal(isOlderJobsEnabled("true"), true);
assert.equal(isOlderJobsEnabled("false"), false);
assert.equal(shouldIncludeJobByAge(fresh, 24, false, now), true);
assert.equal(shouldIncludeJobByAge(old, 24, false, now), false);
assert.equal(shouldIncludeJobByAge(old, 24, true, now), true);
assert.equal(shouldIncludeJobByAge(null, 24, false, now), true);
assert.equal(shouldIncludeJobByAge(future, 24, true, now), false);

const threeWeeksAgo = normalizePostedAt("Posted: 3+ weeks ago");
assert.ok(threeWeeksAgo, "week-based posting labels should be parsed");
assert.equal(shouldIncludeJobByAge(threeWeeksAgo, 24, false), false);

console.log("Job age policy OK");