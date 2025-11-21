import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Upload, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const SobolSensitivityAnalyzer = () => {
  const [selectedMetric, setSelectedMetric] = useState('Cash');
  const [selectedYear, setSelectedYear] = useState(1);
  const [topN, setTopN] = useState(15);

  // Generate sample data simulating your Sobol results
  const simulationData = useMemo(() => {
    const numRuns = 20000;
    const numVars = 100;
    const numYears = 3;
    
    // Simulate variable names
    const varNames = [];
    for (let i = 1; i <= numVars; i++) {
      const type = i <= 50 ? 'Price' : 'Quantity';
      const product = String.fromCharCode(65 + ((i - 1) % 26));
      varNames.push(`${type}_${product}${Math.floor((i - 1) / 26) + 1}`);
    }
    
    // Simulate inputs and outputs with CLEAR relationships
    const inputs = [];
    const outputs = { Cash: [], EBITDA: [] };
    
    for (let run = 0; run < numRuns; run++) {
      const runInputs = Array(numVars).fill(0).map(() => Math.random() * 2 - 1);
      inputs.push(runInputs);
      
      const cashYearly = [];
      const ebitdaYearly = [];
      
      for (let year = 0; year < numYears; year++) {
        // Base values
        let cashValue = 100;
        let ebitdaValue = 20;
        
        // Different variables have DIFFERENT impacts on Cash vs EBITDA
        for (let v = 0; v < numVars; v++) {
          const yearShift = (year * 5);
          const adjustedImportance = Math.exp(-(Math.abs(v - yearShift * 3)) / 15);
          
          // Cash is more sensitive to different variables than EBITDA
          if (v < 30) {
            // First 30 variables affect Cash more
            cashValue += runInputs[v] * adjustedImportance * 35;
            ebitdaValue += runInputs[v] * adjustedImportance * 5;
          } else if (v < 60) {
            // Middle variables affect EBITDA more
            cashValue += runInputs[v] * adjustedImportance * 15;
            ebitdaValue += runInputs[v] * adjustedImportance * 12;
          } else {
            // Later variables affect both differently
            cashValue += runInputs[v] * adjustedImportance * 20;
            ebitdaValue += runInputs[v] * adjustedImportance * 8;
          }
        }
        
        // Add small random noise (only 10% noise)
        cashValue += (Math.random() - 0.5) * 5;
        ebitdaValue += (Math.random() - 0.5) * 2;
        
        cashYearly.push(cashValue);
        ebitdaYearly.push(ebitdaValue);
      }
      
      outputs.Cash.push(cashYearly);
      outputs.EBITDA.push(ebitdaYearly);
    }
    
    // Calculate sensitivity
    const sensitivity = {};
    
    ['Cash', 'EBITDA'].forEach(metric => {
      sensitivity[metric] = [];
      
      for (let year = 0; year < numYears; year++) {
        const yearSensitivity = [];
        const yearOutputs = outputs[metric].map(runYears => runYears[year]);
        const outputMean = yearOutputs.reduce((a, b) => a + b, 0) / numRuns;
        const outputStd = Math.sqrt(
          yearOutputs.reduce((sum, val) => sum + Math.pow(val - outputMean, 2), 0) / numRuns
        );
        
        for (let v = 0; v < numVars; v++) {
          const varValues = inputs.map(run => run[v]);
          const varMean = varValues.reduce((a, b) => a + b, 0) / numRuns;
          const varStd = Math.sqrt(
            varValues.reduce((sum, val) => sum + Math.pow(val - varMean, 2), 0) / numRuns
          );
          
          let correlation = 0;
          for (let run = 0; run < numRuns; run++) {
            correlation += (varValues[run] - varMean) * (yearOutputs[run] - outputMean);
          }
          correlation = correlation / (numRuns * varStd * outputStd);
          
          const sensitivityIndex = Math.pow(correlation, 2);
          
          yearSensitivity.push({
            variable: varNames[v],
            sensitivity: sensitivityIndex * 100,
            correlation: correlation
          });
        }
        
        yearSensitivity.sort((a, b) => b.sensitivity - a.sensitivity);
        sensitivity[metric].push(yearSensitivity);
      }
    });

    return { sensitivity, varNames, inputs, outputs, numRuns, numVars };
  }, []);

  // Calculate downside risk
  const downsideAnalysis = useMemo(() => {
    const { inputs, outputs, numRuns, numVars, varNames } = simulationData;
    const year = selectedYear - 1;
    
    const yearOutputs = outputs[selectedMetric].map(runYears => runYears[year]);
    const sortedOutputs = [...yearOutputs].sort((a, b) => a - b);
    const p10Threshold = sortedOutputs[Math.floor(numRuns * 0.10)];
    const p90Threshold = sortedOutputs[Math.floor(numRuns * 0.90)];
    
    const worstScenarios = [];
    const bestScenarios = [];
    
    yearOutputs.forEach((output, runIdx) => {
      if (output <= p10Threshold) worstScenarios.push(runIdx);
      else if (output >= p90Threshold) bestScenarios.push(runIdx);
    });
    
    const downsideDrivers = [];
    
    for (let v = 0; v < numVars; v++) {
      const worstVarValues = worstScenarios.map(idx => inputs[idx][v]);
      const bestVarValues = bestScenarios.map(idx => inputs[idx][v]);
      const allVarValues = inputs.map(run => run[v]);
      
      const worstMean = worstVarValues.reduce((a, b) => a + b, 0) / worstVarValues.length;
      const bestMean = bestVarValues.reduce((a, b) => a + b, 0) / bestVarValues.length;
      const allMean = allVarValues.reduce((a, b) => a + b, 0) / allVarValues.length;
      const allStd = Math.sqrt(
        allVarValues.reduce((sum, val) => sum + Math.pow(val - allMean, 2), 0) / allVarValues.length
      );
      
      const separation = Math.abs(worstMean - bestMean) / (allStd || 1);
      const direction = worstMean < bestMean ? 'low' : 'high';
      const downsideImpact = Math.abs(worstMean - allMean);
      const upsideImpact = Math.abs(bestMean - allMean);
      const asymmetryRatio = downsideImpact / (upsideImpact || 0.001);
      
      downsideDrivers.push({
        variable: varNames[v],
        separation,
        direction,
        worstMean,
        bestMean,
        asymmetryRatio
      });
    }
    
    downsideDrivers.sort((a, b) => b.separation - a.separation);
    
    return {
      downsideDrivers,
      p10Threshold,
      worstCount: worstScenarios.length
    };
  }, [simulationData, selectedMetric, selectedYear]);

  const currentData = simulationData.sensitivity[selectedMetric][selectedYear - 1]
    .slice(0, topN);

  const topDownsideDrivers = downsideAnalysis.downsideDrivers.slice(0, 15);

  const totalSensitivity = currentData.reduce((sum, item) => sum + item.sensitivity, 0);
  const cumulativePct = (totalSensitivity / 
    simulationData.sensitivity[selectedMetric][selectedYear - 1]
      .reduce((sum, item) => sum + item.sensitivity, 0) * 100
  ).toFixed(1);

  const topVarsOverall = new Set();
  simulationData.sensitivity[selectedMetric].forEach(yearData => {
    yearData.slice(0, 10).forEach(item => topVarsOverall.add(item.variable));
  });

  return (
    <div className="w-full min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Sobol Sensitivity Analysis
          </h1>
          <p className="text-slate-600">
            Identifying which input variables drive the most variance in your outputs (20,000 simulation runs)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Output Metric
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="EBITDA">EBITDA</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Year 1</option>
                <option value={2}>Year 2</option>
                <option value={3}>Year 3</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Top N Variables
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-slate-600 mt-1">
                Showing top {topN} of 100 variables
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="text-sm opacity-90 mb-1">Top Variable Impact</div>
            <div className="text-3xl font-bold mb-1">
              {currentData[currentData.length - 1]?.sensitivity.toFixed(1)}%
            </div>
            <div className="text-sm opacity-90">
              {currentData[currentData.length - 1]?.variable}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="text-sm opacity-90 mb-1">Top {topN} Cumulative</div>
            <div className="text-3xl font-bold mb-1">
              {cumulativePct}%
            </div>
            <div className="text-sm opacity-90">
              of total variance explained
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="text-sm opacity-90 mb-1">Analysis</div>
            <div className="text-3xl font-bold mb-1">
              {selectedMetric}
            </div>
            <div className="text-sm opacity-90">
              Year {selectedYear} sensitivity
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Tornado Chart - Top {topN} Drivers of {selectedMetric} (Year {selectedYear})
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Variables ranked by their contribution to output variance. Higher values = more impact.
          </p>
          
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📖 Understanding the Numbers:</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex gap-2">
                <span className="font-bold min-w-[140px]">Sensitivity % (bar):</span>
                <span>How much of the OUTPUT variance this variable explains. 10% = this variable accounts for 10% of why your Cash/EBITDA varies across simulations.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold min-w-[140px]">Correlation % (right):</span>
                <span>The DIRECTION and STRENGTH of relationship. +85% = strong positive (input ↑ → output ↑), -60% = strong negative (input ↑ → output ↓).</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {currentData.map((item, idx) => {
              const maxSensitivity = currentData[0].sensitivity; // First item is highest
              
              return (
                <div key={item.variable} className="flex items-center gap-3">
                  <div className="w-32 text-right text-xs font-medium text-slate-700 truncate">
                    {item.variable}
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className="h-full rounded-full flex items-center justify-end px-3 text-white text-sm font-semibold transition-all duration-500"
                      style={{
                        width: `${(item.sensitivity / maxSensitivity) * 100}%`,
                        backgroundColor: `hsl(${220 - idx * 2}, 70%, ${50 + idx}%)`
                      }}
                    >
                      {item.sensitivity.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-16 text-xs text-slate-600 font-medium">
                    {item.correlation > 0 ? '+' : ''}{(item.correlation * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 flex items-center gap-6 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-16 h-3 bg-gradient-to-r from-blue-300 to-blue-600 rounded"></div>
              <span>= Sensitivity (variance explained)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">+85%</span>
              <span>= Positive correlation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">-60%</span>
              <span>= Negative correlation</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-600" size={28} />
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Downside Risk Drivers - What Causes {selectedMetric} to Be LOW?
              </h2>
              <p className="text-sm text-slate-600">
                Analyzing the worst 10% of outcomes ({downsideAnalysis.worstCount.toLocaleString()} runs where {selectedMetric} ≤ ${downsideAnalysis.p10Threshold.toFixed(1)}M)
              </p>
            </div>
          </div>
          
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">🎯 What This Shows:</h4>
            <div className="space-y-3 text-sm text-red-800">
              <p className="font-semibold">
                This analysis compares the WORST 10% of outcomes vs the BEST 10% of outcomes to find which variables are different between them.
              </p>
              <div className="bg-white p-3 rounded border border-red-300">
                <p className="font-bold text-red-900 mb-2">Example to understand it:</p>
                <p className="mb-2">Imagine Price_A1:</p>
                <ul className="ml-4 space-y-1 text-xs">
                  <li>• In the 2,000 WORST runs (bottom 10%), Price_A1 averages -0.8</li>
                  <li>• In the 2,000 BEST runs (top 10%), Price_A1 averages +0.6</li>
                  <li>• <strong>Separation = 1.4 standard deviations difference</strong></li>
                  <li>• Direction = "LOW" (because worst scenarios have lower values)</li>
                  <li>• <strong>Conclusion: When Price_A1 is LOW, {selectedMetric} tends to be LOW → This is a downside risk driver!</strong></li>
                </ul>
              </div>
              <div className="space-y-1 mt-3">
                <div className="flex gap-2">
                  <span className="font-bold min-w-[130px]">Separation Score:</span>
                  <span>Measures HOW DIFFERENT this variable is between worst and best outcomes. Higher score = stronger driver of downside risk.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold min-w-[130px]">Direction:</span>
                  <span><strong className="text-red-700">LOW</strong> = this variable tends to have lower values in bad scenarios (when it drops, trouble happens). <strong className="text-purple-700">HIGH</strong> = higher values in bad scenarios (when it spikes, trouble happens).</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold min-w-[130px]">Avg in Worst 10%:</span>
                  <span>The typical value of this variable in the 2,000 worst simulation runs.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold min-w-[130px]">⚠️ Asymmetry:</span>
                  <span>When shown, means this variable HURTS more than it HELPS. Example: "2.5x" = moving down causes 2.5x more damage than moving up provides benefit.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {topDownsideDrivers.map((item, idx) => {
              const maxSeparation = topDownsideDrivers[topDownsideDrivers.length - 1].separation;
              const isAsymmetric = item.asymmetryRatio > 1.5;
              
              return (
                <div key={item.variable} className="flex items-center gap-3">
                  <div className="w-32 text-right text-xs font-medium text-slate-700 truncate">
                    {item.variable}
                  </div>
                  <div className="flex-1 bg-red-50 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className="h-full rounded-full flex items-center justify-end px-3 text-white text-sm font-semibold transition-all duration-500"
                      style={{
                        width: `${(item.separation / maxSeparation) * 100}%`,
                        backgroundColor: item.direction === 'low' 
                          ? `hsl(${0 + idx * 2}, 75%, ${40 + idx * 1}%)` 
                          : `hsl(${280 - idx * 2}, 70%, ${45 + idx * 1}%)`
                      }}
                    >
                      {item.separation.toFixed(2)}
                    </div>
                  </div>
                  <div className="w-20 text-xs font-bold" style={{
                    color: item.direction === 'low' ? '#dc2626' : '#7c3aed'
                  }}>
                    {item.direction === 'low' ? '⬇️ LOW' : '⬆️ HIGH'}
                  </div>
                  <div className="w-24 text-xs text-slate-600">
                    <div>Worst: {item.worstMean.toFixed(2)}</div>
                    <div className="text-slate-400">Best: {item.bestMean.toFixed(2)}</div>
                  </div>
                  {isAsymmetric && (
                    <div className="w-16 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-bold" title="Hurts more than it helps">
                      ⚠️ {item.asymmetryRatio.toFixed(1)}x
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center gap-6 text-xs text-slate-600 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-12 h-3 bg-red-500 rounded"></div>
              <span>= LOW values cause problems</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-3 bg-purple-500 rounded"></div>
              <span>= HIGH values cause problems</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded font-bold text-xs">⚠️ 2.5x</div>
              <span>= Asymmetric (hurts 2.5x more than helps)</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">💡 Key Insight:</h4>
            <p className="text-sm text-yellow-800">
              <strong>Overall sensitivity</strong> (above) tells you which variables create the most variance overall. 
              <strong className="text-red-700"> Downside risk drivers</strong> tell you which variables, when they go wrong, cause the most damage. 
              A variable can have low overall sensitivity but still be critical for downside risk if it's asymmetric (hurts more than helps).
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            How Variable Importance Changes Over Time
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Top variables across all years for {selectedMetric}
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">
                    Variable
                  </th>
                  {[1, 2, 3].map(year => (
                    <th key={year} className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold">
                      Year {year}
                    </th>
                  ))}
                  <th className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(topVarsOverall)
                  .map(varName => {
                    const yearValues = [1, 2, 3].map(year => {
                      const found = simulationData.sensitivity[selectedMetric][year - 1]
                        .find(item => item.variable === varName);
                      return found ? found.sensitivity : 0;
                    });
                    return { varName, yearValues };
                  })
                  .sort((a, b) => b.yearValues[selectedYear - 1] - a.yearValues[selectedYear - 1])
                  .slice(0, 15)
                  .map(({ varName, yearValues }) => {
                    const trend = yearValues[2] > yearValues[0] ? 'up' : 'down';
                    const maxVal = Math.max(...yearValues);
                    
                    return (
                      <tr key={varName} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-4 py-2 text-sm font-medium">
                          {varName}
                        </td>
                        {yearValues.map((val, idx) => (
                          <td 
                            key={idx} 
                            className={`border border-slate-300 px-4 py-2 text-center text-sm ${
                              idx === selectedYear - 1 ? 'font-bold ring-2 ring-blue-500 ring-inset' : ''
                            }`}
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${val / maxVal * 0.7})`
                            }}
                          >
                            {val.toFixed(1)}%
                          </td>
                        ))}
                        <td className="border border-slate-300 px-4 py-2 text-center">
                          {trend === 'up' ? (
                            <TrendingUp className="inline text-green-600" size={18} />
                          ) : (
                            <TrendingDown className="inline text-red-600" size={18} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SobolSensitivityAnalyzer;