/**
 * US state → macro-region mapping for geographic fraud filters.
 */

const STATE_TO_REGION = {
  CA: 'West', OR: 'West', WA: 'West', NV: 'West', AZ: 'West', UT: 'West',
  CO: 'West', NM: 'West', HI: 'West', AK: 'West', ID: 'West', MT: 'West',
  WY: 'West', ND: 'Midwest', SD: 'Midwest', NE: 'Midwest', KS: 'Midwest',
  MN: 'Midwest', IA: 'Midwest', MO: 'Midwest', WI: 'Midwest', IL: 'Midwest',
  MI: 'Midwest', IN: 'Midwest', OH: 'Midwest', TX: 'South', OK: 'South',
  AR: 'South', LA: 'South', MS: 'South', AL: 'South', TN: 'South', KY: 'South',
  WV: 'South', VA: 'South', NC: 'South', SC: 'South', GA: 'South', FL: 'South',
  MD: 'South', DE: 'South', DC: 'South', NY: 'Northeast', PA: 'Northeast',
  NJ: 'Northeast', CT: 'Northeast', MA: 'Northeast', RI: 'Northeast',
  NH: 'Northeast', VT: 'Northeast', ME: 'Northeast',
};

function getRegionFromState(state) {
  if (!state) return 'Unknown';
  const code = String(state).trim().toUpperCase();
  return STATE_TO_REGION[code] ?? 'Other';
}

module.exports = { STATE_TO_REGION, getRegionFromState };
