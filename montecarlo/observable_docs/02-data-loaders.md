# Observable Framework - Data Loaders

## What are Data Loaders?

Data loaders are **programs that run at build time** to pre-compute static snapshots of data. They can be written in **any language** (JavaScript, Python, R, SQL, Shell, etc.).

### Key Benefits

1. **Minimize client-side data transfer** - only send processed results
2. **Push heavy computation to build time** - not page load time
3. **Multi-language support** - use the best tool for the job
4. **Cached output** - fast rebuilds during development

## How Data Loaders Work

### File-based Convention

```
src/data/forecast.json.js   →  serves  →  /data/forecast.json
src/data/sales.csv.py       →  serves  →  /data/sales.csv
src/data/metrics.parquet.r  →  serves  →  /data/metrics.parquet
```

**Rule:** `filename.{output-extension}.{loader-extension}`

### Build Process

1. **Build time**: Framework runs the data loader
2. **Output**: Loader writes to `stdout` (JSON, CSV, etc.)
3. **Cache**: Result saved to `.observablehq/cache/`
4. **Serve**: Static file served to client

### Cache Behavior

- Cache lives in `.observablehq/cache/` (add to `.gitignore`)
- Cache is "fresh" if newer than the source file's modification time
- During preview, only re-runs if source changed
- Force rebuild: delete cache or touch the source file

## Data Loader Languages

### JavaScript/TypeScript (.js, .ts)

```javascript
// montecarlo.json.js
import { runSimulation } from "./lib/simulation.js";

const results = runSimulation({
  iterations: 10000,
  scenarios: 100
});

process.stdout.write(JSON.stringify(results));
```

### Python (.py)

```python
# montecarlo.json.py
import json
import numpy as np

def monte_carlo_simulation(n_iterations=10000):
    results = []
    for i in range(n_iterations):
        outcome = np.random.normal(100, 15)
        results.append({"iteration": i, "outcome": outcome})
    return results

# Run simulation
data = monte_carlo_simulation()

# Output to stdout
print(json.dumps(data))
```

### R (.r, .R)

```r
# montecarlo.json.R
library(jsonlite)

# Run simulation
results <- replicate(10000, rnorm(1, mean=100, sd=15))

# Output JSON
cat(toJSON(data.frame(outcome = results)))
```

### SQL (.sql)

```sql
-- sales.csv.sql
SELECT
  date,
  SUM(revenue) as total_revenue,
  COUNT(*) as transaction_count
FROM sales
GROUP BY date
ORDER BY date;
```

Requires database configuration in `observablehq.config.js`.

### Shell Script (.sh)

```bash
#!/bin/bash
# latest-data.json.sh

curl -s "https://api.example.com/data" | jq '.results'
```

## Monte Carlo Data Loader Examples

### Example 1: Simple Simulation (Python)

```python
# simulation-basic.json.py
import json
import numpy as np
from datetime import datetime

def run_monte_carlo(
    initial_value=100,
    drift=0.05,
    volatility=0.2,
    days=252,
    simulations=1000
):
    results = []

    for sim in range(simulations):
        path = [initial_value]
        for day in range(1, days):
            shock = np.random.normal(drift/days, volatility/np.sqrt(days))
            next_value = path[-1] * (1 + shock)
            path.append(next_value)

        results.append({
            "simulation_id": sim,
            "final_value": path[-1],
            "path": path
        })

    return results

# Run and output
data = {
    "metadata": {
        "timestamp": datetime.now().isoformat(),
        "simulations": 1000,
        "days": 252
    },
    "results": run_monte_carlo()
}

print(json.dumps(data))
```

### Example 2: Aggregated Statistics (JavaScript)

```javascript
// simulation-stats.json.js
import { runMonteCarlo } from "./lib/monte-carlo.js";

const simulations = runMonteCarlo({ iterations: 10000 });

// Calculate statistics
const outcomes = simulations.map(s => s.finalValue);
outcomes.sort((a, b) => a - b);

const stats = {
  mean: outcomes.reduce((a, b) => a + b) / outcomes.length,
  median: outcomes[Math.floor(outcomes.length / 2)],
  p5: outcomes[Math.floor(outcomes.length * 0.05)],
  p95: outcomes[Math.floor(outcomes.length * 0.95)],
  min: outcomes[0],
  max: outcomes[outcomes.length - 1],
  percentiles: Array.from({ length: 100 }, (_, i) => ({
    percentile: i + 1,
    value: outcomes[Math.floor(outcomes.length * (i + 1) / 100)]
  }))
};

process.stdout.write(JSON.stringify(stats));
```

### Example 3: Multi-scenario Analysis (Python)

```python
# scenarios.json.py
import json
import numpy as np

scenarios = [
    {"name": "Bull Market", "drift": 0.15, "volatility": 0.15},
    {"name": "Base Case", "drift": 0.08, "volatility": 0.20},
    {"name": "Bear Market", "drift": -0.05, "volatility": 0.30}
]

results = []

for scenario in scenarios:
    outcomes = []
    for i in range(1000):
        final_value = 100 * np.exp(
            np.random.normal(scenario["drift"], scenario["volatility"])
        )
        outcomes.append(final_value)

    results.append({
        "scenario": scenario["name"],
        "mean": np.mean(outcomes),
        "std": np.std(outcomes),
        "p5": np.percentile(outcomes, 5),
        "p50": np.percentile(outcomes, 50),
        "p95": np.percentile(outcomes, 95),
        "outcomes": outcomes
    })

print(json.dumps(results))
```

## Loading Data in Pages

### Using FileAttachment

```markdown
# Monte Carlo Results

\`\`\`js
const data = FileAttachment("data/simulation-basic.json").json();
\`\`\`

\`\`\`js
// Access the data
display(data.metadata);
display(data.results.length); // 1000 simulations
\`\`\`
```

### Lazy Loading

Data loaders output is **lazy-loaded** - only fetched when accessed by a page.

### Multiple Formats

```javascript
// CSV
const csv = FileAttachment("data/results.csv").csv();

// JSON
const json = FileAttachment("data/results.json").json();

// Parquet (efficient for large datasets)
const parquet = FileAttachment("data/results.parquet").parquet();

// Arrow (columnar format)
const arrow = FileAttachment("data/results.arrow").arrow();
```

## Best Practices

### 1. Use Efficient Formats

- **JSON**: Good for small-medium datasets, human-readable
- **CSV**: Good for tabular data
- **Parquet/Arrow**: Best for large datasets (columnar, compressed)

### 2. Cache External API Calls

```python
# weather.json.py
import json
import requests
from pathlib import Path

cache_file = Path(".cache/weather-data.json")

if cache_file.exists():
    with open(cache_file) as f:
        data = json.load(f)
else:
    response = requests.get("https://api.weather.com/forecast")
    data = response.json()
    cache_file.parent.mkdir(exist_ok=True)
    with open(cache_file, 'w') as f:
        json.dump(data, f)

print(json.dumps(data))
```

### 3. Parameterized Data Loaders

Use environment variables or config:

```python
# simulation.json.py
import os
import json

iterations = int(os.getenv("MONTE_CARLO_ITERATIONS", "1000"))

results = run_simulation(iterations=iterations)
print(json.dumps(results))
```

Run with: `MONTE_CARLO_ITERATIONS=10000 npm run build`

### 4. Error Handling

```python
# robust-loader.json.py
import json
import sys

try:
    data = perform_expensive_computation()
    print(json.dumps(data))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)
```

## Live Preview

During `npm run dev`, data loaders automatically re-run when:
- The source file changes
- Dependencies (imported modules) change

Framework watches for changes and invalidates the cache.

## Sources

- [Data loaders | Observable Framework](https://observablehq.com/framework/data-loaders)
- [Data loaders for the win | Observable Blog](https://observablehq.com/blog/data-loaders-for-the-win)
- [Data loader examples | GitHub](https://github.com/observablehq/data-loader-examples)
