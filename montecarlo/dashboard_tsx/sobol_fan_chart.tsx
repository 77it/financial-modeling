import React, { useState, useMemo } from 'react';
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const CashFlowRiskChart = () => {
  const [showPaths, setShowPaths] = useState(false);
  const [numPathsToShow, setNumPathsToShow] = useState(30);
  const [minCashThreshold, setMinCashThreshold] = useState(20);

  // Generate sample cash flow simulation data
  const simulationData = useMemo(() => {
    const numRuns = 20000;
    const numMonths = 36; // 3 years monthly
    const runs = [];
    
    // Generate 20K simulation paths with realistic cash flow patterns
    for (let i = 0; i < numRuns; i++) {
      const path = [100]; // Starting cash
      const avgBurn = -2 + Math.random() * 1; // Monthly burn rate variation
      const volatility = 5 + Math.random() * 5;
      
      for (let month = 1; month < numMonths; month++) {
        const randomShock = (Math.random() - 0.5) * 2;
        const monthlyChange = avgBurn + volatility * randomShock;
        const newValue = Math.max(0, path[month - 1] + monthlyChange); // Can't go below 0
        path.push(newValue);
      }
      runs.push(path);
    }
    
    // Calculate percentiles for each month
    const chartData = [];
    for (let month = 0; month < numMonths; month++) {
      const monthValues = runs.map(run => run[month]).sort((a, b) => a - b);
      
      chartData.push({
        month: month,
        p50: monthValues[Math.floor(numRuns * 0.50)],
        p01: monthValues[Math.floor(numRuns * 0.01)],
        p05: monthValues[Math.floor(numRuns * 0.05)],
        p10: monthValues[Math.floor(numRuns * 0.10)],
        p25: monthValues[Math.floor(numRuns * 0.25)],
        p75: monthValues[Math.floor(numRuns * 0.75)],
        p90: monthValues[Math.floor(numRuns * 0.90)],
        p95: monthValues[Math.floor(numRuns * 0.95)],
        p99: monthValues[Math.floor(numRuns * 0.99)],
        min: monthValues[0],
        max: monthValues[numRuns - 1],
        belowThreshold: monthValues.filter(v => v < minCashThreshold).length / numRuns * 100
      });
    }
    
    return { chartData, runs };
  }, [minCashThreshold]);

  const { chartData, runs } = simulationData;

  // Find when we hit threshold issues
  const firstRiskMonth = chartData.findIndex(d => d.p10 < minCashThreshold);
  const criticalMonth = chartData.findIndex(d => d.p50 < minCashThreshold);

  // Select random paths to display
  const selectedPaths = useMemo(() => {
    if (!showPaths) return [];
    const indices = [];
    for (let i = 0; i < numPathsToShow; i++) {
      indices.push(Math.floor(Math.random() * runs.length));
    }
    return indices.map(idx => runs[idx]);
  }, [showPaths, numPathsToShow, runs]);

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Cash Flow Risk Analysis - Sobol Simulation
          </h2>
          <p className="text-slate-600 mb-4">
            Downside risk visualization for 20,000 simulation runs
          </p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPaths}
                onChange={(e) => setShowPaths(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-slate-700">Show sample paths</span>
            </label>
            
            {showPaths && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-700">Paths:</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={numPathsToShow}
                  onChange={(e) => setNumPathsToShow(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-slate-600">{numPathsToShow}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-700">Min Cash Alert:</label>
              <input
                type="number"
                value={minCashThreshold}
                onChange={(e) => setMinCashThreshold(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-slate-300 rounded"
              />
              <span className="text-sm text-slate-600">$M</span>
            </div>
          </div>

          {(firstRiskMonth > 0 || criticalMonth > 0) && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3">
              <AlertTriangle className="text-red-600 mt-0.5" size={20} />
              <div className="text-sm">
                {firstRiskMonth > 0 && (
                  <p className="text-red-800 font-semibold">
                    ⚠️ Warning: 10% of scenarios fall below ${minCashThreshold}M threshold by month {firstRiskMonth}
                  </p>
                )}
                {criticalMonth > 0 && (
                  <p className="text-red-900 font-bold mt-1">
                    🚨 Critical: Median (P50) falls below threshold at month {criticalMonth}
                  </p>
                )}
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                stroke="#64748b"
              />
              <YAxis 
                label={{ value: 'Cash ($M)', angle: -90, position: 'insideLeft' }}
                stroke="#64748b"
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #cbd5e1' }}
                formatter={(value) => typeof value === 'number' ? `$${value.toFixed(1)}M` : value}
              />
              <Legend />
              
              {/* Minimum cash threshold line */}
              <ReferenceLine 
                y={minCashThreshold} 
                stroke="#dc2626" 
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{ value: 'Min Cash Threshold', position: 'right', fill: '#dc2626', fontSize: 12 }}
              />
              
              {/* Upside band (P75-P95) - less important, lighter */}
              <Area
                type="monotone"
                dataKey="p95"
                stroke="none"
                fill="#86efac"
                fillOpacity={0.2}
                name="P95 (Upside)"
              />
              <Area
                type="monotone"
                dataKey="p75"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
              
              {/* Middle range (P25-P75) */}
              <Area
                type="monotone"
                dataKey="p75"
                stroke="none"
                fill="#93c5fd"
                fillOpacity={0.3}
                name="P75"
              />
              <Area
                type="monotone"
                dataKey="p25"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
                name="P25"
              />
              
              {/* DOWNSIDE RISK - emphasized with darker colors */}
              <Area
                type="monotone"
                dataKey="p25"
                stroke="none"
                fill="#fca5a5"
                fillOpacity={0.3}
                name="Downside Risk"
              />
              <Area
                type="monotone"
                dataKey="p05"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
              
              {/* Worst case band (P1-P5) - MOST IMPORTANT */}
              <Area
                type="monotone"
                dataKey="p05"
                stroke="none"
                fill="#ef4444"
                fillOpacity={0.4}
                name="Worst 5%"
              />
              <Area
                type="monotone"
                dataKey="p01"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
              
              {/* Key percentile lines - emphasize downside */}
              <Line
                type="monotone"
                dataKey="p05"
                stroke="#dc2626"
                strokeWidth={2.5}
                dot={false}
                name="P5 (95% are above this)"
              />
              <Line
                type="monotone"
                dataKey="p10"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                name="P10 (90% are above this)"
                strokeDasharray="5 5"
              />
              
              {/* Median */}
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#1e40af"
                strokeWidth={3}
                dot={false}
                name="P50 (Median)"
              />
              
              {/* Upside (less emphasized) */}
              <Line
                type="monotone"
                dataKey="p95"
                stroke="#16a34a"
                strokeWidth={1.5}
                dot={false}
                name="P95 (Upside)"
                strokeDasharray="5 5"
                opacity={0.6}
              />
              
              {/* Sample paths */}
              {showPaths && selectedPaths.map((path, idx) => {
                const pathData = chartData.map((d, i) => ({
                  month: d.month,
                  value: path[i]
                }));
                return (
                  <Line
                    key={idx}
                    data={pathData}
                    type="monotone"
                    dataKey="value"
                    stroke="#94a3b8"
                    strokeWidth={0.5}
                    dot={false}
                    opacity={0.15}
                    legendType="none"
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 border-2 border-red-200 rounded p-3">
              <div className="text-xs text-red-700 font-semibold mb-1">WORST CASE (P5)</div>
              <div className="text-xl font-bold text-red-800">
                ${chartData[chartData.length - 1].p05.toFixed(1)}M
              </div>
              <div className="text-xs text-red-600 mt-1">Only 5% fall below this</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="text-xs text-orange-700 font-semibold mb-1">DOWNSIDE (P10)</div>
              <div className="text-xl font-bold text-orange-800">
                ${chartData[chartData.length - 1].p10.toFixed(1)}M
              </div>
              <div className="text-xs text-orange-600 mt-1">10% fall below this</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-xs text-blue-700 font-semibold mb-1">EXPECTED (P50)</div>
              <div className="text-xl font-bold text-blue-800">
                ${chartData[chartData.length - 1].p50.toFixed(1)}M
              </div>
              <div className="text-xs text-blue-600 mt-1">Median outcome</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="text-xs text-green-700 font-semibold mb-1">UPSIDE (P95)</div>
              <div className="text-xl font-bold text-green-800">
                ${chartData[chartData.length - 1].p95.toFixed(1)}M
              </div>
              <div className="text-xs text-green-600 mt-1">Only 5% exceed this</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">📊 Risk-Focused Interpretation:</h3>
          <div className="space-y-3 text-slate-700">
            <div className="flex gap-3">
              <span className="font-bold text-red-600 min-w-[60px]">P5 Line:</span>
              <span><strong>Your safety net.</strong> 95% of scenarios stay above this level. If this line crosses your minimum cash threshold, you have serious liquidity risk.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-orange-600 min-w-[60px]">P10 Line:</span>
              <span><strong>Early warning.</strong> If 10% of scenarios run into trouble, you should have contingency plans ready.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-blue-700 min-w-[60px]">P50 Line:</span>
              <span><strong>Base case.</strong> Your most likely outcome - but remember, half of scenarios do worse than this!</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-red-500 min-w-[60px]">Red band:</span>
              <span><strong>High risk zone.</strong> The worst 5% of outcomes fall here. This is where you face potential cash crises.</span>
            </div>
            <div className="flex gap-3">
              <span className="font-bold text-green-600 min-w-[60px]">P95 Line:</span>
              <span><strong>Best case.</strong> Only 5% of scenarios do better than this - don't plan around optimistic outcomes!</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Key Questions This Chart Answers:</h4>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>• When might we run out of cash? (Look when P5 or P10 crosses your threshold)</li>
              <li>• How much runway do we have in bad scenarios? (Follow the red P5 line)</li>
              <li>• What's our downside vs upside? (Compare distance from P50 to P5 vs P50 to P95)</li>
              <li>• Should we raise more capital? (If P10 gets too close to minimum cash)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowRiskChart;