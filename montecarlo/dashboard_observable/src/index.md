# Monte Carlo Simulation Dashboard

Welcome to the Monte Carlo Simulation Dashboard for **ACME S.p.A.** financial projections.

```js
// Load the data
const percentiles = FileAttachment("data/percentiles.json").json();
const monteCarloData = FileAttachment("data/monte-carlo.csv").csv({typed: true});
```

```js
import * as Plot from "@observablehq/plot";
```

## Overview

This dashboard provides comprehensive risk analysis for financial projections using Monte Carlo simulation techniques. The analysis includes:

<div class="grid grid-cols-2">
  <div class="card feature-card">
    <h3>📈 Cash Flow Risk Analysis</h3>
    <p>Visualize downside risk scenarios using fan charts that show probability distributions of revenue, EBITDA, and net income over time.</p>
    <a href="./cashflow-risk" class="button">View Analysis →</a>
  </div>

  <div class="card feature-card">
    <h3>📊 Sensitivity Analysis</h3>
    <p>Identify which input variables drive the most variance in outputs using Sobol sensitivity indices and tornado charts.</p>
    <a href="./sensitivity" class="button">View Analysis →</a>
  </div>
</div>

## Key Metrics Summary

```js
// Calculate summary statistics for the last year
const lastDate = [...new Set(percentiles.map(d => d.date))].sort().pop();
const lastYearData = percentiles.filter(d => d.date === lastDate);
```

<div class="grid grid-cols-3">
  ${lastYearData.map(d => html`
    <div class="card metric-card">
      <h4>${d.kpi.toUpperCase()}</h4>
      <div class="metric-grid">
        <div>
          <div class="metric-label">P50 (Median)</div>
          <div class="metric-value">€${(d.p50/1000).toFixed(0)}k</div>
        </div>
        <div>
          <div class="metric-label">P5 (Downside)</div>
          <div class="metric-value downside">€${(d.p05/1000).toFixed(0)}k</div>
        </div>
        <div>
          <div class="metric-label">P95 (Upside)</div>
          <div class="metric-value upside">€${(d.p95/1000).toFixed(0)}k</div>
        </div>
        <div>
          <div class="metric-label">Range</div>
          <div class="metric-value">€${((d.p95 - d.p05)/1000).toFixed(0)}k</div>
        </div>
      </div>
    </div>
  `)}
</div>

## Simulation Overview

```js
const numSimulations = monteCarloData.filter(d => d.scenario.startsWith('Sim_')).length;
const uniqueScenarios = new Set(monteCarloData.map(d => d.scenario)).size;
const simulationCount = uniqueScenarios - 3; // Subtract base, best, worst
```

<div class="card stats-card">
  <div class="grid grid-cols-3">
    <div class="stat-item">
      <div class="stat-number">${simulationCount.toLocaleString()}</div>
      <div class="stat-label">Simulation Scenarios</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">3</div>
      <div class="stat-label">Key Performance Indicators</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">4</div>
      <div class="stat-label">Years Projected</div>
    </div>
  </div>
</div>

## Quick View: Revenue Projections

```js
const revenueData = percentiles.filter(d => d.kpi === 'revenue');
```

```js
Plot.plot({
  width: 1000,
  height: 400,
  marginLeft: 80,
  x: {
    type: "band",
    label: "Year",
    tickFormat: d => new Date(d).getFullYear()
  },
  y: {
    label: "Revenue (EUR)",
    grid: true
  },
  marks: [
    // P25-P75 range
    Plot.areaY(revenueData, {
      x: "date",
      y1: "p25",
      y2: "p75",
      fill: "#93c5fd",
      fillOpacity: 0.3
    }),
    // P5-P95 range
    Plot.areaY(revenueData, {
      x: "date",
      y1: "p05",
      y2: "p95",
      fill: "#bfdbfe",
      fillOpacity: 0.2
    }),
    // Median line
    Plot.lineY(revenueData, {
      x: "date",
      y: "p50",
      stroke: "#1e40af",
      strokeWidth: 3,
      marker: "circle"
    }),
    // Base scenario
    Plot.lineY(revenueData, {
      x: "date",
      y: "base",
      stroke: "#6366f1",
      strokeWidth: 2,
      strokeDasharray: "5,5",
      marker: "circle"
    })
  ]
})
```

<div class="card legend-card">
  <div class="legend-item">
    <div class="legend-color" style="background: #1e40af;"></div>
    <span>P50 (Median) - Most likely outcome</span>
  </div>
  <div class="legend-item">
    <div class="legend-color" style="background: #6366f1; border-style: dashed;"></div>
    <span>Base scenario - Original projection</span>
  </div>
  <div class="legend-item">
    <div class="legend-color" style="background: #93c5fd;"></div>
    <span>P25-P75 range - 50% of outcomes fall here</span>
  </div>
  <div class="legend-item">
    <div class="legend-color" style="background: #bfdbfe;"></div>
    <span>P5-P95 range - 90% of outcomes fall here</span>
  </div>
</div>

## About This Dashboard

This dashboard uses **Observable Framework** to provide interactive visualizations of Monte Carlo simulation results. The data represents **${simulationCount}** different scenarios for financial projections of ACME S.p.A.

### Methodology

- **Monte Carlo Simulation:** Random sampling technique to model probability distributions of uncertain variables
- **Percentiles:** Statistical measures showing the distribution of outcomes (P5 = 5th percentile, P50 = median, P95 = 95th percentile)
- **Sobol Sensitivity Analysis:** Variance-based method to identify which input variables most affect the output variance

### Navigation

Use the navigation menu to explore:
- **Cash Flow Risk:** Detailed fan charts showing risk scenarios
- **Sensitivity Analysis:** Tornado charts identifying key drivers of variance

<style>
  .feature-card {
    border: 2px solid #e2e8f0;
    transition: all 0.2s;
  }

  .feature-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }

  .feature-card h3 {
    margin-top: 0;
    color: #1e293b;
  }

  .feature-card p {
    color: #64748b;
    margin: 12px 0;
  }

  .button {
    display: inline-block;
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    transition: background 0.2s;
  }

  .button:hover {
    background: #2563eb;
  }

  .metric-card h4 {
    margin: 0 0 12px 0;
    color: #475569;
    font-size: 14px;
    font-weight: 600;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .metric-label {
    font-size: 11px;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .metric-value {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
  }

  .metric-value.downside {
    color: #ef4444;
  }

  .metric-value.upside {
    color: #10b981;
  }

  .stats-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .stat-item {
    text-align: center;
  }

  .stat-number {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 14px;
    opacity: 0.9;
  }

  .legend-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
  }

  .legend-color {
    width: 40px;
    height: 4px;
    border-radius: 2px;
  }
</style>
