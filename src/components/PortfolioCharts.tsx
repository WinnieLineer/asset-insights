'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = [
  '#5D6D7E', // 岩灰藍
  '#85929E', // 淺岩灰
  '#AAB7B8', // 灰青
  '#7FB3D5', // 柔和藍
  '#48C9B0', // 鼠尾草綠
];

const t = {
  en: { allocation: 'Portfolio Allocation', trend: 'Valuation Trend', total: 'Net Worth', ratio: 'Ratio' },
  zh: { allocation: '資產配比結構', trend: '估值成長趨勢', total: '資產淨值', ratio: '配置佔比' }
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
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
        opacity={0.3}
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
      <div className="wabi-card p-10 flex flex-col items-center min-h-[460px] bg-white/80">
        <div className="w-full flex flex-col gap-1 mb-6">
          <h3 className="font-bold text-xl text-slate-800 tracking-tight">{lang.allocation}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Asset Structural Balance</p>
        </div>
        
        <div className="h-[280px] w-full relative">
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
                paddingAngle={6}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={1000}
                animationBegin={200}
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
                      <div className="bg-slate-800/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-[10px] font-bold opacity-50 uppercase mb-1 tracking-widest">{payload[0].name}</p>
                        <p className="text-sm font-bold">{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Central Content - Managed properly to avoid text overlap */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none flex flex-col items-center justify-center w-32 h-32">
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {activeIndex !== null ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col items-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 truncate max-w-[100px]">
                    {allocationData[activeIndex].name}
                  </p>
                  <p className="text-3xl font-bold text-primary tracking-tighter">
                    {totalAllocationValue > 0 
                      ? ((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(1) 
                      : '0'}<span className="text-sm ml-1 opacity-50">%</span>
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500 flex flex-col items-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{lang.ratio}</p>
                  <p className="text-3xl font-bold text-slate-800 tracking-tighter">100<span className="text-sm ml-1 opacity-50">%</span></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="wabi-card p-10 flex flex-col min-h-[460px] bg-white/80">
        <div className="w-full flex flex-col gap-1 mb-10">
          <h3 className="font-bold text-xl text-slate-800 tracking-tight">
            {lang.trend} <span className="text-xs font-normal text-slate-400 ml-2">({displayCurrency})</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Growth Path Timeline</p>
        </div>

        <div className="h-[260px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5D6D7E" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#5D6D7E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-800/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10">
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
                stroke="#5D6D7E" 
                strokeWidth={4} 
                fill="url(#colorValue)" 
                animationDuration={1500}
                dot={{ r: 4, fill: '#5D6D7E', stroke: '#fff', strokeWidth: 3 }}
                activeDot={{ r: 6, fill: '#5D6D7E', stroke: '#fff', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}