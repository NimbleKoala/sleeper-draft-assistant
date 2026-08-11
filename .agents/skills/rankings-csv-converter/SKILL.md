---
name: rankings-csv-converter
description: >-
  Converts raw, unformatted, copied text, TSV, or external player rankings into the standardized CSV format required by the Sleeper Draft Assistant app (Rank, Player, Team, Position).
  Use this skill whenever the user provides raw player ranking lists, unformatted text, copy-pasted web tables, or custom rankings files that need to be normalized into clean CSV files.
---

# Rankings CSV Converter Skill

This skill provides automated parsing, team code normalization, and CSV formatting to convert any custom fantasy football player rankings into the standard CSV schema required by the **Sleeper Draft Assistant** application.

## Standardized CSV Format Schema

All rankings used by this app must be formatted with the exact header line and column structure below:

```csv
Rank,Player,Team,Position
1,Jahmyr Gibbs,DET,RB
2,Ja'Marr Chase,CIN,WR
3,Puka Nacua,LAR,WR
4,Josh Allen,BUF,QB
```

### Formatting Rules & Normalization
1. **Rank**: Positive integer representing overall player rank (1, 2, 3...).
2. **Player**: Full player name (e.g. `Jahmyr Gibbs`, `Ja'Marr Chase`, `Marvin Harrison Jr.`).
3. **Team**: Official 2–3 letter uppercase NFL team code (`SF`, `DET`, `CIN`, `LAR`, `KC`, `BAL`, `PHI`, `BUF`, `JAX`, `WAS`, `ARI`, `CLE`, `LV`, `TB`).
   - Normalizes non-standard codes: `JAC` → `JAX`, `KCC` → `KC`, `TBB` → `TB`, `SFO` → `SF`, `LVR` → `LV`, `WSH`/`WFT` → `WAS`, `CLV` → `CLE`, `ARZ` → `ARI`, `BLT` → `BAL`, `HST` → `HOU`.
4. **Position**: Valid fantasy football position code (`QB`, `RB`, `WR`, `TE`, `K`, `DEF`).
   - Converts `DST` → `DEF`.

---

## Executable Helper Script

A Node.js conversion utility is located at:
[`scripts/convert_rankings.js`](./scripts/convert_rankings.js)

### Command Usage

To convert any raw text file to standard CSV format:

```bash
node .agents/skills/rankings-csv-converter/scripts/convert_rankings.js <path-to-raw-file> [output-csv-path]
```

#### Example 1: Convert raw rankings text to formatted CSV
```bash
node .agents/skills/rankings-csv-converter/scripts/convert_rankings.js .agents/skills/rankings-csv-converter/examples/sample_input.txt data/rankings/my_custom_rankings.csv
```

#### Example 2: Programmatic Conversion in JS
```javascript
import { convertToRankingsCsv } from './scripts/convert_rankings.js';

const rawText = `1. Ja'Marr Chase CIN WR\n2. Jahmyr Gibbs DET RB`;
const formattedCsv = convertToRankingsCsv(rawText);
console.log(formattedCsv);
```

---

## Verification & Deployment Steps

1. Save the formatted `.csv` output file into the server's rankings directory:
   [`data/rankings/`](../../data/rankings/)
2. Or upload the formatted CSV text directly using the **Rankings Manager Modal** in the frontend app.
3. Verify that the file starts with the header `Rank,Player,Team,Position` and contains valid player rows.
