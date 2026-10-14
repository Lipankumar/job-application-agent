const assert = require('node:assert/strict');
const { parseInstahyreJobUrl } = require('./instahyreSource');

const url = 'https://www.instahyre.com/job-446482-product-manager-ii-at-bluevine-bangalore/';
const job = parseInstahyreJobUrl(url);

assert.equal(job.title, 'Product Manager II');
assert.equal(job.company, 'BlueVine');
assert.equal(job.location, 'Bangalore');
console.log('Instahyre parser OK');
