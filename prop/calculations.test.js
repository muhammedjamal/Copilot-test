const test = require('node:test');
const assert = require('node:assert/strict');
const { calculatePropertySplit, parseAmount, parseRatio } = require('./calculations');

test('calculates the example from the prompt', () => {
  const result = calculatePropertySplit({
    landValue: '₹60,00,000',
    buildingValue: '₹40,00,000',
    ownerCount: 2,
    landRatio: '2:1',
    buildingRatio: '2.5:1.5'
  });

  assert.equal(result.totalValue, 10000000);
  assert.deepEqual(result.landShares, [4000000, 2000000]);
  assert.deepEqual(result.buildingShares, [2500000, 1500000]);
  assert.deepEqual(result.totalShares, [6500000, 3500000]);
  assert.ok(Math.abs(result.landPercentages[0] - 66.6666666667) < 0.0001);
  assert.ok(Math.abs(result.buildingPercentages[1] - 37.5) < 0.0001);
});

test('parses Indian amounts and decimal ratios', () => {
  assert.equal(parseAmount(' ₹1,25,50,000 '), 12550000);
  assert.deepEqual(parseRatio('1.5 : 2.5 : 1', 3), [1.5, 2.5, 1]);
});

test('rejects malformed inputs', () => {
  assert.throws(() => parseAmount('50 lakhs'), /valid non-negative amount/);
  assert.throws(() => parseRatio('2:1', 3), /exactly 3/);
  assert.throws(() => parseRatio('2:0', 2), /greater than zero/);
});