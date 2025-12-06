import csv
import argparse
from random import uniform

# Parse command-line arguments
parser = argparse.ArgumentParser(description='Generate plot data CSV file')
parser.add_argument('--scenarios', type=int, default=50, 
                    help='Number of scenarios to generate (default: 50)')
parser.add_argument('--years', type=int, nargs='+', default=[2025, 2026, 2027, 2028],
                    help='Years to include (default: 2025 2026 2027 2028)')
args = parser.parse_args()

scenarios = args.scenarios
years = args.years
kpis = ["revenue", "ebitda", "net_income"]

with open("plot_data.csv", "w", encoding="utf-8", newline='') as f:
    # Write comment rows
    f.write("# company: ACME S.p.A.\n")
    f.write("# currency: EUR\n")
    
    # Create CSV writer and write header
    writer = csv.writer(f)
    writer.writerow(["scenario", "date", "kpi", "value"])
    
    # Write data rows
    for s in range(1, scenarios + 1):
        # First 3 scenarios have special names
        if s == 1:
            scenario = "base"
        elif s == 2:
            scenario = "best"
        elif s == 3:
            scenario = "worst"
        else:
            scenario = f"Sim_{s:05d}"
        
        for y in years:
            for kpi in kpis:
                writer.writerow([
                    scenario,
                    f"{y}-12-31",
                    kpi,
                    round(uniform(80000, 2000000), 2)
                ])