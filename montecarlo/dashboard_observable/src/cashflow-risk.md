# Cash Flow Risk Analysis

Downside risk visualization for Monte Carlo simulations showing revenue, EBITDA, and net income projections.

```js
import * as Plot from "@observablehq/plot";
```

```js
// Load the percentile data
const percentiles = FileAttachment("data/percentiles.json").json();
```

```js
// Create reactive inputs for user controls
const kpiInput = Inputs.select(["revenue", "ebitda", "net_income"], {
  label: "Select KPI",
  value: "revenue"
});
const kpi = Generators.input(kpiInput);
```

```js
const thresholdInput = Inputs.range([0, 2000000], {
  label: "Minimum threshold (EUR)",
  step: 10000,
  value: 500000
});
const threshold = Generators.input(thresholdInput);
```

<div class="grid grid-cols-2">
  <div class="card">
    ${kpiInput}
  </div>
  <div class="card">
    ${thresholdInput}
  </div>
</div>

```js
// Filter data for selected KPI
const kpiData = percentiles.filter(d => d.kpi === kpi);
```

```js
// Find risk points
const firstRiskMonth = kpiData.findIndex(d => d.p10 < threshold);
const criticalMonth = kpiData.findIndex(d => d.p50 < threshold);
```

${firstRiskMonth >= 0 ? html`
<div class="warning">
  <strong>⚠️ Warning:</strong> 10% of scenarios fall below €${(threshold/1000).toFixed(0)}k threshold at ${kpiData[firstRiskMonth].date}
</div>
` : ""}

${criticalMonth >= 0 ? html`
<div class="critical">
  <strong>🚨 Critical:</strong> Median (P50) falls below threshold at ${kpiData[criticalMonth].date}
</div>
` : ""}

## Risk Fan Chart

```js
// Create the fan chart showing percentile ranges
Plot.plot({
  width: 1000,
  height: 500,
  marginLeft: 80,
  marginBottom: 60,
  x: {
    type: "band",
    label: "Date"
  },
  y: {
    label: `${kpi.toUpperCase()} (EUR)`,
    grid: true
  },
  marks: [
    // P1-P5 range (worst 5%)
    Plot.areaY(kpiData, {
      x: "date",
      y1: "p01",
      y2: "p05",
      fill: "#ef4444",
      fillOpacity: 0.4
    }),
    // P5-P25 range (downside risk)
    Plot.areaY(kpiData, {
      x: "date",
      y1: "p05",
      y2: "p25",
      fill: "#fca5a5",
      fillOpacity: 0.3
    }),
    // P25-P75 range (middle range)
    Plot.areaY(kpiData, {
      x: "date",
      y1: "p25",
      y2: "p75",
      fill: "#93c5fd",
      fillOpacity: 0.3
    }),
    // P75-P95 range (upside)
    Plot.areaY(kpiData, {
      x: "date",
      y1: "p75",
      y2: "p95",
      fill: "#86efac",
      fillOpacity: 0.2
    }),
    // Threshold line
    Plot.ruleY([threshold], {
      stroke: "#dc2626",
      strokeWidth: 2,
      strokeDasharray: "4,4"
    }),
    // Key percentile lines
    Plot.lineY(kpiData, {x: "date", y: "p05", stroke: "#dc2626", strokeWidth: 2.5}),
    Plot.lineY(kpiData, {x: "date", y: "p10", stroke: "#f97316", strokeWidth: 2, strokeDasharray: "5,5"}),
    Plot.lineY(kpiData, {x: "date", y: "p50", stroke: "#1e40af", strokeWidth: 3}),
    Plot.lineY(kpiData, {x: "date", y: "p95", stroke: "#16a34a", strokeWidth: 1.5, strokeDasharray: "5,5", strokeOpacity: 0.6}),
    // Base scenario
    Plot.lineY(kpiData, {x: "date", y: "base", stroke: "#6366f1", strokeWidth: 2, strokeDasharray: "3,3"})
  ]
})
```

## Key Statistics

<div class="grid grid-cols-4">
  ${kpiData.map((d, i) => {
    if (i === kpiData.length - 1) {
      return html`
        <div class="card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">WORST CASE (P5)</div>
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">€${(d.p05/1000).toFixed(0)}k</div>
          <div style="font-size: 12px; opacity: 0.9;">Only 5% fall below this</div>
        </div>
        <div class="card" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white;">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">DOWNSIDE (P10)</div>
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">€${(d.p10/1000).toFixed(0)}k</div>
          <div style="font-size: 12px; opacity: 0.9;">10% fall below this</div>
        </div>
        <div class="card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">EXPECTED (P50)</div>
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">€${(d.p50/1000).toFixed(0)}k</div>
          <div style="font-size: 12px; opacity: 0.9;">Median outcome</div>
        </div>
        <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
          <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">UPSIDE (P95)</div>
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">€${(d.p95/1000).toFixed(0)}k</div>
          <div style="font-size: 12px; opacity: 0.9;">Only 5% exceed this</div>
        </div>
      `;
    }
  })}
</div>

## Risk-Focused Interpretation

<div class="card">

### 📊 Understanding the Chart:

- **P5 Line (Red):** Your safety net. 95% of scenarios stay above this level. If this crosses your threshold, you have serious liquidity risk.
- **P10 Line (Orange):** Early warning. If 10% of scenarios run into trouble, you should have contingency plans ready.
- **P50 Line (Blue):** Base case. Your most likely outcome - but remember, half of scenarios do worse!
- **Red band:** High risk zone. The worst 5% of outcomes fall here. This is where you face potential crises.
- **P95 Line (Green):** Best case. Only 5% of scenarios do better - don't plan around optimistic outcomes!

### 💡 Key Questions This Chart Answers:

- When might we run out of cash? (Look when P5 or P10 crosses your threshold)
- How much runway do we have in bad scenarios? (Follow the red P5 line)
- What's our downside vs upside? (Compare distance from P50 to P5 vs P50 to P95)
- Should we raise more capital? (If P10 gets too close to minimum cash)

</div>

<style>
  .warning {
    padding: 16px;
    background: #fef2f2;
    border-left: 4px solid #ef4444;
    border-radius: 8px;
    margin: 20px 0;
  }

  .critical {
    padding: 16px;
    background: #fef2f2;
    border-left: 4px solid #dc2626;
    border-radius: 8px;
    margin: 20px 0;
    font-weight: bold;
  }
</style>
