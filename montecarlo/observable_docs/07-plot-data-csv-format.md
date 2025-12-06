# plot_data.csv Format Specification

## Overview

`plot_data.csv` is the **output format** from your Monte Carlo workflow, containing scenario-based financial projections ready for visualization.

## File Structure

### 1. Comment Rows (Metadata)

Lines starting with `#` contain metadata:

```csv
# company: ACME S.p.A.
# currency: EUR
```

**Fields:**
- `company` - Company name
- `currency` - Currency code (EUR, USD, etc.)

### 2. Header Row

```csv
scenario,date,kpi,value
```

**Columns:**
- `scenario` - Scenario identifier
- `date` - Date in YYYY-MM-DD format
- `kpi` - KPI name (revenue, ebitda, net_income, etc.)
- `value` - Numeric value

### 3. Data Rows

#### Special Scenarios (Always First 3)

**Order matters!** First 3 scenarios after header:

1. **base** - Base case (most likely/median scenario)
2. **best** - Best case scenario
3. **worst** - Worst case scenario

```csv
base,2025-12-31,revenue,1229488.18
base,2025-12-31,ebitda,279608.87
base,2025-12-31,net_income,796161.77
best,2025-12-31,revenue,1183843.57
best,2025-12-31,ebitda,1682231.41
...
worst,2025-12-31,revenue,824871.14
worst,2025-12-31,ebitda,1709704.61
...
```

#### Simulation Scenarios

Format: `Sim_XXXXX` where XXXXX is zero-padded 5-digit number

```csv
Sim_00001,2025-12-31,revenue,1075378.75
Sim_00001,2025-12-31,ebitda,1144573.09
Sim_00001,2025-12-31,net_income,1069853.70
Sim_00002,2025-12-31,revenue,950123.45
...
Sim_32768,2028-12-31,net_income,1234567.89
```

**Typical range:** Sim_00001 to Sim_32768 (32,768 SOBOL runs)

## Complete Example

```csv
# company: ACME S.p.A.
# currency: EUR
scenario,date,kpi,value
base,2025-12-31,revenue,1229488.18
base,2025-12-31,ebitda,279608.87
base,2025-12-31,net_income,796161.77
base,2026-12-31,revenue,1133410.63
base,2026-12-31,ebitda,1518221.70
base,2026-12-31,net_income,710200.60
best,2025-12-31,revenue,1183843.57
best,2025-12-31,ebitda,1682231.41
best,2025-12-31,net_income,1819273.66
best,2026-12-31,revenue,1331412.36
worst,2025-12-31,revenue,824871.14
worst,2025-12-31,ebitda,1709704.61
worst,2025-12-31,net_income,1512878.44
worst,2026-12-31,revenue,467432.32
Sim_00001,2025-12-31,revenue,1075378.75
Sim_00001,2025-12-31,ebitda,1144573.09
Sim_00001,2025-12-31,net_income,1069853.70
Sim_00001,2026-12-31,revenue,950200.00
...
Sim_32768,2028-12-31,net_income,1234567.89
```

## Data Characteristics

### Scenarios
- **3 reference scenarios:** base, best, worst
- **N simulation scenarios:** Sim_00001 to Sim_NNNNN
- **Total scenarios:** 3 + N (typically 3 + 32,768 = 32,771)

### Dates
- **Format:** YYYY-MM-DD (ISO 8601)
- **Typical:** Annual (year-end dates like 2025-12-31)
- **Range:** Multi-year projections (e.g., 2025-2028)

### KPIs
Common financial metrics:
- `revenue` - Total revenue
- `ebitda` - Earnings before interest, tax, depreciation, amortization
- `net_income` - Net profit/loss
- `cash_flow` - Operating cash flow
- `debt` - Total debt
- Custom KPIs as defined by user

### Values
- **Type:** Numeric (float)
- **Precision:** Typically 2 decimal places
- **Currency:** As specified in metadata

## Row Count Calculation

For a typical file with:
- 3 reference scenarios (base, best, worst)
- 32,768 simulations (Sim_00001 to Sim_32768)
- 4 years (2025, 2026, 2027, 2028)
- 3 KPIs (revenue, ebitda, net_income)

**Total rows:**
```
Header: 1
Comments: 2
Data: (3 + 32,768) scenarios × 4 years × 3 KPIs = 393,708 rows
Total: 393,711 rows
```

**File size:** ~15-20 MB for 32K simulations

## Parsing Logic

### JavaScript/TypeScript

```javascript
// Parse CSV with D3
const data = d3.csvParse(csvText, d3.autoType);

// Separate metadata from data rows
const metadata = {};
const comments = csvText.split('\n').filter(line => line.startsWith('#'));
comments.forEach(line => {
  const match = line.match(/# (\w+):\s*(.+)/);
  if (match) {
    metadata[match[1]] = match[2].trim();
  }
});

// Separate scenarios
const referenceScenarios = data.filter(d =>
  ['base', 'best', 'worst'].includes(d.scenario)
);

const simulationScenarios = data.filter(d =>
  d.scenario.startsWith('Sim_')
);
```

### Python

```python
import pandas as pd

# Read CSV, skipping comment rows
df = pd.read_csv('plot_data.csv', comment='#')

# Parse metadata from comments
metadata = {}
with open('plot_data.csv') as f:
    for line in f:
        if line.startswith('#'):
            parts = line[1:].strip().split(':', 1)
            if len(parts) == 2:
                metadata[parts[0].strip()] = parts[1].strip()

# Separate scenarios
ref_scenarios = df[df['scenario'].isin(['base', 'best', 'worst'])]
sim_scenarios = df[df['scenario'].str.startswith('Sim_')]
```

## Validation Rules

### Must Have:
1. ✅ At least 2 comment rows (company, currency)
2. ✅ Header row with exact columns: scenario,date,kpi,value
3. ✅ Exactly 3 reference scenarios: base, best, worst
4. ✅ At least 1 simulation scenario (Sim_XXXXX)
5. ✅ All dates in YYYY-MM-DD format
6. ✅ All values are numeric

### Should Have:
1. ⚠️ Simulation scenarios numbered sequentially (Sim_00001, Sim_00002, ...)
2. ⚠️ Same KPIs across all scenarios
3. ⚠️ Same dates across all scenarios
4. ⚠️ Power of 2 number of simulations (for SOBOL: 256, 512, 1024, etc.)

## Observable Framework Usage

### Load CSV

```javascript
const rawData = FileAttachment("data/plot_data.csv").csv({typed: true});
```

### Parse Metadata

```javascript
const csvText = await FileAttachment("data/plot_data.csv").text();
const metadata = {};
csvText.split('\n')
  .filter(line => line.startsWith('#'))
  .forEach(line => {
    const match = line.match(/# (\w+):\s*(.+)/);
    if (match) metadata[match[1]] = match[2].trim();
  });
```

### Transform to Time Series by KPI

```javascript
// Group by KPI and date, calculate percentiles from simulations
const timeSeriesByKPI = {};

// Get unique KPIs
const kpis = [...new Set(rawData.map(d => d.kpi))];

kpis.forEach(kpiName => {
  const kpiData = rawData.filter(d => d.kpi === kpiName);

  // Get unique dates
  const dates = [...new Set(kpiData.map(d => d.date))].sort();

  const timeSeries = dates.map(date => {
    const dateData = kpiData.filter(d => d.date === date);

    // Reference scenarios
    const base = dateData.find(d => d.scenario === 'base')?.value;
    const best = dateData.find(d => d.scenario === 'best')?.value;
    const worst = dateData.find(d => d.scenario === 'worst')?.value;

    // Simulation values
    const simValues = dateData
      .filter(d => d.scenario.startsWith('Sim_'))
      .map(d => d.value)
      .sort((a, b) => a - b);

    return {
      date,
      base,
      best,
      worst,
      p1: d3.quantile(simValues, 0.01),
      p5: d3.quantile(simValues, 0.05),
      p25: d3.quantile(simValues, 0.25),
      p50: d3.quantile(simValues, 0.50),
      p75: d3.quantile(simValues, 0.75),
      p95: d3.quantile(simValues, 0.95),
      p99: d3.quantile(simValues, 0.99),
      min: simValues[0],
      max: simValues[simValues.length - 1]
    };
  });

  timeSeriesByKPI[kpiName] = timeSeries;
});
```

## Sample Generation

Use `plot_SAMPLE_data_generator__csv__v2.py` to generate test data:

```bash
# Generate 50 scenarios (3 ref + 47 sims) for 4 years
python plot_SAMPLE_data_generator__csv__v2.py --scenarios 50 --years 2025 2026 2027 2028
```

## See Also

- [00-ACTUAL-PROJECT-WORKFLOW.md](./00-ACTUAL-PROJECT-WORKFLOW.md) - Complete workflow
- [08-observable-data-loader-example.md](./08-observable-data-loader-example.md) - Data loader implementation
