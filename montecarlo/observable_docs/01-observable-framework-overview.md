# Observable Framework - Overview

**Last Updated:** December 2025
**Official Site:** https://observablehq.com/framework/

## What is Observable Framework?

Observable Framework is a **static site generator** for creating fast, interactive data dashboards and data apps. It takes a mixture of **Markdown and JavaScript** and compiles them into blazing-fast loading interactive pages.

### Key Characteristics

- **Static Site Generator**: Pre-builds everything at build time
- **Multi-language Data Loaders**: Write data processing in JavaScript, Python, R, SQL, or any language
- **Reactive JavaScript**: Spreadsheet-like reactivity built into the runtime
- **File-based Routing**: File names determine URLs
- **Build-time Data Processing**: Heavy computation happens during build, not on page load

### Why Use It for Monte Carlo Data?

1. **Pre-compute simulations** in data loaders (Python/JS)
2. **Fast page loads** - data is pre-processed at build time
3. **Interactive visualizations** using Observable Plot
4. **Reactive updates** - charts update automatically when inputs change
5. **Multi-page dashboards** with file-based routing

## Architecture

```
┌─────────────────────────────────────────┐
│   Build Time (Data Loaders)            │
│   • Run simulations (Python/R/JS)      │
│   • Process large datasets              │
│   • Generate JSON/CSV snapshots         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Static HTML + JavaScript              │
│   • Markdown → HTML                     │
│   • Reactive JavaScript embedded        │
│   • Optimized assets                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Client (Browser)                      │
│   • Fast page loads                     │
│   • Interactive charts (Plot)           │
│   • Reactive updates                    │
└─────────────────────────────────────────┘
```

## Core Concepts

### 1. Data Loaders

**Purpose:** Pre-process data at build time to minimize client-side computation

**Example for Monte Carlo:**
```python
# montecarlo-results.json.py
import json
import numpy as np

# Run simulation
results = run_monte_carlo_simulation(iterations=10000)

# Output JSON to stdout
print(json.dumps(results))
```

### 2. Reactive Markdown

**Purpose:** Embed interactive JavaScript directly in Markdown

**Example:**
```markdown
# Monte Carlo Results

\`\`\`js
const data = FileAttachment("montecarlo-results.json").json();
\`\`\`

\`\`\`js
Plot.plot({
  marks: [
    Plot.histogram(data, {x: "outcome"})
  ]
})
\`\`\`

The mean outcome is ${d3.mean(data, d => d.outcome).toFixed(2)}
```

### 3. Observable Runtime

**Purpose:** Runs JavaScript reactively (like a spreadsheet)

- Variables auto-update when dependencies change
- Topological execution order
- Implicit await of promises
- Live data transformations

## Quick Start

### Installation

```bash
npm init "@observablehq" -- --template default
cd your-project-name
npm run dev
```

### Project Structure

```
.
├─ src/                         # Source root
│  ├─ index.md                  # Home page
│  ├─ data/
│  │  └─ simulation.json.py     # Data loader (Python)
│  └─ components/
│     └─ chart.js               # Reusable component
├─ observablehq.config.js       # Configuration
└─ package.json
```

## Sources

- [Getting started | Observable Framework](https://observablehq.com/framework/getting-started)
- [Data loaders | Observable Framework](https://observablehq.com/framework/data-loaders)
- [Project structure | Observable Framework](https://observablehq.com/framework/project-structure)
- [Reactivity | Observable Framework](https://observablehq.com/framework/reactivity)
