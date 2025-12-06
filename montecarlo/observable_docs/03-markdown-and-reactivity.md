# Observable Framework - Markdown & Reactivity

## Markdown in Framework

Observable Framework extends **CommonMark** (standard Markdown) with features for interactive data apps.

### Extended Features

1. **Reactive JavaScript** (code blocks and inline expressions)
2. **HTML** (full HTML support)
3. **YAML front matter** (page metadata)
4. **Grids & Cards** (layout components)
5. **Notes** (callouts, tips, warnings)

## Reactive JavaScript

### The Spreadsheet Model

Framework uses **topological execution order** like a spreadsheet:
- Variables run in dependency order, not sequential order
- When a variable changes, dependents automatically re-run
- Implicit await of promises

### Code Blocks

````markdown
\`\`\`js
const data = FileAttachment("data/montecarlo.json").json();
\`\`\`

\`\`\`js
const mean = d3.mean(data, d => d.outcome);
\`\`\`

\`\`\`js
const chart = Plot.plot({
  marks: [
    Plot.histogram(data, {x: "outcome"})
  ]
});
\`\`\`
````

**Key Points:**
- Each block declares a **top-level variable**
- Variables are **reactive** - auto-update when dependencies change
- Code blocks can run **multiple times** (on user interaction, streaming data, etc.)

### Inline Expressions

```markdown
The simulation mean is ${mean.toFixed(2)}

Total simulations: ${data.length}

Range: ${d3.min(data, d => d.outcome)} to ${d3.max(data, d => d.outcome)}
```

Inline expressions use **template literal syntax** `${...}`

## Reactivity Examples

### Example 1: Interactive Parameter

````markdown
\`\`\`js
const iterations = view(Inputs.range([100, 10000], {
  label: "Iterations",
  step: 100,
  value: 1000
}));
\`\`\`

\`\`\`js
// This re-runs automatically when iterations changes!
const results = Array.from({length: iterations}, () => ({
  outcome: Math.random() * 100
}));
\`\`\`

\`\`\`js
Plot.plot({
  marks: [
    Plot.histogram(results, {x: "outcome"})
  ]
})
\`\`\`

Running ${iterations} iterations, mean = ${d3.mean(results, d => d.outcome).toFixed(2)}
````

### Example 2: Multiple Dependencies

````markdown
\`\`\`js
const drift = view(Inputs.range([-0.1, 0.2], {
  label: "Drift",
  step: 0.01,
  value: 0.05
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
// Re-runs when EITHER drift OR volatility changes
const simulation = runMonteCarlo({drift, volatility});
\`\`\`

\`\`\`js
Plot.plot({
  y: {grid: true},
  marks: [
    Plot.line(simulation, {x: "day", y: "value"})
  ]
})
\`\`\`

Parameters: drift=${drift}, volatility=${volatility}
````

### Example 3: Async Data

````markdown
\`\`\`js
// Implicit await - no need for .then()
const data = FileAttachment("data/simulation.json").json();
\`\`\`

\`\`\`js
// This waits for data to load before running
const stats = {
  mean: d3.mean(data, d => d.outcome),
  median: d3.median(data, d => d.outcome)
};
\`\`\`

Data loaded: ${data.length} records
````

## Observable Inputs

Built-in interactive controls for user input.

### Common Inputs

```javascript
// Range slider
const value = view(Inputs.range([0, 100], {label: "Value", step: 1}));

// Text input
const name = view(Inputs.text({label: "Name", placeholder: "Enter name"}));

// Select dropdown
const scenario = view(Inputs.select(["Bull", "Base", "Bear"], {label: "Scenario"}));

// Radio buttons
const choice = view(Inputs.radio(["A", "B", "C"], {label: "Choice"}));

// Checkbox
const enabled = view(Inputs.toggle({label: "Enable feature"}));

// Date picker
const date = view(Inputs.date({label: "Date"}));

// Table with selection
const selectedRows = view(Inputs.table(data, {required: false}));
```

### View Function

The `view()` function:
1. Renders the input
2. Returns its current value as a **reactive variable**
3. Updates automatically when user interacts

## Grid Layouts

### Two-column Grid

````markdown
:::grid
::: {.card}
## Left Column
Content here
:::

::: {.card}
## Right Column
More content
:::
:::
````

### Three-column Grid

````markdown
:::grid{.grid-cols-3}
::: {.card}
Column 1
:::
::: {.card}
Column 2
:::
::: {.card}
Column 3
:::
:::
````

### Dashboard Layout for Monte Carlo

````markdown
# Monte Carlo Dashboard

:::grid
::: {.card}
## Parameters
\`\`\`js
const iterations = view(Inputs.range([100, 10000], {label: "Iterations"}));
const volatility = view(Inputs.range([0.1, 0.5], {label: "Volatility"}));
\`\`\`
:::

::: {.card}
## Statistics
Mean: ${stats.mean}
Std Dev: ${stats.std}
95% CI: [${stats.p5}, ${stats.p95}]
:::
:::

:::grid
::: {.card}
## Distribution
\`\`\`js
Plot.plot({...})
\`\`\`
:::

::: {.card}
## Time Series
\`\`\`js
Plot.plot({...})
\`\`\`
:::
:::
````

## Cards & Notes

### Card

```markdown
::: {.card}
## Card Title

Card content with markdown support.
:::
```

### Note (Callout)

```markdown
::: {.note}
**Tip:** This is a helpful note.
:::
```

### Warning

```markdown
::: {.warning}
**Warning:** Be careful with this parameter!
:::
```

## Front Matter (YAML)

Add metadata to pages:

```markdown
---
title: Monte Carlo Simulation
description: Interactive Monte Carlo analysis dashboard
author: Your Name
keywords: monte carlo, simulation, finance
---

# Monte Carlo Simulation

Page content...
```

## Importing Modules

### JavaScript Modules

```markdown
\`\`\`js
import {runSimulation} from "./components/simulation.js";
\`\`\`

\`\`\`js
const results = runSimulation({iterations: 1000});
\`\`\`
```

### npm Packages

Install with npm:
```bash
npm install lodash
```

Use in markdown:
```markdown
\`\`\`js
import _ from "lodash";
\`\`\`

\`\`\`js
const grouped = _.groupBy(data, "category");
\`\`\`
```

## Display Function

Show values in the output:

```javascript
display(data);           // Pretty-print object/array
display(chart);          // Render chart/HTML
display(table);          // Render table
display(value);          // Show primitive value
```

## Mutable State

Use `Mutable` for state that changes imperatively:

```javascript
const count = Mutable(0);

// Read
count.value  // 0

// Write (triggers reactivity)
count.value = 1;

// In button
Inputs.button("Increment", {
  reduce: () => count.value++
})
```

## Best Practices

### 1. One Variable per Block

Good:
````markdown
\`\`\`js
const data = FileAttachment("data.json").json();
\`\`\`

\`\`\`js
const mean = d3.mean(data, d => d.value);
\`\`\`
````

Bad:
````markdown
\`\`\`js
const data = FileAttachment("data.json").json();
const mean = d3.mean(data, d => d.value); // Won't work - data not loaded yet!
\`\`\`
````

### 2. Keep Blocks Pure

Avoid side effects in reactive blocks - they may run multiple times:

Good:
```javascript
const processedData = data.map(d => ({...d, normalized: d.value / max}));
```

Bad:
```javascript
let count = 0;
const processedData = data.map(d => {
  count++;  // Side effect! Will increment on every re-run
  return {...d, id: count};
});
```

### 3. Use Inputs for Interactivity

Don't use raw HTML inputs - use Observable Inputs for automatic reactivity.

## Sources

- [Markdown | Observable Framework](https://observablehq.com/framework/markdown)
- [Reactivity | Observable Framework](https://observablehq.com/framework/reactivity)
- [JavaScript | Observable Framework](https://observablehq.com/framework/javascript)
