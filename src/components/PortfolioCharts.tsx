'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = [
  '#2563eb', // Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Violet
  '#db2777', // Pink
  '#059669', // Emerald
];

const t = {
  en: { allocation: 'Asset Allocation', trend: 'History Trend', total: 'Total Assets', ratio: 'Ratio' },
  zh: { allocation: '資產配置比例', trend: '資產歷史趨勢', total: '總資產', ratio: '佔比' }
};

interface PortfolioChartsProps {
  allocationData: { name: string; value: number }[];
  historicalData: Snapshot[];
  displayCurrency: Currency;
  rates: { TWD: number, CNY: number, USD: number };
  language: 'en' | 'zh';
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export function PortfolioCharts({ allocationData, historicalData, displayCurrency, rates, language }: PortfolioChartsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lang = t[language];
  const symbol = displayCurrency === 'USD' ? '$' : displayCurrency === 'CNY' ? '¥' : 'NT$';
  
  const convert = (val: number) => {
    const rate = rates.TWD || 32.5;
    if (displayCurrency === 'USD') return val / rate;
    if (displayCurrency === 'CNY') return val * (rates.CNY / rate);
    return val;
  };

  const chartData = historicalData.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', { month: 'short', day: 'numeric' }),
    totalValue: convert(d.totalTWD)
  }));

  const totalAllocationValue = useMemo(() => {
    return allocationData.reduce((acc, curr) => acc + curr.value, 0);
  }, [allocationData]);

  return (
    <>
      {/* Allocation */}
      <div className="neo-card p-8 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800">{lang.allocation}</h3>
        </div>
        
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={800}
              >
                {allocationData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const percent = totalAllocationValue > 0 
                      ? ((Number(payload[0].value) / totalAllocationValue) * 100).toFixed(1) 
                      : '0';
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">{payload[0].name}</p>
                        <p className="text-base font-bold text-slate-900">{symbol}{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        <p className="text-xs font-bold text-primary">{lang.ratio}: {percent}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            {activeIndex !== null ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-0.5">{allocationData[activeIndex].name}</p>
                <p className="text-2xl font-bold text-slate-900">
                  {totalAllocationValue > 0 
                    ? ((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(1) 
                    : '0'}%
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-bold text-slate-400 mb-0.5">{lang.total}</p>
                <p className="text-lg font-bold text-slate-900">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend */}
      <div className="neo-card p-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800">{lang.trend} <span className="text-sm font-normal text-slate-400">({displayCurrency})</span></h3>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                cursor={{ stroke: '#2563eb', strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border-none">
                        <p className="text-[10px] opacity-50 font-bold mb-0.5">{label}</p>
                        <p className="text-base font-bold">{symbol}{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#2563eb" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1000}
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-bold">Add snapshots to view trend</div>
        )}
      </div>
    </>
  );
}