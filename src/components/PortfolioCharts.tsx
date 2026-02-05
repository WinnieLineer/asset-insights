
'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';
import { cn } from '@/lib/utils';

// 摩登且具備層次感的配色方案
const COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#10b981', // Emerald
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

// 渲染選中的 Pie 區塊動畫
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-xl"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
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

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
      {/* Asset Allocation Card */}
      <div className="neo-card p-8 flex flex-col items-center relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-full flex justify-between items-center mb-6">
          <h3 className="font-headline font-bold text-xl text-slate-800">{lang.allocation}</h3>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
        
        <div className="h-[350px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={105}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationBegin={0}
                animationDuration={1500}
              >
                {allocationData.map((_, i) => (
                  <Cell 
                    key={`cell-${i}`} 
                    fill={COLORS[i % COLORS.length]} 
                    className="hover:opacity-80 transition-all cursor-pointer"
                  />
                ))}
              </Pie>
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const percent = totalAllocationValue > 0 
                      ? ((Number(payload[0].value) / totalAllocationValue) * 100).toFixed(1) 
                      : '0';
                    return (
                      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">{payload[0].name}</p>
                        <p className="text-lg font-bold text-slate-900">{symbol}{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        <p className="text-xs font-bold text-primary mt-1">{lang.ratio}: {percent}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            {activeIndex !== null ? (
              <div className="animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] uppercase tracking-tighter font-bold text-primary mb-0.5">{allocationData[activeIndex].name}</p>
                <p className="text-3xl font-headline font-bold text-slate-900 leading-none">
                  {totalAllocationValue > 0 
                    ? ((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(1) 
                    : '0'}%
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <p className="text-[10px] uppercase tracking-tighter font-bold text-slate-400 mb-0.5">{lang.total}</p>
                <p className="text-xl font-headline font-bold text-slate-900">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Trend Card */}
      <div className="neo-card p-8 flex flex-col relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-bold text-xl text-slate-800">{lang.trend} <span className="text-sm font-normal text-slate-400 ml-2">({displayCurrency})</span></h3>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
              <YAxis 
                hide 
                domain={['auto', 'auto']}
              />
              <RechartsTooltip 
                cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="text-[10px] uppercase tracking-widest font-bold opacity-50 mb-1">{label}</p>
                        <p className="text-lg font-bold">{symbol}{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
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
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
                animationBegin={200}
                animationDuration={2000}
                dot={{ r: 6, fill: '#3b82f6', strokeWidth: 3, stroke: '#fff' }}
                activeDot={{ r: 8, fill: '#3b82f6', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
            <p className="text-slate-400 text-sm font-medium">Add snapshots to view trend</p>
          </div>
        )}
      </div>
    </div>
  );
}
