'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';
import { cn } from '@/lib/utils';

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
        outerRadius={outerRadius + 6}
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
      <div className="neo-card p-8 flex flex-col items-center min-h-[420px]">
        <div className="w-full flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-slate-800 tracking-tight">{lang.allocation}</h3>
        </div>
        
        <div className="h-[320px] w-full relative group">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={800}
                animationBegin={0}
              >
                {allocationData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} className="hover:opacity-80 transition-opacity" />
                ))}
              </Pie>
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const val = Number(payload[0].value);
                    const percent = totalAllocationValue > 0 ? ((val / totalAllocationValue) * 100).toFixed(1) : '0';
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/10 text-white animate-in fade-in zoom-in duration-200">
                        <p className="text-[10px] font-bold opacity-50 mb-1 tracking-widest uppercase">{payload[0].name}</p>
                        <p className="text-sm font-bold">{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] font-bold text-blue-400 mt-1">{lang.ratio}: {percent}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Dynamic Center Label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-32 flex flex-col items-center justify-center">
            {activeIndex !== null ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider line-clamp-1">
                  {allocationData[activeIndex].name}
                </p>
                <p className="text-3xl font-bold text-slate-900 tracking-tighter">
                  {totalAllocationValue > 0 
                    ? ((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(1) 
                    : '0'}<span className="text-sm font-semibold opacity-50">%</span>
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">{lang.total}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tighter">100<span className="text-sm font-semibold opacity-50">%</span></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="neo-card p-8 flex flex-col min-h-[420px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-slate-800 tracking-tight">
            {lang.trend} <span className="text-xs font-normal text-slate-400 ml-1 uppercase tracking-widest">({displayCurrency})</span>
          </h3>
        </div>

        <div className="h-[280px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                cursor={{ stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                        <p className="text-[10px] opacity-50 font-bold mb-1 tracking-widest uppercase">{label}</p>
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
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationDuration={1000}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest">
            Add snapshots to view trend
          </div>
        )}
      </div>
    </>
  );
}
