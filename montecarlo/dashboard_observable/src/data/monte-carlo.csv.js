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

// Output the processed data as CSV
process.stdout.write(d3.csvFormat(data));
