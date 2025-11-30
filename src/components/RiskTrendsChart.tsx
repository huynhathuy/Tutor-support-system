import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useState } from 'react';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

const mockTrendData = [
  { week: 'Week 1', atRiskPercent: 12, totalStudents: 500, atRiskCount: 60 },
  { week: 'Week 2', atRiskPercent: 14, totalStudents: 500, atRiskCount: 70 },
  { week: 'Week 3', atRiskPercent: 18, totalStudents: 500, atRiskCount: 90 },
  { week: 'Week 4', atRiskPercent: 16, totalStudents: 500, atRiskCount: 80 },
  { week: 'Week 5', atRiskPercent: 22, totalStudents: 500, atRiskCount: 110 },
  { week: 'Week 6', atRiskPercent: 20, totalStudents: 500, atRiskCount: 100 },
  { week: 'Week 7', atRiskPercent: 25, totalStudents: 500, atRiskCount: 125 },
  { week: 'Week 8', atRiskPercent: 23, totalStudents: 500, atRiskCount: 115 },
  { week: 'Week 9', atRiskPercent: 28, totalStudents: 500, atRiskCount: 140 },
  { week: 'Week 10', atRiskPercent: 26, totalStudents: 500, atRiskCount: 130 },
  { week: 'Week 11', atRiskPercent: 24, totalStudents: 500, atRiskCount: 120 },
  { week: 'Week 12', atRiskPercent: 22, totalStudents: 500, atRiskCount: 110 },
];

export function RiskTrendsChart() {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const thresholdPercent = 20;

  const exportChart = () => {
    // Export chart as PNG/PDF (simplified)
    alert('Chart export functionality - would generate PNG/PDF');
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm mb-2">{data.week}</p>
          <div className="space-y-1">
            <p className="text-sm text-[#0033A0]">
              At-Risk: <strong>{data.atRiskPercent}%</strong> ({data.atRiskCount} students)
            </p>
            <p className="text-sm text-gray-600">
              Total Students: {data.totalStudents}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate trend
  const latestPercent = mockTrendData[mockTrendData.length - 1].atRiskPercent;
  const previousPercent = mockTrendData[mockTrendData.length - 2].atRiskPercent;
  const trendDirection = latestPercent > previousPercent ? 'up' : 'down';
  const trendChange = Math.abs(latestPercent - previousPercent);

  return (
    <div className="p-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-[#0033A0] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line Chart
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-[#0033A0] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bar Chart
            </button>
          </div>

          {/* Trend Indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            trendDirection === 'up' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {trendDirection === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm">
              {trendDirection === 'up' ? '+' : '-'}{trendChange.toFixed(1)}% from last week
            </span>
          </div>
        </div>

        <button
          onClick={exportChart}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export Chart
        </button>
      </div>

      {/* Chart Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Threshold:</strong> {thresholdPercent}% at-risk rate (shown as red line). 
          Current rate: <strong className={latestPercent > thresholdPercent ? 'text-red-600' : 'text-green-600'}>
            {latestPercent}%
          </strong>
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'line' ? (
          <LineChart data={mockTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="week" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: '% At-Risk Students', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
            <ReferenceLine 
              y={thresholdPercent} 
              stroke="#dc2626" 
              strokeDasharray="3 3"
              label={{ value: 'Threshold', position: 'right', fill: '#dc2626', fontSize: 12 }}
            />
            <Line 
              type="monotone" 
              dataKey="atRiskPercent" 
              stroke="#0033A0" 
              strokeWidth={3}
              name="At-Risk %"
              dot={{ fill: '#0033A0', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <BarChart data={mockTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="week" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: '% At-Risk Students', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <ReferenceLine 
              y={thresholdPercent} 
              stroke="#dc2626" 
              strokeDasharray="3 3"
              label={{ value: 'Threshold', position: 'right', fill: '#dc2626', fontSize: 12 }}
            />
            <Bar 
              dataKey="atRiskPercent" 
              fill="#0033A0"
              name="At-Risk %"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Average At-Risk Rate</p>
          <p className="text-2xl text-[#0033A0]">
            {(mockTrendData.reduce((sum, d) => sum + d.atRiskPercent, 0) / mockTrendData.length).toFixed(1)}%
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Peak Week</p>
          <p className="text-2xl text-red-600">
            {Math.max(...mockTrendData.map(d => d.atRiskPercent))}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {mockTrendData.find(d => d.atRiskPercent === Math.max(...mockTrendData.map(d => d.atRiskPercent)))?.week}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Current Total At-Risk</p>
          <p className="text-2xl text-[#0033A0]">
            {mockTrendData[mockTrendData.length - 1].atRiskCount}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            out of {mockTrendData[mockTrendData.length - 1].totalStudents} students
          </p>
        </div>
      </div>

      {/* Interactive Note */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          💡 <strong>Tip:</strong> Click on different weeks in the chart to filter the risk list table by that time period. 
          The red threshold line indicates your configured at-risk rate limit.
        </p>
      </div>
    </div>
  );
}
