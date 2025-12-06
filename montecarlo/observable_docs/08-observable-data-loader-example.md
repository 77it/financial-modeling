# Observable Data Loader for plot_data.csv

## Data Loader Implementation

Create `src/data/monte-carlo-timeseries.json.js`:

```javascript
import * as d3 from "d3";
import { readFile } from "node:fs/promises";

// Read the CSV file
const csvText = await readFile("./plot_data.csv", "utf-8");

// Parse metadata from comment lines
const metadata = {};
const commentLines = csvText.split('\n').filter(line => line.startsWith('#'));
commentLines.forEach(line => {
  const match = line.match(/# (\w+):\s*(.+)/);
  if (match) {
    metadata[match[1]] = match[2].trim();
  }
});

// Parse CSV data
const rawData = d3.csvParse(csvText, d3.autoType);

// Separate reference and simulation scenarios
const referenceData = rawData.filter(d =>
  ['base', 'best', 'worst'].includes(d.scenario)
);

const simulationData = rawData.filter(d =>
  d.scenario.startsWith('Sim_')
);

// Get unique KPIs and dates
const kpis = [...new Set(rawData.map(d => d.kpi))];
const dates = [...new Set(rawData.map(d => d.date))].sort();

// Calculate percentiles per KPI and date
const timeSeriesByKPI = {};

kpis.forEach(kpiName => {
  const kpiSimData = simulationData.filter(d => d.kpi === kpiName);
  const kpiRefData = referenceData.filter(d => d.kpi === kpiName);

  const timeSeries = dates.map(date => {
    // Get reference scenarios for this date
    const base = kpiRefData.find(d => d.scenario === 'base' && d.date === date)?.value;
    const best = kpiRefData.find(d => d.scenario === 'best' && d.date === date)?.value;
    const worst = kpiRefData.find(d => d.scenario === 'worst' && d.date === date)?.value;

    // Get all simulation values for this date
    const simValues = kpiSimData
      .filter(d => d.date === date)
      .map(d => d.value)
      .sort((a, b) => a - b);

    // Calculate percentiles
    const result = {
      date,
      kpi: kpiName,
      base,
      best,
      worst,
      count: simValues.length
    };

    if (simValues.length > 0) {
      result.p1 = d3.quantile(simValues, 0.01);
      result.p5 = d3.quantile(simValues, 0.05);
      result.p10 = d3.quantile(simValues, 0.10);
      result.p25 = d3.quantile(simValues, 0.25);
      result.p50 = d3.quantile(simValues, 0.50);
      result.p75 = d3.quantile(simValues, 0.75);
      result.p90 = d3.quantile(simValues, 0.90);
      result.p95 = d3.quantile(simValues, 0.95);
      result.p99 = d3.quantile(simValues, 0.99);
      result.min = simValues[0];
      result.max = simValues[simValues.length - 1];
      result.mean = d3.mean(simValues);
      result.std = d3.deviation(simValues);
    }

    return result;
  });

  timeSeriesByKPI[kpiName] = timeSeries;
});

// Output JSON
const output = {
  metadata,
  kpis,
  dates,
  timeSeries: timeSeriesByKPI,
  stats: {
    totalScenarios: new Set(rawData.map(d => d.scenario)).size,
    simulationCount: new Set(simulationData.map(d => d.scenario)).size,
    dateRange: {
      start: dates[0],
      end: dates[dates.length - 1]
    }
  }
};

process.stdout.write(JSON.stringify(output, null, 2));
```

## Output Format

The data loader outputs JSON structured like:

```json
{
  "metadata": {
    "company": "ACME S.p.A.",
    "currency": "EUR"
  },
  "kpis": ["revenue", "ebitda", "net_income"],
  "dates": ["2025-12-31", "2026-12-31", "2027-12-31", "2028-12-31"],
  "timeSeries": {
    "revenue": [
      {
        "date": "2025-12-31",
        "kpi": "revenue",
        "base": 1229488.18,
        "best": 1183843.57,
        "worst": 824871.14,
        "count": 32768,
        "p1": 850000.00,
        "p5": 920000.00,
        "p10": 980000.00,
        "p25": 1080000.00,
        "p50": 1220000.00,
        "p75": 1360000.00,
        "p90": 1480000.00,
        "p95": 1550000.00,
        "p99": 1650000.00,
        "min": 800000.00,
        "max": 1700000.00,
        "mean": 1230000.00,
        "std": 185000.00
      },
      {
        "date": "2026-12-31",
        "kpi": "revenue",
        ...
      }
    ],
    "ebitda": [...],
    "net_income": [...]
  },
  "stats": {
    "totalScenarios": 32771,
    "simulationCount": 32768,
    "dateRange": {
      "start": "2025-12-31",
      "end": "2028-12-31"
    }
  }
}
```

## Usage in Observable Page

`src/index.md`:

````markdown
# Monte Carlo Risk Analysis

\`\`\`js
const data = FileAttachment("data/monte-carlo-timeseries.json").json();
\`\`\`

## Company: ${data.metadata.company}
Currency: ${data.metadata.currency}

Total scenarios: **${data.stats.totalScenarios.toLocaleString()}**
Simulations: **${data.stats.simulationCount.toLocaleString()}**
Period: ${data.stats.dateRange.start} to ${data.stats.dateRange.end}

## Select KPI

\`\`\`js
const selectedKPI = view(
  Inputs.select(data.kpis, {
    label: "KPI",
    value: "revenue"
  })
);
\`\`\`

\`\`\`js
const kpiData = data.timeSeries[selectedKPI];
\`\`\`

## Fan Chart - ${selectedKPI}

\`\`\`js
Plot.plot({
  width: 1000,
  height: 500,
  marginLeft: 80,
  y: {
    grid: true,
    label: `${selectedKPI} (${data.metadata.currency})`,
    tickFormat: "~s"
  },
  x: {
    label: "Date",
    type: "utc"
  },
  marks: [
    // P5-P95 band (90% confidence)
    Plot.areaY(kpiData, {
      x: d => new Date(d.date),
      y1: "p5",
      y2: "p95",
      fill: "steelblue",
      fillOpacity: 0.15
    }),
    // P25-P75 band (50% confidence)
    Plot.areaY(kpiData, {
      x: d => new Date(d.date),
      y1: "p25",
      y2: "p75",
      fill: "steelblue",
      fillOpacity: 0.25
    }),
    // Median line (P50)
    Plot.line(kpiData, {
      x: d => new Date(d.date),
      y: "p50",
      stroke: "darkblue",
      strokeWidth: 2.5,
      tip: true
    }),
    // Base case
    Plot.line(kpiData, {
      x: d => new Date(d.date),
      y: "base",
      stroke: "green",
      strokeWidth: 2,
      strokeDasharray: "4,4",
      tip: true
    }),
    // Best case
    Plot.line(kpiData, {
      x: d => new Date(d.date),
      y: "best",
      stroke: "limegreen",
      strokeWidth: 1.5,
      strokeDasharray: "2,2",
      tip: true
    }),
    // Worst case
    Plot.line(kpiData, {
      x: d => new Date(d.date),
      y: "worst",
      stroke: "red",
      strokeWidth: 1.5,
      strokeDasharray: "2,2",
      tip: true
    })
  ]
})
\`\`\`

**Legend:**
- **Blue band (wide):** 90% confidence interval (P5-P95)
- **Blue band (narrow):** 50% confidence interval (P25-P75)
- **Dark blue line:** Median (P50)
- **Green dashed:** Base case
- **Light green:** Best case
- **Red dashed:** Worst case

## Statistics Table

\`\`\`js
Inputs.table(kpiData, {
  columns: ["date", "base", "p5", "p25", "p50", "p75", "p95", "mean", "std"],
  header: {
    date: "Date",
    base: "Base",
    p5: "P5",
    p25: "P25",
    p50: "Median",
    p75: "P75",
    p95: "P95",
    mean: "Mean",
    std: "Std Dev"
  },
  format: {
    base: d => d?.toFixed(0),
    p5: d => d?.toFixed(0),
    p25: d => d?.toFixed(0),
    p50: d => d?.toFixed(0),
    p75: d => d?.toFixed(0),
    p95: d => d?.toFixed(0),
    mean: d => d?.toFixed(0),
    std: d => d?.toFixed(0)
  }
})
\`\`\`
````

## Alternative: Lazy-load CSV Directly

For smaller datasets or simpler use cases, skip the data loader and load CSV directly:

````markdown
\`\`\`js
import {parseMetadata, calculatePercentiles} from "./components/monte-carlo-utils.js";
\`\`\`

\`\`\`js
const csvText = await FileAttachment("data/plot_data.csv").text();
const metadata = parseMetadata(csvText);
const rawData = await FileAttachment("data/plot_data.csv").csv({typed: true});
\`\`\`

\`\`\`js
const kpis = [...new Set(rawData.map(d => d.kpi))];
const selectedKPI = view(Inputs.select(kpis, {label: "KPI", value: kpis[0]}));
\`\`\`

\`\`\`js
const kpiData = calculatePercentiles(rawData, selectedKPI);
\`\`\`

\`\`\`js
// Plot fan chart...
\`\`\`
````

`src/components/monte-carlo-utils.js`:

```javascript
export function parseMetadata(csvText) {
  const metadata = {};
  csvText.split('\n')
    .filter(line => line.startsWith('#'))
    .forEach(line => {
      const match = line.match(/# (\w+):\s*(.+)/);
      if (match) metadata[match[1]] = match[2].trim();
    });
  return metadata;
}

export function calculatePercentiles(rawData, kpiName) {
  import("d3").then(d3 => {
    const kpiData = rawData.filter(d => d.kpi === kpiName);
    const dates = [...new Set(kpiData.map(d => d.date))].sort();

    return dates.map(date => {
      const dateData = kpiData.filter(d => d.date === date);
      const base = dateData.find(d => d.scenario === 'base')?.value;
      const best = dateData.find(d => d.scenario === 'best')?.value;
      const worst = dateData.find(d => d.scenario === 'worst')?.value;

      const simValues = dateData
        .filter(d => d.scenario.startsWith('Sim_'))
        .map(d => d.value)
        .sort((a, b) => a - b);

      return {
        date,
        base,
        best,
        worst,
        p5: d3.quantile(simValues, 0.05),
        p25: d3.quantile(simValues, 0.25),
        p50: d3.quantile(simValues, 0.50),
        p75: d3.quantile(simValues, 0.75),
        p95: d3.quantile(simValues, 0.95)
      };
    });
  });
}
```

## Performance Considerations

### Data Loader (Recommended for Large Files)
- ✅ Pre-computes percentiles at build time
- ✅ Small JSON output (~10 KB vs ~20 MB CSV)
- ✅ Fast page loads
- ✅ No client-side processing

### Direct CSV Load
- ⚠️ Works for files <5 MB
- ⚠️ Client processes all data
- ⚠️ Slower initial load
- ✅ Simpler setup

**Recommendation:** Use data loader for production with 32K+ simulations.

## Next Steps

1. Copy data loader to `src/data/monte-carlo-timeseries.json.js`
2. Place `plot_data.csv` in project root (same directory as data loader)
3. Run `npm run dev`
4. Access data with `FileAttachment("data/monte-carlo-timeseries.json").json()`
5. Build visualizations as shown above

See also:
- [04-observable-plot-visualization.md](./04-observable-plot-visualization.md) - Chart examples
- [07-plot-data-csv-format.md](./07-plot-data-csv-format.md) - CSV format spec
