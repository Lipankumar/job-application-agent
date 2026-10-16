const assert = require("node:assert/strict");
const {
    getInstahyreMatchThreshold,
    parseInstahyreMatchScore
} = require("./instaMatchScore");

assert.equal(parseInstahyreMatchScore("Your InstaMatch score 82%"), 82);
assert.equal(parseInstahyreMatchScore("Your InstaMatch score is 70"), 70);
assert.equal(parseInstahyreMatchScore("InstaMatch score: 88%"), 88);
assert.equal(parseInstahyreMatchScore("No score shown"), null);
assert.equal(parseInstahyreMatchScore("88% unrelated text Your InstaMatch score"), null);
assert.equal(parseInstahyreMatchScore("Your InstaMatch score 120%"), null);
assert.equal(getInstahyreMatchThreshold("75"), 75);
assert.throws(() => getInstahyreMatchThreshold("101"), /from 0 to 100/);

console.log("InstaMatch score parsing and threshold OK");