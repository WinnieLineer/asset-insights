'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = [
  '#00f5ff', // Cyber Cyan
  '#7000ff', // Electric Purple
  '#00ff9d', // Neon Green
  '#ff0055', // Matrix Pink
  '#006eff', // Deep Blue
];

const t = {
  en: { allocation: 'Asset Distribution', trend: 'Portfolio Evolution', total: 'Net Value', ratio: 'Ratio' },
  zh: { allocation: '資產配置比例', trend: '投資組合演化', total: '淨資產', ratio: '配置比' }
};

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
      />
      <circle cx={cx} cy={cy} r={innerRadius - 6} fill={fill} opacity={0.05} />
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
    displayDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    totalValue: convert(d.totalTWD)
  }));

  const totalAllocationValue = useMemo(() => {
    return allocationData.reduce((acc, curr) => acc + curr.value, 0);
  }, [allocationData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="pro-card p-10 flex flex-col items-center min-h-[420px] rounded-2xl">
        <div className="w-full mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">{lang.allocation}</h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Matrix composition analysis</p>
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
                      <div className="bg-card/90 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-2xl">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{payload[0].name}</p>
                        <p className="text-base font-bold text-white">{symbol}{val.toLocaleString()}</p>
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
                <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-1 truncate max-w-[100px] mx-auto">
                  {allocationData[activeIndex].name}
                </p>
                <p className="text-3xl font-bold text-white tracking-tighter">
                  {((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(0)}%
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">{lang.ratio}</p>
                <p className="text-3xl font-bold text-white/40 tracking-tighter">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pro-card p-10 flex flex-col min-h-[420px] rounded-2xl">
        <div className="w-full mb-10">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">{lang.trend}</h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Growth progression logs</p>
        </div>

        <div className="h-[240px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#666', fontWeight: 700 }}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card/90 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-2xl">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                        <p className="text-base font-bold text-primary">{symbol}{payload[0].value.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#00f5ff" 
                strokeWidth={2} 
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