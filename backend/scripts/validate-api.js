/**
 * MVP API validation script — run: node backend/scripts/validate-api.js
 */
const http = require('http');

const BASE = process.env.API_URL || 'http://localhost:3001';
const ENDPOINTS = [
  '/health',
  '/kpis',
  '/transactions?limit=2',
  '/fraudes/categorias',
  '/fraudes/horarios',
  '/alertas',
  '/analytics/summary',
  '/risk-analysis',
  '/ml-predictions?limit=2',
  '/anomalies?limit=2',
  '/fraud-insights',
  '/ml/metrics',
];

function get(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE}${path}`;
    const req = http.get(url, { timeout: 60000 }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        resolve({ path, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, body: body.slice(0, 120) });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${path}`)); });
  });
}

async function main() {
  console.log('[VALIDATE] FraudShield API — MVP check');
  console.log('[VALIDATE] Base URL:', BASE);
  let passed = 0;
  let failed = 0;

  for (const path of ENDPOINTS) {
    try {
      const r = await get(path);
      if (r.ok) {
        console.log(`[PASS] ${r.status} ${path}`);
        passed += 1;
      } else {
        console.log(`[FAIL] ${r.status} ${path}`);
        failed += 1;
      }
    } catch (err) {
      console.log(`[FAIL] ${path} — ${err.message}`);
      failed += 1;
    }
  }

  console.log(`[VALIDATE] Done — ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
