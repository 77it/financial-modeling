# Sobol Sensitivity Analysis

Identifying which input variables drive the most variance in your outputs across Monte Carlo simulations.

```js
import * as Plot from "@observablehq/plot";
```

```js
// Load the sensitivity data
const sensitivity = FileAttachment("data/sensitivity.json").json();
```

```js
// Create reactive inputs for user controls
const kpiInput = Inputs.select(["revenue", "ebitda", "net_income"], {
  label: "Output Metric",
  value: "revenue"
});
const kpi = Generators.input(kpiInput);
```

```js
// Get unique dates and sort them
const dates = [...new Set(sensitivity.map(d => d.date))].sort();
const dateInput = Inputs.select(dates, {
  label: "Year",
  format: d => new Date(d).getFullYear()
});
const selectedDate = Generators.input(dateInput);
```

```js
const topNInput = Inputs.range([5, 30], {
  label: "Top N Variables",
  step: 1,
  value: 15
});
const topN = Generators.input(topNInput);
```

<div class="grid grid-cols-3">
  <div class="card">
    ${kpiInput}
  </div>
  <div class="card">
    ${dateInput}
  </div>
  <div class="card">
    ${topNInput}
  </div>
</div>

```js
// Filter data for selected KPI and date
const filteredData = sensitivity
  .filter(d => d.kpi === kpi && d.date === selectedDate)
  .slice(0, topN);
```

```js
// Calculate statistics
const totalSensitivity = filteredData.reduce((sum, d) => sum + d.sensitivity, 0);
const allDataForKpiDate = sensitivity.filter(d => d.kpi === kpi && d.date === selectedDate);
const totalVariance = allDataForKpiDate.reduce((sum, d) => sum + d.sensitivity, 0);
const cumulativePct = (totalSensitivity / totalVariance * 100).toFixed(1);
```

## Key Metrics

<div class="grid grid-cols-3">
  <div class="card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">Top Variable Impact</div>
    <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">${filteredData[0]?.sensitivity.toFixed(1)}%</div>
    <div style="font-size: 12px; opacity: 0.9;">${filteredData[0]?.variable}</div>
  </div>

  <div class="card" style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); color: white;">
    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">Top ${topN} Cumulative</div>
    <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">${cumulativePct}%</div>
    <div style="font-size: 12px; opacity: 0.9;">of total variance explained</div>
  </div>

  <div class="card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 4px;">Analysis</div>
    <div style="font-size: 28px; font-weight: 700; margin-bottom: 4px;">${kpi.toUpperCase()}</div>
    <div style="font-size: 12px; opacity: 0.9;">Year ${new Date(selectedDate).getFullYear()}</div>
  </div>
</div>

## Understanding the Numbers

<div class="card info-box">

**Sensitivity % (bar):** How much of the OUTPUT variance this variable explains. 10% means this variable accounts for 10% of why your ${kpi.toUpperCase()} varies across simulations.

**Correlation % (right):** The DIRECTION and STRENGTH of relationship. +85% = strong positive (input ↑ → output ↑), -60% = strong negative (input ↑ → output ↓).

</div>

## Tornado Chart - Top ${topN} Drivers of ${kpi.toUpperCase()}

```js
Plot.plot({
  width: 1000,
  height: Math.max(400, topN * 30),
  marginLeft: 150,
  marginRight: 80,
  x: {
    label: "Sensitivity (%)",
    grid: true
  },
  y: {
    label: null,
    domain: filteredData.map(d => d.variable)
  },
  color: {
    type: "linear",
    scheme: "Blues",
    reverse: true
  },
  marks: [
    Plot.barX(filteredData, {
      x: "sensitivity",
      y: "variable",
      fill: (d, i) => i,
      sort: {y: "-x"}
    }),
    Plot.text(filteredData, {
      x: "sensitivity",
      y: "variable",
      text: d => `${d.sensitivity.toFixed(1)}%`,
      textAnchor: "start",
      dx: 5,
      fill: "white",
      fontWeight: "bold"
    }),
    Plot.text(filteredData, {
      x: 0,
      y: "variable",
      text: d => `${d.correlation > 0 ? '+' : ''}${(d.correlation * 100).toFixed(0)}%`,
      textAnchor: "end",
      dx: -10,
      fill: "#64748b",
      fontWeight: "bold"
    })
  ]
})
```

## Variable Importance Over Time

```js
// Get top variables across all dates for this KPI
const topVarsOverall = new Set();
dates.forEach(date => {
  const dateData = sensitivity
    .filter(d => d.kpi === kpi && d.date === date)
    .slice(0, 10);
  dateData.forEach(d => topVarsOverall.add(d.variable));
});

// Create data for time series
const timeSeriesData = [];
topVarsOverall.forEach(variable => {
  dates.forEach(date => {
    const item = sensitivity.find(d => d.kpi === kpi && d.date === date && d.variable === variable);
    if (item) {
      timeSeriesData.push({
        variable,
        date,
        year: new Date(date).getFullYear(),
        sensitivity: item.sensitivity
      });
    }
  });
});
```

```js
Plot.plot({
  width: 1000,
  height: 400,
  marginLeft: 150,
  x: {
    label: "Year",
    tickFormat: d => new Date(d).getFullYear()
  },
  y: {
    label: "Sensitivity (%)",
    grid: true
  },
  color: {
    legend: true
  },
  marks: [
    Plot.line(timeSeriesData, {
      x: "date",
      y: "sensitivity",
      stroke: "variable",
      strokeWidth: 2,
      marker: "circle"
    })
  ]
})
```

## Interpretation Guide

<div class="card">

### 📊 How to Use This Analysis:

**Identify Key Drivers:** Variables at the top of the tornado chart have the most impact on your output variance. Focus your attention on understanding and managing these variables.

**Understand Direction:** The correlation percentage tells you whether the relationship is positive or negative:
- **Positive (+):** When this input increases, the output tends to increase
- **Negative (-):** When this input increases, the output tends to decrease

**Focus Resources:** Variables with high sensitivity deserve more careful forecasting, monitoring, and risk management.

**Track Changes:** The time series chart shows how variable importance changes over time. Variables that become more important in later years require strategic attention.

### 💡 Next Steps:

1. For high-sensitivity variables: Improve forecast accuracy and gather more data
2. For negatively correlated variables: Consider hedging strategies
3. For variables with increasing importance: Develop early warning indicators
4. Review and validate the relationships with domain experts

</div>

<style>
  .info-box {
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 16px;
    margin: 20px 0;
  }
</style>
