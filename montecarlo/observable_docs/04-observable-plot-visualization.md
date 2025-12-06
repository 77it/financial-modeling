# Observable Framework - Observable Plot for Monte Carlo Visualization

## What is Observable Plot?

**Observable Plot** is a free, open-source JavaScript library for visualizing tabular data. It features:
- Concise, memorable API
- Scales and layered marks
- Grammar of graphics style
- Built for reactive data apps

**Official Docs:** https://observablehq.com/plot/

## Installation

Observable Plot is **included by default** in Observable Framework. No installation needed!

```javascript
// Already available - just use it
Plot.plot({...})
```

## Core Concepts

### Marks

Marks are the **visual vocabulary** of Plot - the building blocks of charts:
- `Plot.line` - Line charts
- `Plot.dot` - Scatter plots
- `Plot.rect` - Rectangles (histograms)
- `Plot.bar` - Bar charts
- `Plot.area` - Area charts
- `Plot.boxY` - Box plots
- `Plot.text` - Text labels

### Composing Charts

The power of Plot is **composing multiple marks**:

```javascript
Plot.plot({
  marks: [
    Plot.ruleY([0]),              // Zero baseline
    Plot.line(data, {x: "day", y: "value"}),    // Line
    Plot.dot(data, {x: "day", y: "value"})      // Points
  ]
})
```

## Monte Carlo Visualizations

### 1. Histogram (Distribution)

Show the distribution of simulation outcomes:

```javascript
Plot.plot({
  marginLeft: 60,
  y: {
    grid: true,
    label: "Frequency"
  },
  x: {
    label: "Final Value"
  },
  marks: [
    Plot.rectY(
      data,
      Plot.binX(
        {y: "count"},
        {
          x: "finalValue",
          fill: "steelblue",
          thresholds: 50  // Number of bins
        }
      )
    ),
    Plot.ruleY([0])
  ]
})
```

### 2. Multiple Simulation Paths

Show individual simulation paths over time:

```javascript
Plot.plot({
  width: 800,
  height: 400,
  y: {
    grid: true,
    label: "Portfolio Value"
  },
  x: {
    label: "Day"
  },
  color: {
    legend: true
  },
  marks: [
    Plot.line(
      simulations,
      Plot.group(
        {stroke: "first"},  // Group by simulation ID
        {
          x: "day",
          y: "value",
          z: "simulationId",  // Each simulation is a separate line
          stroke: "simulationId",
          strokeOpacity: 0.1,  // Transparent lines
          strokeWidth: 1
        }
      )
    ),
    // Highlight mean path
    Plot.line(
      meanPath,
      {
        x: "day",
        y: "value",
        stroke: "red",
        strokeWidth: 3
      }
    )
  ]
})
```

### 3. Confidence Intervals (Fan Chart)

Show percentile bands:

```javascript
Plot.plot({
  y: {
    grid: true,
    label: "Value"
  },
  x: {
    label: "Day"
  },
  marks: [
    // 95% confidence interval
    Plot.areaY(
      percentiles,
      {
        x: "day",
        y1: "p5",
        y2: "p95",
        fill: "steelblue",
        fillOpacity: 0.2
      }
    ),
    // 50% confidence interval
    Plot.areaY(
      percentiles,
      {
        x: "day",
        y1: "p25",
        y2: "p75",
        fill: "steelblue",
        fillOpacity: 0.3
      }
    ),
    // Median line
    Plot.line(
      percentiles,
      {
        x: "day",
        y: "p50",
        stroke: "darkblue",
        strokeWidth: 2
      }
    )
  ]
})
```

### 4. Scenario Comparison (Grouped Histograms)

Compare distributions across scenarios:

```javascript
Plot.plot({
  marginLeft: 60,
  y: {
    grid: true,
    label: "Frequency"
  },
  x: {
    label: "Final Value"
  },
  color: {
    legend: true,
    domain: ["Bull Market", "Base Case", "Bear Market"],
    range: ["green", "blue", "red"]
  },
  marks: [
    Plot.rectY(
      scenarios,
      Plot.binX(
        {y: "count"},
        {
          x: "finalValue",
          fill: "scenario",
          mixBlendMode: "multiply",  // Overlapping transparency
          thresholds: 30
        }
      )
    )
  ]
})
```

### 5. Box Plot (Statistical Summary)

Show quartiles and outliers:

```javascript
Plot.plot({
  marginLeft: 80,
  x: {
    label: "Scenario"
  },
  y: {
    grid: true,
    label: "Final Value"
  },
  marks: [
    Plot.boxY(
      data,
      {
        x: "scenario",
        y: "finalValue",
        fill: "scenario"
      }
    )
  ]
})
```

### 6. Cumulative Distribution Function (CDF)

Show probability of outcomes:

```javascript
// Prepare CDF data
const sorted = data.map(d => d.finalValue).sort((a, b) => a - b);
const cdfData = sorted.map((value, i) => ({
  value,
  probability: (i + 1) / sorted.length
}));

Plot.plot({
  y: {
    grid: true,
    label: "Cumulative Probability",
    domain: [0, 1]
  },
  x: {
    label: "Final Value"
  },
  marks: [
    Plot.line(cdfData, {x: "value", y: "probability"}),
    Plot.ruleY([0.5], {stroke: "red", strokeDasharray: "4"})  // Median line
  ]
})
```

### 7. Heatmap (2D Distribution)

Show joint distribution of two variables:

```javascript
Plot.plot({
  marginLeft: 60,
  color: {
    legend: true,
    label: "Count",
    scheme: "YlGnBu"
  },
  marks: [
    Plot.rect(
      data,
      Plot.bin(
        {fill: "count"},
        {
          x: "volatility",
          y: "finalValue",
          thresholds: 20
        }
      )
    )
  ]
})
```

### 8. Small Multiples (Facets)

Show multiple scenarios in grid:

```javascript
Plot.plot({
  height: 600,
  marginLeft: 60,
  facet: {
    data: scenarios,
    y: "scenario",
    marginRight: 90
  },
  y: {
    grid: true
  },
  marks: [
    Plot.rectY(
      scenarios,
      Plot.binX(
        {y: "count"},
        {
          x: "finalValue",
          fill: "steelblue"
        }
      )
    ),
    Plot.frame()
  ]
})
```

## Interactive Features

### Tooltips (Tips)

Add hover tooltips:

```javascript
Plot.plot({
  marks: [
    Plot.dot(data, {
      x: "day",
      y: "value",
      tip: true,  // Enable tooltips
      title: d => `Day ${d.day}\nValue: ${d.value.toFixed(2)}`
    })
  ]
})
```

### Pointer Interaction

Detect hover position:

```javascript
const pointer = Plot.pointer({
  x: "day",
  y: "value",
  px: "day",
  py: "value"
});

Plot.plot({
  marks: [
    Plot.line(data, {x: "day", y: "value"}),
    Plot.dot(data, pointer),  // Highlight nearest point
    Plot.text(data, {...pointer, text: "value"})  // Show value
  ]
})
```

### Crosshair

```javascript
Plot.plot({
  marks: [
    Plot.line(data, {x: "day", y: "value"}),
    Plot.crosshair(data, {x: "day", y: "value"})
  ]
})
```

## Styling & Customization

### Colors

```javascript
// Single color
fill: "steelblue"

// Color scale
fill: "scenario"
color: {
  domain: ["Bull", "Base", "Bear"],
  range: ["green", "blue", "red"]
}

// Color scheme
color: {scheme: "YlGnBu"}  // Built-in schemes
```

### Axes & Grids

```javascript
Plot.plot({
  x: {
    label: "Day",
    domain: [0, 252],
    grid: true
  },
  y: {
    label: "Portfolio Value ($)",
    tickFormat: "$.2f",  // Format as currency
    grid: true,
    nice: true  // Round to nice numbers
  }
})
```

### Margins

```javascript
Plot.plot({
  marginTop: 20,
  marginRight: 30,
  marginBottom: 40,
  marginLeft: 60,
  width: 800,
  height: 400
})
```

## Best Practices for Monte Carlo

### 1. Show Distribution AND Summary Statistics

```javascript
const stats = {
  mean: d3.mean(data, d => d.finalValue),
  median: d3.median(data, d => d.finalValue),
  p5: d3.quantile(data.map(d => d.finalValue).sort((a,b) => a-b), 0.05),
  p95: d3.quantile(data.map(d => d.finalValue).sort((a,b) => a-b), 0.95)
};

Plot.plot({
  marks: [
    Plot.rectY(data, Plot.binX({y: "count"}, {x: "finalValue"})),
    Plot.ruleX([stats.mean], {stroke: "red", strokeWidth: 2}),
    Plot.ruleX([stats.p5, stats.p95], {stroke: "orange", strokeDasharray: "4"})
  ]
})
```

### 2. Use Transparency for Overlapping Paths

```javascript
strokeOpacity: 0.1,
mixBlendMode: "multiply"
```

### 3. Limit Number of Paths Shown

Too many lines = visual clutter. Show 50-100 paths max:

```javascript
const samplePaths = simulations.filter(s => s.simulationId < 100);

Plot.line(samplePaths, {...})
```

### 4. Add Reference Lines

```javascript
Plot.ruleY([0]),                    // Zero line
Plot.ruleX([initialValue]),         // Starting value
Plot.ruleY([targetReturn])          // Target/benchmark
```

### 5. Format Numbers Properly

```javascript
y: {
  tickFormat: "$.2f",  // Currency: $123.45
  label: "Value ($)"
}

// Or custom:
y: {
  tickFormat: d => `$${(d/1000).toFixed(1)}K`  // $12.3K
}
```

## Common Plot Patterns

### Reusable Options

```javascript
const commonOptions = {
  width: 800,
  height: 400,
  marginLeft: 60,
  y: {grid: true},
  color: {legend: true}
};

Plot.plot({
  ...commonOptions,
  marks: [...]
})
```

### Responsive Width

```javascript
Plot.plot({
  width: Math.min(800, window.innerWidth - 40),
  ...
})
```

## Sources

- [Observable Plot](https://observablehq.com/plot/)
- [Building 5 essential charts with Observable Plot](https://observablehq.com/blog/essential-charts-code-snippet-observable-plot)
- [The powerful simplicity of bar charts and histograms](https://observablehq.com/blog/simplicity-bar-charts)
- [Eight underused options to customize charts in Observable Plot](https://observablehq.com/blog/underused-options-observable-plot)
- [Marks | Plot](https://observablehq.com/plot/features/marks)
- [Interactive display of simulation results with Observable.js](https://jepusto.com/posts/Displaying-simulation-results/)
