# Quick Start Guide - Monte Carlo Dashboard with Observable Framework

## Prerequisites

- **Node.js** 18+ installed
- **Python 3** installed (for data loaders)
- Basic knowledge of JavaScript and Python

## Step-by-Step Setup

### 1. Create New Project

```bash
# Create project
npm init "@observablehq" -- --template default

# Enter project name when prompted
? What would you like to name your project? montecarlo-dashboard

# Navigate to project
cd montecarlo-dashboard

# Install dependencies
npm install
```

### 2. Project Structure

Your project now looks like:
```
montecarlo-dashboard/
├─ src/
│  └─ index.md
├─ observablehq.config.js
├─ package.json
└─ README.md
```

### 3. Install Python Dependencies

Create `requirements.txt`:
```
numpy>=1.24.0
scipy>=1.10.0
pandas>=2.0.0
```

Install:
```bash
pip install -r requirements.txt
```

### 4. Create Data Loader

Create `src/data/simulation.json.py`:

```python
#!/usr/bin/env python3
import json
import numpy as np

# Simple Monte Carlo simulation
np.random.seed(42)
S0 = 100
mu = 0.08
sigma = 0.2
T = 1
steps = 252
sims = 1000

dt = T / steps
results = []

for i in range(sims):
    path = [S0]
    for t in range(steps):
        z = np.random.standard_normal()
        St = path[-1] * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)
        path.append(St)
    results.append({"id": i, "final": path[-1]})

print(json.dumps(results))
```

Make it executable:
```bash
chmod +x src/data/simulation.json.py
```

### 5. Create Dashboard Page

Edit `src/index.md`:

````markdown
# Monte Carlo Simulation

\`\`\`js
const data = FileAttachment("data/simulation.json").json();
\`\`\`

## Results

Total simulations: **${data.length.toLocaleString()}**

Mean final value: **$${d3.mean(data, d => d.final).toFixed(2)}**

## Distribution

\`\`\`js
Plot.plot({
  marks: [
    Plot.rectY(
      data,
      Plot.binX({y: "count"}, {x: "final", fill: "steelblue"})
    ),
    Plot.ruleY([0])
  ]
})
\`\`\`
````

### 6. Start Development Server

```bash
npm run dev
```

Open browser to http://localhost:3000

You should see your dashboard with the histogram!

### 7. Add Interactive Controls

Update `src/index.md`:

````markdown
# Interactive Monte Carlo Simulation

## Parameters

\`\`\`js
const iterations = view(Inputs.range([100, 5000], {
  label: "Simulations",
  step: 100,
  value: 1000
}));
\`\`\`

\`\`\`js
const volatility = view(Inputs.range([0.1, 0.5], {
  label: "Volatility",
  step: 0.01,
  value: 0.2
}));
\`\`\`

\`\`\`js
// Run simulation in browser
function simulate(n, vol) {
  const results = [];
  for (let i = 0; i < n; i++) {
    let value = 100;
    for (let t = 0; t < 252; t++) {
      const z = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
      value *= Math.exp((0.08 - 0.5 * vol ** 2) / 252 + vol * z / Math.sqrt(252));
    }
    results.push({final: value});
  }
  return results;
}
\`\`\`

\`\`\`js
const results = simulate(iterations, volatility);
\`\`\`

## Live Results

Running **${iterations}** simulations with **${(volatility * 100).toFixed(0)}%** volatility

Mean: **$${d3.mean(results, d => d.final).toFixed(2)}**

\`\`\`js
Plot.plot({
  marks: [
    Plot.rectY(
      results,
      Plot.binX({y: "count"}, {x: "final", fill: "steelblue"})
    )
  ]
})
\`\`\`
````

Now you have an **interactive dashboard** that updates in real-time as you adjust the sliders!

## Common Commands

```bash
# Development server (live reload)
npm run dev

# Build static site
npm run build

# Preview built site
npx serve dist

# Clean cache
rm -rf .observablehq/cache
```

## Next Steps

### Add More Pages

Create `src/methodology.md`:

````markdown
---
title: Methodology
---

# Methodology

## Geometric Brownian Motion

The simulation uses the GBM model:

$$dS_t = \mu S_t dt + \sigma S_t dW_t$$

Where:
- $S_t$ is the asset price at time $t$
- $\mu$ is the drift (expected return)
- $\sigma$ is the volatility
- $W_t$ is a Wiener process
````

Update `observablehq.config.js`:

```javascript
export default {
  title: "Monte Carlo Dashboard",
  pages: [
    {name: "Dashboard", path: "/"},
    {name: "Methodology", path: "/methodology"}
  ]
};
```

### Add More Data Loaders

Create `src/data/statistics.json.js`:

```javascript
import * as d3 from "d3";

const data = await fetch("./simulation.json").then(r => r.json());
const finals = data.map(d => d.final).sort((a, b) => a - b);

const stats = {
  mean: d3.mean(finals),
  median: d3.median(finals),
  std: d3.deviation(finals),
  p5: d3.quantile(finals, 0.05),
  p95: d3.quantile(finals, 0.95),
  min: d3.min(finals),
  max: d3.max(finals)
};

process.stdout.write(JSON.stringify(stats));
```

Use in page:

```markdown
\`\`\`js
const stats = FileAttachment("data/statistics.json").json();
\`\`\`

**95% Confidence Interval:** [${stats.p5.toFixed(2)}, ${stats.p95.toFixed(2)}]
```

### Deploy to GitHub Pages

1. Build the site:
```bash
npm run build
```

2. Deploy `dist/` folder to GitHub Pages, Netlify, Vercel, or any static host

## Troubleshooting

### Data loader not running

- Check file permissions: `chmod +x src/data/*.py`
- Verify Python in PATH: `which python3`
- Check cache: delete `.observablehq/cache/` and rebuild

### Changes not showing

- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear cache and restart dev server

### Import errors

- Install missing packages: `npm install d3`
- Check import paths are relative: `./components/file.js`

## Resources

- [Observable Framework Docs](https://observablehq.com/framework/)
- [Observable Plot](https://observablehq.com/plot/)
- [Example Projects](https://github.com/observablehq/framework/tree/main/examples)
- [Community Forum](https://talk.observablehq.com/)

## Sources

- [Getting started | Observable Framework](https://observablehq.com/framework/getting-started)
- [Data loaders | Observable Framework](https://observablehq.com/framework/data-loaders)
