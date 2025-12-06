# ACTUAL Monte Carlo Project Workflow

## Real Workflow (Your Project)

### 1. Input: Excel Template
**File:** `montecarlo_input_template5.xlsx`

**Sheets:**
- **Variables** - Define variables with discrete distributions
- **Settings** - Configuration (engine, runs, seed)

**Columns in Variables sheet:**
- `variable` - Variable name (case-insensitive)
- `date` - Period label (YYYY, YYYY-MM, or YYYY-MM-DD)
- `best <-> worst values` - JSON array ordered BEST → WORST by business judgment
- `probabilities` - JSON array of probabilities (auto-normalized)
- `group` - Optional grouping for synchronized sampling

**Key Rules:**
- Arrays ordered BEST (left) → WORST (right) by user judgment
- Base case = highest probability value
- Probabilities must match within same (group, month)
- Variables in same group must have equal array lengths
- Uses SOBOL quasi-random sampling (recommended: 16K-131K runs)

### 2. Generation: Python Scripts

#### A) Analyze Scenario Space
```bash
python montecarlo_analyze_scenario_space_v5.py --input montecarlo_input_template5.xlsx
```
Analyzes combinatorial complexity before running full simulation.

#### B) Generate Monte Carlo Samples
```bash
python montecarlo_generate_v18.py \
  --input montecarlo_input_template5.xlsx \
  --out montecarlo_output2.txt
```

**What it does:**
- Reads Excel template
- Validates rules (probabilities, groups, array lengths)
- Generates samples using SOBOL or RANDOM engine
- Outputs JSON with sampled variable values per run

**Recommended Runs:**
- **P95 (business planning):** 32,768 runs
- **P99 (stress test):** 65,536-131,072 runs
- Powers of 2 for optimal SOBOL convergence

### 3. Processing: Excel or JavaScript

**Excel takes Monte Carlo samples one by one** and calculates:
- Revenue
- EBITDA
- Net Income
- Other KPIs

For each:
- Scenario (base, best, worst, Sim_XXXXX)
- Date
- KPI name
- Value

### 4. Output: plot_data.csv

**Format:**
```csv
# company: ACME S.p.A.
# currency: EUR
scenario,date,kpi,value
base,2025-12-31,revenue,1229488.18
base,2025-12-31,ebitda,279608.87
base,2025-12-31,net_income,796161.77
best,2025-12-31,revenue,1183843.57
...
Sim_00004,2025-12-31,revenue,1075378.75
Sim_00004,2025-12-31,ebitda,1144573.09
...
```

**Structure:**
- **Comment rows:** `#` prefix (company, currency metadata)
- **Header:** `scenario,date,kpi,value`
- **Special scenarios:**
  - `base` - Base case (row 1 after header)
  - `best` - Best case (row 2)
  - `worst` - Worst case (row 3)
- **Simulation scenarios:** `Sim_XXXXX` (numbered simulations)
- **Dates:** YYYY-MM-DD format
- **KPIs:** revenue, ebitda, net_income, etc.

### 5. Visualization: Observable Framework (To Be Built)

**Current visualization:**
- React/TypeScript dashboard in `dashboard_tsx/`
- Uses Recharts library
- Shows fan charts, percentiles, sample paths

**Goal: Migrate to Observable Framework**

Observable Framework will:
1. Load `plot_data.csv` directly
2. Calculate percentiles over time per KPI
3. Display interactive charts:
   - Fan charts (P5, P25, P50, P75, P95 bands)
   - Individual simulation paths
   - Distribution histograms
   - Risk threshold analysis

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│  montecarlo_input_template5.xlsx   │
│  - Variables with distributions     │
│  - Groups for synchronized sampling │
│  - Settings (SOBOL, runs)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  montecarlo_generate_v18.py         │
│  - Validates rules                  │
│  - Generates SOBOL samples          │
│  - Outputs JSON (32K-131K runs)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Excel / JavaScript Processing      │
│  - Takes samples one by one         │
│  - Calculates KPIs per scenario     │
│  - Outputs results                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  plot_data.csv                      │
│  scenario,date,kpi,value            │
│  - base, best, worst                │
│  - Sim_XXXXX (thousands of runs)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Observable Framework Dashboard     │
│  - Load CSV with FileAttachment     │
│  - Calculate percentiles            │
│  - Interactive fan charts           │
│  - Risk analysis                    │
└─────────────────────────────────────┘
```

## Key Differences from Generic Monte Carlo

### Your Project:
1. ✅ **Discrete distributions** (not continuous GBM)
2. ✅ **SOBOL quasi-random** sampling (not pseudo-random)
3. ✅ **Grouped variables** (synchronized sampling)
4. ✅ **Excel input template** (not Python-only)
5. ✅ **Excel/JS processing** (not Python end-to-end)
6. ✅ **CSV output format** (scenario, date, kpi, value)

### Generic Examples (WRONG for your project):
1. ❌ Geometric Brownian Motion (continuous)
2. ❌ Python-only simulation
3. ❌ Direct JSON output
4. ❌ Independent variable sampling

## Observable Framework Integration

### What Observable Needs to Do:

1. **Load plot_data.csv**
```javascript
const rawData = FileAttachment("data/plot_data.csv").csv();
```

2. **Parse comments** (company, currency from # rows)

3. **Separate scenarios:**
   - base, best, worst (reference scenarios)
   - Sim_XXXXX (simulated scenarios)

4. **Calculate percentiles** per (date, kpi):
   - P1, P5, P10, P25, P50, P75, P90, P95, P99

5. **Visualize:**
   - Fan chart with percentile bands
   - Base/best/worst as reference lines
   - Sample simulation paths (show ~50 out of thousands)
   - Distribution at specific dates

## Next Steps

1. Create Observable data loader for `plot_data.csv`
2. Parse metadata from comments
3. Transform to percentile time series
4. Build fan chart visualization
5. Add interactive controls (KPI selector, date range)
6. Add risk threshold analysis

See `dashboard_tsx/sobol_fan_chart.tsx` for existing visualization logic to replicate.
