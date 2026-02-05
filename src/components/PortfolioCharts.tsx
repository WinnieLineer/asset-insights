
'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = [
  '#4ade80', // Scout Green
  '#92400e', // Leather Brown
  '#b91c1c', // Titan Blood
  '#78350f', // Dark Leather
  '#15803d', // Forest Green
];

const t = {
  en: { allocation: 'Territory Distribution', trend: 'Reclamation Progress', total: 'Net Worth', ratio: 'Ratio' },
  zh: { allocation: '領土分佈比例', trend: '奪還領土進度', total: '總戰略資產', ratio: '配置比例' }
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 15}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <circle cx={cx} cy={cy} r={innerRadius - 10} fill={fill} opacity={0.1} />
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
    <>
      <div className="titan-panel p-10 flex flex-col items-center min-h-[500px]">
        <div className="w-full mb-8">
          <h3 className="wall-header text-xl">{lang.allocation}</h3>
          <p className="text-[10px] text-primary/40 font-bold uppercase tracking-[0.4em] mt-1">Strategic Formation Analysis</p>
        </div>
        
        <div className="h-[320px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={75}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="#000"
                strokeWidth={2}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
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
                      <div className="bg-black/90 border border-primary/40 p-3 rounded-none text-[10px] font-black uppercase text-primary">
                        <p className="opacity-60">{payload[0].name}</p>
                        <p className="text-white text-base">{symbol}{val.toLocaleString()}</p>
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
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1 truncate max-w-[80px]">
                  {allocationData[activeIndex].name}
                </p>
                <p className="text-3xl font-black text-white tracking-tighter">
                  {((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(0)}%
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[8px] font-black text-primary/40 uppercase tracking-[0.2em] mb-1">{lang.ratio}</p>
                <p className="text-3xl font-black text-white tracking-tighter">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="titan-panel p-10 flex flex-col min-h-[500px]">
        <div className="w-full mb-12">
          <h3 className="wall-header text-xl">{lang.trend}</h3>
          <p className="text-[10px] text-primary/40 font-bold uppercase tracking-[0.4em] mt-1">Territory Expansion Records</p>
        </div>

        <div className="h-[280px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#4ade80', fontWeight: 900 }}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-black/90 border border-primary/40 p-3 rounded-none text-[10px] font-black uppercase text-primary">
                        <p className="opacity-60">{label}</p>
                        <p className="text-white text-base">{symbol}{payload[0].value.toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="stepAfter" 
                dataKey="totalValue" 
                stroke="#4ade80" 
                strokeWidth={3} 
                fill="url(#colorValue)" 
                animationDuration={1200}
                dot={{ r: 4, fill: '#4ade80' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
