# Observable Framework Documentation for Monte Carlo Projects

This directory contains comprehensive documentation for building Monte Carlo simulation dashboards using Observable Framework.

## 🚀 START HERE - Your Project Workflow

### **[00-ACTUAL-PROJECT-WORKFLOW.md](./00-ACTUAL-PROJECT-WORKFLOW.md)** ⭐
**READ THIS FIRST!** Describes YOUR actual Monte Carlo workflow:
- Excel input template → Python generator → plot_data.csv → Observable
- SOBOL quasi-random sampling
- Discrete distributions with grouped variables
- CSV output format with base/best/worst scenarios

## Your Specific Documentation

### 7. [plot_data.csv Format](./07-plot-data-csv-format.md)
**Your output format** - Complete specification:
- CSV structure (scenario, date, kpi, value)
- Comment rows for metadata
- Special scenarios (base, best, worst)
- Simulation scenarios (Sim_XXXXX)
- Parsing examples in JavaScript and Python

### 8. [Observable Data Loader Example](./08-observable-data-loader-example.md)
**Ready-to-use code** for loading your plot_data.csv:
- Data loader that pre-computes percentiles
- Fan chart visualization
- Interactive KPI selector
- Performance optimization tips

## General Observable Framework Documentation

### 1. [Observable Framework Overview](./01-observable-framework-overview.md)
- What is Observable Framework
- Architecture and core concepts
- Why use it for Monte Carlo data
- Quick start overview

### 2. [Data Loaders](./02-data-loaders.md)
- How data loaders work
- Multi-language support (Python, JavaScript, R, SQL)
- Caching and performance
- **Note:** Generic examples - see #8 for your specific implementation

### 3. [Markdown & Reactivity](./03-markdown-and-reactivity.md)
- Reactive JavaScript in markdown
- Spreadsheet-like execution model
- Observable Inputs for interactivity
- Grid layouts and cards
- Best practices for reactive code

### 4. [Observable Plot Visualization](./04-observable-plot-visualization.md)
- Plot basics and marks
- Fan charts, histograms, line charts
- Interactive features (tooltips, crosshairs)
- Styling and customization

### 5. [Monte Carlo Project Structure](./05-monte-carlo-project-structure.md)
- Recommended file organization
- Configuration setup
- **Note:** Generic structure - adapt for your workflow

### 6. [Quick Start Guide](./06-quick-start-guide.md)
- Step-by-step tutorial
- Creating your first Observable dashboard
- Common commands
- Troubleshooting

## Quick Reference

### Create New Project

```bash
npm init "@observablehq"
cd your-project
npm run dev
```

### Data Loader Pattern

```
src/data/filename.{output-ext}.{loader-ext}
```

Examples:
- `simulation.json.py` → `/data/simulation.json`
- `stats.csv.js` → `/data/stats.csv`
- `results.parquet.r` → `/data/results.parquet`

### Load Data in Page

```javascript
const data = FileAttachment("data/simulation.json").json();
```

### Create Interactive Input

```javascript
const value = view(Inputs.range([0, 100], {label: "Value"}));
```

### Create Chart

```javascript
Plot.plot({
  marks: [
    Plot.rectY(data, Plot.binX({y: "count"}, {x: "value"}))
  ]
})
```

## Example Monte Carlo Workflow

1. **Data Loader** (`src/data/simulation.json.py`):
   - Run Monte Carlo simulation in Python
   - Output JSON to stdout
   - Framework caches result

2. **Dashboard Page** (`src/index.md`):
   - Load data with `FileAttachment()`
   - Add interactive controls with `Inputs`
   - Create visualizations with `Plot`
   - Add reactive calculations

3. **Components** (`src/components/`):
   - Reusable chart configurations
   - Shared statistical functions
   - Custom formatters

## Key Concepts

### Reactivity
Variables automatically update when dependencies change - like a spreadsheet.

### Data Loaders
Programs that run at **build time** to pre-compute data, minimizing client-side work.

### Observable Plot
Declarative charting library with composable marks and automatic scaling.

### File-based Routing
File structure determines URL structure:
- `src/index.md` → `/`
- `src/simulation.md` → `/simulation`

## Common Patterns

### Monte Carlo Histogram

```javascript
Plot.plot({
  marks: [
    Plot.rectY(
      simulations,
      Plot.binX({y: "count"}, {x: "finalValue", fill: "steelblue"})
    )
  ]
})
```

### Confidence Intervals

```javascript
Plot.plot({
  marks: [
    Plot.areaY(percentiles, {x: "day", y1: "p5", y2: "p95", fillOpacity: 0.2}),
    Plot.line(percentiles, {x: "day", y: "p50", stroke: "red"})
  ]
})
```

### Interactive Parameters

```javascript
const volatility = view(Inputs.range([0.1, 0.5], {
  label: "Volatility",
  step: 0.01,
  value: 0.2
}));

// Chart automatically updates when volatility changes
```

## Resources

### Official Documentation
- **Framework:** https://observablehq.com/framework/
- **Plot:** https://observablehq.com/plot/
- **Examples:** https://github.com/observablehq/framework/tree/main/examples

### Community
- **Forum:** https://talk.observablehq.com/
- **GitHub:** https://github.com/observablehq/framework

### Learning
- [Getting Started Tutorial](https://observablehq.com/framework/getting-started)
- [Data Loaders Guide](https://observablehq.com/framework/data-loaders)
- [Plot Examples](https://observablehq.com/plot/)

## Tips for Monte Carlo Dashboards

1. **Pre-compute in data loaders** - Run simulations in Python/R during build
2. **Aggregate before visualizing** - Don't show 10,000 paths, show percentiles
3. **Use efficient formats** - Parquet/Arrow for large datasets
4. **Add interactivity** - Let users explore different scenarios
5. **Show distributions AND statistics** - Combine charts with summary numbers
6. **Use transparency** - When showing multiple overlapping paths
7. **Add reference lines** - Starting value, targets, benchmarks

## Next Steps

1. Read [Quick Start Guide](./06-quick-start-guide.md) for hands-on tutorial
2. Review [Monte Carlo Project Structure](./05-monte-carlo-project-structure.md) for organization
3. Explore [Observable Plot Visualization](./04-observable-plot-visualization.md) for chart examples
4. Study [Data Loaders](./02-data-loaders.md) for simulation patterns

---

**Documentation compiled:** December 2025

**Observable Framework Version:** Latest (1.x)

**For:** Monte Carlo simulation dashboards and financial modeling projects
