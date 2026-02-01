
'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = ['#3F51B5', '#FF4500', '#4CAF50', '#9C27B0', '#FF9800'];

interface PortfolioChartsProps {
  allocationData: { name: string; value: number }[];
  historicalData: Snapshot[];
  displayCurrency: Currency;
  rates: { TWD: number, CNY: number, USD: number };
}

export function PortfolioCharts({ allocationData, historicalData, displayCurrency, rates }: PortfolioChartsProps) {
  const getCurrencySymbol = (cur: Currency) => {
    if (cur === 'USD') return '$';
    if (cur === 'CNY') return '¥';
    return 'NT$';
  };

  const convertTWDToDisplay = (twdVal: number) => {
    if (displayCurrency === 'USD') return twdVal / rates.TWD;
    if (displayCurrency === 'CNY') return twdVal * (rates.CNY / rates.TWD);
    return twdVal;
  };

  const processedHistoricalData = historicalData.map(d => ({
    ...d,
    totalValue: convertTWDToDisplay(d.totalTWD)
  }));

  const currencySymbol = getCurrencySymbol(displayCurrency);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center">
        <h3 className="font-headline font-bold text-lg mb-4 self-start">資產配置比例</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: number) => `${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-headline font-bold text-lg mb-4">資產歷史趨勢 ({displayCurrency})</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedHistoricalData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
              />
              <RechartsTooltip 
                formatter={(value: number) => [`${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}`, '總資產']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#3F51B5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3F51B5' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
