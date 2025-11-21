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

// Filter simulation scenarios only
const simData = data.filter(d => d.scenario.startsWith('Sim_'));

// Calculate variance contribution for each KPI and date
const sensitivityResults = [];

// Group by KPI and date
const grouped = d3.group(simData, d => d.kpi, d => d.date);

for (const [kpi, dateMap] of grouped) {
  for (const [date, values] of dateMap) {
    // For demonstration, we'll create synthetic sensitivity data
    // In a real scenario, you would calculate Sobol indices based on actual input parameters

    // Get all unique scenarios
    const scenarios = [...new Set(values.map(d => d.scenario))];
    const numScenarios = scenarios.length;

    // Create synthetic variables representing different input parameters
    const variables = [
      'Revenue_Growth', 'Cost_of_Goods', 'Operating_Expenses',
      'Marketing_Spend', 'R&D_Investment', 'Tax_Rate',
      'Working_Capital', 'CapEx', 'Interest_Rate',
      'Customer_Acquisition', 'Churn_Rate', 'Pricing_Strategy',
      'Market_Share', 'Competition', 'Economic_Conditions'
    ];

    // Calculate output variance
    const outputValues = values.map(d => d.value);
    const outputMean = d3.mean(outputValues);
    const outputVariance = d3.variance(outputValues);

    // Generate sensitivity indices for each variable
    variables.forEach((variable, idx) => {
      // Simulate correlation and sensitivity
      // In real analysis, this would be calculated from actual input-output relationships
      const baseCorrelation = (Math.random() - 0.5) * 2;
      const sensitivity = Math.pow(baseCorrelation, 2) * 100;

      // Add some variation based on the variable importance
      const importance = 1 / (idx + 1); // Higher index = lower importance
      const adjustedSensitivity = sensitivity * importance * (Math.random() * 0.5 + 0.75);

      sensitivityResults.push({
        kpi,
        date,
        variable,
        sensitivity: adjustedSensitivity,
        correlation: baseCorrelation,
        firstOrderIndex: adjustedSensitivity / 100,
        totalOrderIndex: (adjustedSensitivity * 1.2) / 100
      });
    });
  }
}

// Sort by sensitivity descending within each KPI/date group
sensitivityResults.sort((a, b) => {
  if (a.kpi !== b.kpi) return a.kpi.localeCompare(b.kpi);
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return b.sensitivity - a.sensitivity;
});

process.stdout.write(JSON.stringify(sensitivityResults, null, 2));
