import * as d3 from "d3";
import {readFileSync} from "fs";
import {fileURLToPath} from "url";
import {dirname, join} from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read the CSV file from the montecarlo directory
const csvPath = join(__dirname, "../../../plot_data.csv");
const csvContent = readFileSync(csvPath, "utf-8");

// Parse CSV, skipping comment lines
const lines = csvContent.split('\n').filter(line => !line.startsWith('#'));
const data = d3.csvParse(lines.join('\n'));

// Convert values to numbers
data.forEach(d => {
  d.value = +d.value;
});

// Group by date and KPI, then calculate percentiles
const grouped = d3.group(data, d => d.date, d => d.kpi);

const percentileData = [];

for (const [date, kpiMap] of grouped) {
  for (const [kpi, values] of kpiMap) {
    // Filter out special scenarios (base, best, worst)
    const simValues = values
      .filter(d => d.scenario.startsWith('Sim_'))
      .map(d => d.value)
      .sort(d3.ascending);

    if (simValues.length > 0) {
      const baseValue = values.find(d => d.scenario === 'base')?.value;
      const bestValue = values.find(d => d.scenario === 'best')?.value;
      const worstValue = values.find(d => d.scenario === 'worst')?.value;

      percentileData.push({
        date,
        kpi,
        base: baseValue,
        best: bestValue,
        worst: worstValue,
        p01: d3.quantile(simValues, 0.01),
        p05: d3.quantile(simValues, 0.05),
        p10: d3.quantile(simValues, 0.10),
        p25: d3.quantile(simValues, 0.25),
        p50: d3.quantile(simValues, 0.50),
        p75: d3.quantile(simValues, 0.75),
        p90: d3.quantile(simValues, 0.90),
        p95: d3.quantile(simValues, 0.95),
        p99: d3.quantile(simValues, 0.99),
        min: d3.min(simValues),
        max: d3.max(simValues),
        mean: d3.mean(simValues),
        count: simValues.length
      });
    }
  }
}

// Sort by date and KPI
percentileData.sort((a, b) => a.date.localeCompare(b.date) || a.kpi.localeCompare(b.kpi));

process.stdout.write(JSON.stringify(percentileData, null, 2));
