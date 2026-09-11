function parseAmount(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/^₹\s*/, '')
    .replace(/,/g, '');

  if (!normalized || !/^\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error('Enter a valid non-negative amount.');
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Enter a valid non-negative amount.');
  }

  return amount;
}

function parseRatio(value, ownerCount) {
  const parts = String(value ?? '').split(':').map((part) => part.trim());

  if (parts.length !== ownerCount || parts.some((part) => !/^\d+(?:\.\d+)?$/.test(part))) {
    throw new Error(`Enter exactly ${ownerCount} positive ratio parts separated by colons.`);
  }

  const numbers = parts.map(Number);
  if (numbers.some((part) => !Number.isFinite(part) || part <= 0)) {
    throw new Error('Each ratio part must be greater than zero.');
  }

  return numbers;
}

function calculatePropertySplit({ landValue, buildingValue, ownerCount, landRatio, buildingRatio }) {
  const owners = Number(ownerCount);
  if (!Number.isInteger(owners) || owners < 1) {
    throw new Error('Owner count must be a positive whole number.');
  }

  const land = parseAmount(landValue);
  const building = parseAmount(buildingValue);
  const landParts = Array.isArray(landRatio) ? landRatio : parseRatio(landRatio, owners);
  const buildingParts = Array.isArray(buildingRatio) ? buildingRatio : parseRatio(buildingRatio, owners);

  if (landParts.length !== owners || buildingParts.length !== owners) {
    throw new Error('Each ratio must have one part per owner.');
  }

  const landTotal = landParts.reduce((sum, part) => sum + part, 0);
  const buildingTotal = buildingParts.reduce((sum, part) => sum + part, 0);
  const landPercentages = landParts.map((part) => (part / landTotal) * 100);
  const buildingPercentages = buildingParts.map((part) => (part / buildingTotal) * 100);
  const landShares = landParts.map((part) => (land * part) / landTotal);
  const buildingShares = buildingParts.map((part) => (building * part) / buildingTotal);
  const totalShares = landShares.map((share, index) => share + buildingShares[index]);

  return {
    landValue: land,
    buildingValue: building,
    totalValue: land + building,
    landPercentages,
    buildingPercentages,
    landShares,
    buildingShares,
    totalShares
  };
}

if (typeof module !== 'undefined') {
  module.exports = { calculatePropertySplit, parseAmount, parseRatio };
}

if (typeof window !== 'undefined') {
  window.PropertyCalculations = { calculatePropertySplit, parseAmount, parseRatio };
}