# Monte Carlo Project Structure for Observable Framework

## Recommended Project Structure

```
montecarlo/
├─ src/
│  ├─ index.md                     # Dashboard home page
│  ├─ simulation.md                # Single simulation view
│  ├─ comparison.md                # Scenario comparison
│  ├─ methodology.md               # Explanation page
│  │
│  ├─ data/
│  │  ├─ simulation-base.json.py   # Base case simulation
│  │  ├─ simulation-bull.json.py   # Bull market scenario
│  │  ├─ simulation-bear.json.py   # Bear market scenario
│  │  ├─ statistics.json.js        # Aggregated statistics
│  │  └─ historical.csv.py         # Historical data
│  │
│  ├─ components/
│  │  ├─ monte-carlo.js            # Simulation logic
│  │  ├─ statistics.js             # Statistical functions
│  │  ├─ charts.js                 # Reusable chart configs
│  │  └─ formatters.js             # Number/date formatters
│  │
│  └─ lib/
│     ├─ simulation/
│     │  ├─ gbm.py                 # Geometric Brownian Motion
│     │  ├─ var.py                 # Value at Risk
│     │  └─ scenarios.py           # Scenario definitions
│     └─ utils/
│        ├─ stats.py               # Statistical utilities
│        └─ data_processing.py     # Data transformation
│
├─ .gitignore
├─ observablehq.config.js
├─ package.json
└─ README.md
```

## Configuration File

`observablehq.config.js`:

```javascript
export default {
  title: "Monte Carlo Simulation Dashboard",

  pages: [
    {name: "Dashboard", path: "/"},
    {name: "Single Simulation", path: "/simulation"},
    {name: "Scenario Comparison", path: "/comparison"},
    {name: "Methodology", path: "/methodology"}
  ],

  // Optional: custom header
  header: `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <h1>Monte Carlo Analysis</h1>
      <span style="color: var(--theme-foreground-muted);">Financial Modeling</span>
    </div>
  `,

  // Optional: custom footer
  footer: "Built with Observable Framework",

  // Base path if deploying to subdirectory
  base: "/montecarlo",

  // Source root
  root: "src"
};
```

## Data Loaders

### Base Simulation (Python)

`src/data/simulation-base.json.py`:

```python
#!/usr/bin/env python3
import json
import numpy as np
from datetime import datetime, timedelta

def geometric_brownian_motion(
    S0=100,
    mu=0.08,
    sigma=0.2,
    T=1,
    steps=252,
    simulations=1000
):
    """
    Run Monte Carlo simulation using Geometric Brownian Motion

    S0: Initial value
    mu: Drift (expected return)
    sigma: Volatility
    T: Time horizon (years)
    steps: Number of time steps
    simulations: Number of paths
    """
    dt = T / steps
    results = []

    for sim in range(simulations):
        path = [S0]
        for t in range(1, steps + 1):
            z = np.random.standard_normal()
            St = path[-1] * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)
            path.append(St)

        results.append({
            "simulation_id": sim,
            "path": path,
            "final_value": path[-1],
            "max_value": max(path),
            "min_value": min(path)
        })

    # Calculate percentiles over time
    all_paths = np.array([r["path"] for r in results])
    percentiles = []
    for t in range(steps + 1):
        values = all_paths[:, t]
        percentiles.append({
            "day": t,
            "p5": float(np.percentile(values, 5)),
            "p25": float(np.percentile(values, 25)),
            "p50": float(np.percentile(values, 50)),
            "p75": float(np.percentile(values, 75)),
            "p95": float(np.percentile(values, 95)),
            "mean": float(np.mean(values))
        })

    output = {
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "parameters": {
                "initial_value": S0,
                "drift": mu,
                "volatility": sigma,
                "time_horizon": T,
                "steps": steps,
                "simulations": simulations
            }
        },
        "simulations": results,
        "percentiles": percentiles,
        "statistics": {
            "mean_final": float(np.mean([r["final_value"] for r in results])),
            "std_final": float(np.std([r["final_value"] for r in results])),
            "min_final": float(min([r["final_value"] for r in results])),
            "max_final": float(max([r["final_value"] for r in results]))
        }
    }

    print(json.dumps(output))

if __name__ == "__main__":
    geometric_brownian_motion()
```

### Statistics Aggregation (JavaScript)

`src/data/statistics.json.js`:

```javascript
import * as d3 from "d3";

// Load simulation results
const base = await fetch("./simulation-base.json").then(r => r.json());
const bull = await fetch("./simulation-bull.json").then(r => r.json());
const bear = await fetch("./simulation-bear.json").then(r => r.json());

function calculateStats(data, scenario) {
  const finalValues = data.simulations.map(s => s.final_value);
  finalValues.sort((a, b) => a - b);

  return {
    scenario,
    mean: d3.mean(finalValues),
    median: d3.median(finalValues),
    std: d3.deviation(finalValues),
    min: d3.min(finalValues),
    max: d3.max(finalValues),
    p5: d3.quantile(finalValues, 0.05),
    p95: d3.quantile(finalValues, 0.95),
    var_95: d3.quantile(finalValues, 0.05) - 100,  // Value at Risk
    cvar_95: d3.mean(finalValues.filter(v => v <= d3.quantile(finalValues, 0.05)))
  };
}

const stats = [
  calculateStats(base, "Base Case"),
  calculateStats(bull, "Bull Market"),
  calculateStats(bear, "Bear Market")
];

process.stdout.write(JSON.stringify(stats));
```

## Components

### Simulation Logic

`src/components/monte-carlo.js`:

```javascript
export function runSimulation({
  initialValue = 100,
  drift = 0.08,
  volatility = 0.2,
  days = 252,
  simulations = 1000
}) {
  const dt = 1 / days;
  const results = [];

  for (let sim = 0; sim < simulations; sim++) {
    const path = [initialValue];

    for (let day = 1; day <= days; day++) {
      const z = normalRandom();
      const St = path[path.length - 1] * Math.exp(
        (drift - 0.5 * volatility ** 2) * dt +
        volatility * Math.sqrt(dt) * z
      );
      path.push(St);
    }

    results.push({
      simulation_id: sim,
      path,
      final_value: path[path.length - 1]
    });
  }

  return results;
}

function normalRandom() {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
```

### Chart Configurations

`src/components/charts.js`:

```javascript
import * as Plot from "@observablehq/plot";

export function distributionChart(data, options = {}) {
  return Plot.plot({
    width: options.width || 800,
    height: options.height || 400,
    marginLeft: 60,
    y: {grid: true, label: "Frequency"},
    x: {label: "Final Value"},
    marks: [
      Plot.rectY(
        data,
        Plot.binX({y: "count"}, {
          x: "final_value",
          fill: options.fill || "steelblue",
          thresholds: options.bins || 50
        })
      ),
      Plot.ruleY([0])
    ]
  });
}

export function pathsChart(simulations, {maxPaths = 100, showMean = true} = {}) {
  // Flatten paths for plotting
  const paths = simulations.slice(0, maxPaths).flatMap(sim =>
    sim.path.map((value, day) => ({
      simulation_id: sim.simulation_id,
      day,
      value
    }))
  );

  const marks = [
    Plot.line(paths, {
      x: "day",
      y: "value",
      z: "simulation_id",
      stroke: "#ccc",
      strokeOpacity: 0.2
    })
  ];

  if (showMean) {
    // Calculate mean path
    const meanPath = Array.from({length: simulations[0].path.length}, (_, day) => ({
      day,
      value: simulations.reduce((sum, sim) => sum + sim.path[day], 0) / simulations.length
    }));

    marks.push(
      Plot.line(meanPath, {
        x: "day",
        y: "value",
        stroke: "red",
        strokeWidth: 2
      })
    );
  }

  return Plot.plot({
    width: 800,
    height: 400,
    y: {grid: true, label: "Value"},
    x: {label: "Day"},
    marks
  });
}
```

## Dashboard Page

`src/index.md`:

````markdown
---
title: Monte Carlo Simulation Dashboard
---

# Monte Carlo Simulation Dashboard

\`\`\`js
const data = FileAttachment("data/simulation-base.json").json();
\`\`\`

\`\`\`js
import {distributionChart, pathsChart} from "./components/charts.js";
\`\`\`

## Parameters

:::grid{.grid-cols-2}
::: {.card}
**Initial Value:** ${data.metadata.parameters.initial_value}

**Drift (μ):** ${data.metadata.parameters.drift}

**Volatility (σ):** ${data.metadata.parameters.volatility}

**Time Horizon:** ${data.metadata.parameters.time_horizon} year

**Simulations:** ${data.metadata.parameters.simulations.toLocaleString()}
:::

::: {.card}
**Mean Final Value:** $${data.statistics.mean_final.toFixed(2)}

**Std Dev:** $${data.statistics.std_final.toFixed(2)}

**Range:** $${data.statistics.min_final.toFixed(2)} - $${data.statistics.max_final.toFixed(2)}
:::
:::

## Distribution of Outcomes

\`\`\`js
distributionChart(data.simulations)
\`\`\`

## Simulation Paths

\`\`\`js
pathsChart(data.simulations, {maxPaths: 50})
\`\`\`

## Confidence Intervals

\`\`\`js
Plot.plot({
  width: 800,
  height: 400,
  y: {grid: true, label: "Value"},
  x: {label: "Day"},
  marks: [
    Plot.areaY(data.percentiles, {
      x: "day",
      y1: "p5",
      y2: "p95",
      fill: "steelblue",
      fillOpacity: 0.2
    }),
    Plot.areaY(data.percentiles, {
      x: "day",
      y1: "p25",
      y2: "p75",
      fill: "steelblue",
      fillOpacity: 0.3
    }),
    Plot.line(data.percentiles, {
      x: "day",
      y: "p50",
      stroke: "darkblue",
      strokeWidth: 2
    })
  ]
})
\`\`\`
````

## .gitignore

```gitignore
node_modules/
.observablehq/
dist/
.DS_Store
*.pyc
__pycache__/
.venv/
venv/
```

## package.json

```json
{
  "name": "montecarlo-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "observable build",
    "build": "observable build"
  },
  "devDependencies": {
    "@observablehq/framework": "latest"
  },
  "dependencies": {
    "d3": "^7.9.0"
  }
}
```

## Sources

- [Project structure | Observable Framework](https://observablehq.com/framework/project-structure)
- [Configuration | Observable Framework](https://observablehq.com/framework/config)
- [Getting started | Observable Framework](https://observablehq.com/framework/getting-started)
