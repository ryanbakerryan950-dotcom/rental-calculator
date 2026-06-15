/**
 * Browser console tests — run: runParserTests()
 * Requires currency.js loaded (uses CurrencyARS.parseARS).
 */
function runParserTests() {
  const parse = (v) => CurrencyARS.parseARS(v);
  const cases = [
    ['1.200.000', 1200000, 'AR thousands'],
    ['10.000', 10000, 'ten thousand'],
    ['150.000,50', 150000.5, 'thousands + cents'],
    ['10', 10, 'plain ten'],
    ['', NaN, 'empty']
  ];

  let passed = 0;
  let failed = 0;
  cases.forEach(([input, expected, desc]) => {
    const result = parse(input);
    const ok = isNaN(expected) ? isNaN(result) : Math.abs(result - expected) < 0.001;
    if (ok) { console.log(`✅ PASS: "${input}" → ${result} (${desc})`); passed++; }
    else { console.error(`❌ FAIL: "${input}" → ${result}, expected ${expected}`); failed++; }
  });
  console.log(`\n${passed} passed, ${failed} failed`);
  return { passed, failed };
}
