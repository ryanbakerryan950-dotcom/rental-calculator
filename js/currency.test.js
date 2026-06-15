// js/currency.test.js
// Run with: node js/currency.test.js

function parseARS(raw) {
  if (raw === null || raw === undefined) return NaN;
  let str = String(raw).trim().replace(/^\$\s*/, '').replace(/[\s\u00A0]/g, '');
  if (str === '') return NaN;

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  if (hasDot && hasComma) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    const parts = str.split(',');
    str = (parts.length === 2 && parts[1].length <= 2)
      ? str.replace(',', '.')
      : str.replace(/,/g, '');
  } else if (hasDot && !hasComma) {
    const parts = str.split('.');
    const last = parts[parts.length - 1];
    if (!(parts.length === 2 && last.length <= 2)) {
      str = str.replace(/\./g, '');
    }
  }
  const result = parseFloat(str);
  return isNaN(result) ? NaN : result;
}

const TESTS = [
  ['1.200.000', 1200000, 'AR thousands dots only'],
  ['1.200.000,00', 1200000, 'AR full format'],
  ['1.200.000,50', 1200000.5, 'AR full format with cents'],
  ['$ 1.200.000,00', 1200000, 'AR with peso prefix'],
  ['1200000', 1200000, 'plain integer'],
  ['1200000,00', 1200000, 'AR decimal comma no thousands'],
  ['1200000.00', 1200000, 'EN decimal dot no thousands'],
  ['150.000', 150000, 'AR thousands dot 3-digit end'],
  ['150.000,50', 150000.5, 'AR thousands + decimal'],
  ['70', 70, 'small plain integer'],
  ['70,00', 70, 'small AR decimal'],
  ['10', 10, 'single digit'],
  ['10.5', 10.5, 'EN decimal edge case'],
  ['1,200,000', 1200000, 'EN thousands commas'],
  ['', NaN, 'empty string'],
  [null, NaN, 'null'],
  [undefined, NaN, 'undefined'],
  ['abc', NaN, 'non-numeric string'],
  ['$ ', NaN, 'prefix only']
];

let passed = 0;
let failed = 0;

TESTS.forEach(([input, expected, desc]) => {
  const result = parseARS(input);
  const ok = isNaN(expected)
    ? isNaN(result)
    : Math.abs(result - expected) < 0.0001;

  if (ok) {
    console.log(`  ✅  "${input}"  →  ${result}   (${desc})`);
    passed++;
  } else {
    console.error(`  ❌  "${input}"  →  got ${result}, expected ${expected}   (${desc})`);
    failed++;
  }
});

console.log(`\n${'─'.repeat(55)}`);
console.log(`  ${passed} passed   ${failed} failed   ${TESTS.length} total`);
console.log('─'.repeat(55));

if (failed > 0) process.exit(1);
