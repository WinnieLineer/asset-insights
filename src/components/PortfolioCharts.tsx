'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = [
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
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
        outerRadius={outerRadius + 4}
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
      {/* Allocation Chart */}
      <div className="neo-card p-8 flex flex-col items-center min-h-[420px] bg-white">
        <div className="w-full flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-slate-800 tracking-tight">{lang.allocation}</h3>
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
                    const val = Number(payload[0].value);
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-white/10">
                        <p className="text-[10px] font-bold opacity-50 uppercase">{payload[0].name}</p>
                        <p className="text-sm font-bold">{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Dynamic Center Label - Fixed logic to prevent text fighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-36 flex flex-col items-center justify-center">
            {activeIndex !== null ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 truncate max-w-[100px]">
                  {allocationData[activeIndex].name}
                </p>
                <p className="text-2xl font-bold text-primary tracking-tighter">
                  {totalAllocationValue > 0 
                    ? ((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(1) 
                    : '0'}<span className="text-xs ml-0.5 opacity-60">%</span>
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{lang.total}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tighter">100<span className="text-xs ml-0.5 opacity-60">%</span></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="neo-card p-8 flex flex-col min-h-[420px] bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800 tracking-tight">
            {lang.trend} <span className="text-xs font-normal text-slate-400 ml-1">({displayCurrency})</span>
          </h3>
        </div>

        <div className="h-[280px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl">
                        <p className="text-[10px] opacity-50 font-bold mb-1">{label}</p>
                        <p className="text-sm font-bold">{symbol}{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fill="url(#colorValue)" 
                animationDuration={800}
                dot={{ r: 3, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
