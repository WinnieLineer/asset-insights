'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
];

const t = {
  en: { allocation: 'Portfolio Allocation', trend: 'Valuation Trend', total: 'Net Value', ratio: 'Ratio' },
  zh: { allocation: '資產配置比例', trend: '資產價值走勢', total: '淨資產', ratio: '佔比' }
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <circle cx={cx} cy={cy} r={innerRadius - 4} fill={fill} opacity={0.1} />
    </g>
  );
};

export function PortfolioCharts({ allocationData, historicalData, displayCurrency, rates, language }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = displayCurrency === 'USD' ? '$' : displayCurrency === 'CNY' ? '¥' : 'NT$';
  
  const convert = (val: number) => {
    const rate = rates.TWD || 32.5;
    if (displayCurrency === 'USD') return val / rate;
    if (displayCurrency === 'CNY') return val * (rates.CNY / rate);
    return val;
  };

  const chartData = historicalData.map((d: any) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    totalValue: convert(d.totalTWD)
  }));

  const totalAllocationValue = useMemo(() => {
    return allocationData.reduce((acc: number, curr: any) => acc + curr.value, 0);
  }, [allocationData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="modern-card p-8 flex flex-col items-center min-h-[400px] rounded-2xl bg-white">
        <div className="w-full mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{lang.allocation}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Distribution by category</p>
        </div>
        
        <div className="h-[260px] w-full relative">
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
                stroke="transparent"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={800}
              >
                {allocationData.map((_: any, i: number) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const val = Number(payload[0].value);
                    return (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-lg shadow-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                        <p className="text-sm font-bold text-slate-900">{symbol}{val.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full">
            {activeIndex !== null ? (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5 truncate max-w-[120px] mx-auto">
                  {allocationData[activeIndex].name}
                </p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(1)}%
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{lang.ratio}</p>
                <p className="text-2xl font-bold text-slate-200 tracking-tight">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modern-card p-8 flex flex-col min-h-[400px] rounded-2xl bg-white">
        <div className="w-full mb-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{lang.trend}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Net worth evolution</p>
        </div>

        <div className="h-[240px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-lg shadow-xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                        <p className="text-sm font-bold text-indigo-600">{symbol}{payload[0].value.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#4F46E5" 
                strokeWidth={2.5} 
                fill="url(#colorValue)" 
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}