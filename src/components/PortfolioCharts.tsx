'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = [
  '#6CB7E6', // 咖波藍
  '#F28D95', // 肉墊粉
  '#FAD02E', // 雞肉黃
  '#9EE493', // 鮮草綠
  '#B19CD9', // 芋頭紫
];

const t = {
  en: { allocation: 'Tasty Snaps!', trend: 'Snack Growth', total: 'Net Munch', ratio: 'Ratio' },
  zh: { allocation: '肉肉比例分布', trend: '肉肉增長趨勢', total: '資產淨值', ratio: '配置佔比' }
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
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <circle cx={cx} cy={cy} r={innerRadius - 10} fill={fill} opacity={0.05} />
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
      {/* Allocation Chart */}
      <div className="capoo-card p-12 flex flex-col items-center min-h-[500px]">
        <div className="w-full flex flex-col gap-1 mb-8">
          <h3 className="font-black text-2xl text-primary">{lang.allocation}</h3>
          <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">How yummy is your pile?</p>
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
                innerRadius={80}
                outerRadius={105}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={800}
                animationBegin={100}
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
                      <div className="bg-primary text-white p-4 rounded-3xl shadow-2xl border-none font-black text-xs animate-in zoom-in-95 duration-200">
                        <p className="opacity-70 mb-1">{payload[0].name}</p>
                        <p>{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-32 h-32 flex items-center justify-center">
            {activeIndex !== null ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs font-black text-primary/40 mb-1 truncate max-w-[100px] uppercase">
                  {allocationData[activeIndex].name}
                </p>
                <p className="text-4xl font-black text-primary tracking-tighter">
                  {totalAllocationValue > 0 
                    ? ((allocationData[activeIndex].value / totalAllocationValue) * 100).toFixed(0) 
                    : '0'}<span className="text-sm ml-1">%</span>
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <p className="text-xs font-black text-primary/40 mb-1 uppercase">{lang.ratio}</p>
                <p className="text-4xl font-black text-primary tracking-tighter">100<span className="text-sm ml-1">%</span></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="capoo-card p-12 flex flex-col min-h-[500px]">
        <div className="w-full flex flex-col gap-1 mb-12">
          <h3 className="font-black text-2xl text-primary">
            {lang.trend} <span className="text-xs font-bold text-primary/30 ml-2">({displayCurrency})</span>
          </h3>
          <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">Growth Path Timeline</p>
        </div>

        <div className="h-[280px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6CB7E6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6CB7E6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#E0F2FE" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6CB7E6', fontWeight: 800 }}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-primary text-white p-4 rounded-3xl shadow-2xl border-none font-black text-xs">
                        <p className="opacity-70 mb-1 uppercase">{label}</p>
                        <p>{symbol}{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#6CB7E6" 
                strokeWidth={6} 
                fill="url(#colorValue)" 
                animationDuration={1000}
                dot={{ r: 6, fill: '#6CB7E6', stroke: '#fff', strokeWidth: 4 }}
                activeDot={{ r: 9, fill: '#6CB7E6', stroke: '#fff', strokeWidth: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
