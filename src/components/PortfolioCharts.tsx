'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';

// Monochrome colors for the pie chart
const COLORS = [
  '#000000', // Black
  '#333333', // Dark Grey
  '#666666', // Grey
  '#999999', // Light Grey
  '#CCCCCC', // Very Light Grey
];

const t = {
  en: { allocation: 'Portfolio Allocation', trend: 'Valuation Trend', total: 'Total', ratio: 'Ratio' },
  zh: { allocation: '資產配置比例', trend: '資產價值走勢', total: '總計', ratio: '佔比' }
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
      <circle cx={cx} cy={cy} r={innerRadius - 4} fill={fill} opacity={0.05} />
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
      {/* Allocation Pie Chart */}
      <div className="modern-card p-8 flex flex-col items-center min-h-[400px] border-slate-200">
        <div className="w-full mb-2">
          <h3 className="text-[10px] font-bold text-black uppercase tracking-widest">{lang.allocation}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Diversification matrix</p>
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
                paddingAngle={4}
                dataKey="value"
                stroke="transparent"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={600}
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
                      <div className="bg-white border border-slate-200 p-2.5 rounded shadow-sm animate-fade-in">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{payload[0].name}</p>
                        <p className="text-xs font-bold text-black">{symbol}{val.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full max-w-[120px] px-2">
            {activeIndex !== null && allocationData[activeIndex] ? (
              <div className="animate-fade-in">
                <p className="text-[9px] font-bold text-black uppercase tracking-widest truncate">
                  {allocationData[activeIndex].name}
                </p>
                <p className="text-2xl font-black text-black tracking-tighter">
                  {((allocationData[activeIndex].value / (totalAllocationValue || 1)) * 100).toFixed(1)}%
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{lang.total}</p>
                <p className="text-2xl font-black text-slate-200 tracking-tighter">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Area Chart */}
      <div className="modern-card p-8 flex flex-col min-h-[400px] border-slate-200">
        <div className="w-full mb-8">
          <h3 className="text-[10px] font-bold text-black uppercase tracking-widest">{lang.trend}</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Historical growth</p>
        </div>

        <div className="h-[220px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMonochrome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.08}/>
                  <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 p-2.5 rounded shadow-sm animate-fade-in">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                        <p className="text-xs font-bold text-black">{symbol}{payload[0].value.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#000000" 
                strokeWidth={2} 
                fill="url(#colorMonochrome)" 
                animationDuration={800}
                activeDot={{ r: 4, strokeWidth: 0, fill: '#000000' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
