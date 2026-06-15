# Index Data Pipeline Audit — AlquilerCalc

Audit date: 2026-06-15. Cross-checked against BCRA ICL competitor reference.

## A) Hardcoded ICL / IPC / CER data

```
FILE: js/indices.js
LINE: 15–34
TYPE: hardcoded data (monthly ICL array)
ISSUE: Values 1.0–7.0 are wrong scale for 2024–2025. Real BCRA ICL (base Jul 2020) is ~17–36 in 2024–2025. Causes ~3× factor error and +200% variations.
FIX NEEDED: yes — replace with BCRA daily ICL_DATA table (base 2020-07-01 = 1)

FILE: js/indices.js
LINE: 266–285
TYPE: hardcoded data (dailyICL object)
ISSUE: Same wrong synthetic values (1–7). Previously seeded from incorrect monthly factors, not BCRA publications.
FIX NEEDED: yes — replace with full ICL_DATA daily table

FILE: js/indices.js
LINE: 37–56, 59–78, 81–88
TYPE: hardcoded data (IPC, CER, CASA_PROPIA monthly)
ISSUE: IPC uses separate base (Ene 2024 = 100); not the ICL bug source but monthly lookup uses closest-month not on-or-before.
FIX NEEDED: partial — improve findIndex for IPC; ICL fixed via daily table
```

## B) API calls

```
FILE: js/indices.js
LINE: 327–348
TYPE: API call — fetchICLFromBCRA()
ISSUE: Fetches last 2 years only; merges into dailyICL but calculateVariation() reads monthly ICL array, NOT dailyICL → SPLIT-BRAIN when API succeeds (daily ~13–20 vs monthly ~3–5).
FIX NEEDED: yes — unify: all ICL lookups via fetchICLIndex / getICLFromTable; monthly array derived from daily

FILE: js/calculator.js
LINE: 711 (initMiniCalculators)
TYPE: API call trigger
ISSUE: fetchICLFromBCRA() called but results not used by home calculator path.
FIX NEEDED: yes — wire API into calculateVariationForDates
```

## C) localStorage / sessionStorage

```
FILE: (none found)
TYPE: N/A
ISSUE: No cached index data in storage.
FIX NEEDED: no
```

## D) Index lookup functions

```
FILE: js/indices.js
LINE: 129–146 findIndex()
TYPE: lookup function
ISSUE: Uses closest month by absolute date distance, not “on or before” business day. Can pick wrong month at boundaries.
FIX NEEDED: yes for IPC/CER monthly

FILE: js/indices.js
LINE: 287–292 getICLForDate()
TYPE: lookup function
ISSUE: Falls back to wrong monthly ICL array when daily key missing. dailyICL had stale data.
FIX NEEDED: yes — on-or-before daily lookup only

FILE: js/indices.js
LINE: 155–168 calculateVariation()
TYPE: lookup function
ISSUE: Uses monthly keys (YYYY-MM) from resolveIndexDate, ignoring exact calendar day. For ICL should use daily ISO dates.
FIX NEEDED: yes — calculateVariationForDates(indexType, startIso, endIso)

FILE: js/indices.js
LINE: 248–256 resolveIndexDate()
TYPE: date → index key
ISSUE: Correctly adjusts weekends; output monthKey used for wrong monthly ICL table.
FIX NEEDED: yes — pass iso to ICL daily lookup, not only monthKey
```

## E) Display vs calculation (split-brain)

```
FILE: js/calculator.js
LINE: 35–56 calculate()
TYPE: calculation uses calculateVariation(monthKey)
ISSUE: Single path for display+calc BUT wrong data source. If any code used getICLForDate vs calculateVariation, values would diverge.

FILE: js/calculator.js
LINE: 430 displayHomeResults()
TYPE: display shows result.startValue / result.endValue
ISSUE: Same object as calculation — split-brain was caused by mixed data sources (API dailyICL vs monthly array), not separate variables.
FIX NEEDED: yes — single calculationState with one fetch per date

FILE: js/calculator.js
LINE: 276–283 initHomeCalculator submit
TYPE: passes monthKey to calculate()
ISSUE: Loses day-level precision; Jun 1 vs Jun 30 both map to same month incorrectly for daily ICL.
FIX NEEDED: yes — pass startResolved.iso / endResolved.iso
```

## F) Variables i1, i2, index values

```
FILE: js/indices.js — calcularActualizacion() lines 318–319
FILE: js/calculator.js — result.startValue, result.endValue lines 55–56
TYPE: index values in calculation result
ISSUE: Populated from wrong ICL table.
FIX NEEDED: yes
```

## G) Third-party masking / JSON files

```
No .json index files found.
No cleave/imask/autonumeric/inputmask imports.
```

## Root cause summary

| Bug | Root cause |
|-----|------------|
| BUG 1 Stale ICL | Monthly + daily tables used fabricated 1–7 scale instead of BCRA 13–36 scale |
| BUG 2 Split-brain | fetchICLFromBCRA updated dailyICL but calculateVariation read monthly ICL array |
| BUG 3 Date lookup | monthKey-only lookup + wrong table + findIndex closest-month |

## Fix plan

1. Insert full `ICL_DATA` daily table (BCRA base 2020-07-01).
2. Add `fetchICLIndex()`, `getICLFromFallbackTable()`, `calculateVariationForDates()`.
3. Home calculator: async fetch both dates → `calculationState` → display from same state.
4. Add `toISO()`, `validateCalculationResult()`, `selfVerifyIndexData()`.
