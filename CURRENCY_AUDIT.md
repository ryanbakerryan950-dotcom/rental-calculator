# Currency Audit — AlquilerCalc (es-AR)

Audit performed before implementing `js/currency.js`.

## A) User currency input read from DOM

| File | Location | Field ID | Pattern |
|------|----------|----------|---------|
| `js/calculator.js` | `initHomeCalculator` submit | `monto-actual` | `document.getElementById('monto-actual').value` |
| `js/calculator.js` | `initMontoActualInput` | `monto-actual` | `this.value` on focus/blur/input |
| `js/calculator.js` | `calculate()` | param `currentRent` | via `parseAmount(currentRent)` |
| `js/calculator.js` | `initMainCalculator` (legacy) | `current-rent` | `.value` |
| `js/calculator.js` | `initContractCalculator` | `contract-rent` | `.value` |
| `js/calculator.js` | `initDepositCalculator` | `deposit-rent` | `.value` |
| `js/calculator.js` | `initFutureRentSimulator` | `future-rent` | `.value` |
| `js/main.js` | `formatRentInput` | `deposit-rent`, `future-rent`, `contract-rent`, `current-rent` | `input.value` |

## B) parseFloat / Number / unary + on currency input values

| File | Line (approx) | Code | Status |
|------|---------------|------|--------|
| `js/calculator.js` | top | `parseArgentineNumber` → `parseFloat(cleaned)` after stripping ALL dots | **BUG**: `"1.200.000"` → `1200000` OK but `"10.5"` → `105` |
| `js/calculator.js` | `parseAmount` | delegates to `parseArgentineNumber` | Used for all rent fields |
| `js/calculator.js` | slider | `parseFloat(slider.value)` | OK — not currency |
| `js/main.js` | removed | was `parseFloat(input.value.replace(...))` | Replaced in prior fix |

## C) Currency display formatting

| File | Usage |
|------|-------|
| `js/calculator.js` | `formatArgentineCurrency()` — result panel, PDF, mini calcs |
| `js/calculator.js` | `toLocaleString('es-AR')` on blur in `initMontoActualInput` |
| `js/calculator.js` | `result.formatted.*` built in `calculate()` |
| `js/indices.js` | `formatCurrency`, `formatCurrencyFull` — index table (not user rent input) |
| `js/main.js` | `toLocaleString('es-AR')` on blur for secondary rent inputs |

## D) Backend / form POST

**None.** Static vanilla HTML/JS site. No Node/Express, PHP, or API routes. All calculations run client-side.

## E) Input masking libraries

**None.** No cleave.js, imask, autonumeric, or inputmask.

## Fix plan

1. Add `js/currency.js` with `parseARS`, `formatARS`, `validateRentAmount`, `applyRentFormula`, `initRentInput`.
2. Replace all rent parsing with `parseARS` / `getRawValue()`.
3. Replace all rent display with `formatARS`.
4. Use `applyRentFormula` in `calculate()` for M2 = M1 × (I2 ÷ I1).
