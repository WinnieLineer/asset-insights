'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend, Brush
} from 'recharts';
import { AssetCategory, Currency } from '@/app/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#000000', '#27272a', '#52525b', '#a1a1aa'];
const CATEGORIES: AssetCategory[] = ['Stock', 'Crypto', 'Bank', 'Savings'];
const SYMBOLS: Record<Currency, string> = { TWD: 'NT$', USD: '$', CNY: '¥', SGD: 'S$' };

const t = {
  en: { 
    allocation: 'Portfolio Allocation', 
    trend: 'Asset Evolution Matrix', 
    total: 'Total Portfolio', 
    categories: { 'Stock': 'Equity', 'Crypto': 'Crypto', 'Bank': 'Other', 'Savings': 'Deposit' }
  },
  zh: { 
    allocation: '當前資產配置比例', 
    trend: '歷史資產演變走勢', 
    total: '投資組合總計', 
    categories: { 'Stock': '股票', 'Crypto': '加密貨幣', 'Bank': '其他資產', 'Savings': '存款' }
  }
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
        className="transition-all duration-300"
      />
      <circle cx={cx} cy={cy} r={innerRadius - 10} fill={fill} opacity={0.03} />
    </g>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent, symbol, langCategories }: any) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  const labelRadius = outerRadius + 20;
  const sx = cx + (outerRadius + 8) * cos;
  const sy = cy + (outerRadius + 8) * sin;
  const mx = cx + labelRadius * cos;
  const my = cy + labelRadius * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 35; 
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#e2e8f0" strokeWidth={1.5} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill="#000" stroke="none" />
      <text 
        x={ex + (cos >= 0 ? 1 : -1) * 8} 
        y={ey} 
        dy={-4} 
        textAnchor={textAnchor} 
        fill="#000" 
        fontSize={10} 
        fontWeight={800} 
        className="uppercase tracking-[0.1em]"
      >
        {langCategories[name] || name}
      </text>
      <text 
        x={ex + (cos >= 0 ? 1 : -1) * 8} 
        y={ey} 
        dy={14} 
        textAnchor={textAnchor} 
        fill="#94a3b8" 
        fontSize={9} 
        fontWeight={700}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export function PortfolioCharts({ allocationData, historicalData, displayCurrency, language, loading }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';
  
  const totalAllocationValue = useMemo(() => allocationData.reduce((acc: number, curr: any) => acc + curr.value, 0), [allocationData]);

  if (loading && historicalData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-4 min-h-[500px]"><Skeleton className="w-full h-full rounded-2xl" /></div>
        <div className="lg:col-span-8 min-h-[500px]"><Skeleton className="w-full h-full rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-stretch">
      <div className="lg:col-span-4 modern-card p-6 flex flex-col items-center border-slate-100 bg-white relative shadow-xl rounded-2xl overflow-hidden h-full">
        <div className="w-full mb-6">
          <h3 className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest">{lang.allocation}</h3>
        </div>
        
        <div className="h-full min-h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <Pie
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={6}
                dataKey="value"
                stroke="transparent"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                label={(props) => renderCustomLabel({ ...props, symbol, langCategories: lang.categories })}
                labelLine={false}
              >
                {allocationData.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip 
                wrapperStyle={{ zIndex: 1000, opacity: 1 }}
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const val = Number(payload[0].value);
                    return (
                      <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xl z-[1000] min-w-[180px] pointer-events-none opacity-100 ring-4 ring-black/5">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2 border-b border-slate-50 pb-1">
                          {lang.categories[payload[0].name as keyof typeof lang.categories] || payload[0].name}
                        </p>
                        <p className="text-base font-black text-black tracking-tight">{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full max-w-[100px]">
            {activeIndex !== null && allocationData[activeIndex] ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] truncate px-2">
                  {lang.categories[allocationData[activeIndex].name as keyof typeof lang.categories] || allocationData[activeIndex].name}
                </p>
                <p className="text-lg font-black text-black tracking-tighter mt-1">
                  {((allocationData[activeIndex].value / (totalAllocationValue || 1)) * 100).toFixed(1)}%
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <p className="text-[8px] font-black text-slate-200 uppercase tracking-[0.2em]">{lang.total}</p>
                <p className="text-lg font-black text-slate-100 tracking-tighter mt-1">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 modern-card p-6 flex flex-col border-slate-100 bg-white relative shadow-xl rounded-2xl h-full">
        <div className="w-full mb-6">
          <h3 className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest">{lang.trend}</h3>
        </div>

        <div className="flex-1 min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f8fafc" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#cbd5e1', fontWeight: 700 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#e2e8f0', fontWeight: 600 }} 
                tickFormatter={(v) => `${symbol}${(v/1000).toFixed(0)}k`} 
              />
              <RechartsTooltip 
                wrapperStyle={{ zIndex: 1000, opacity: 1 }}
                cursor={{ fill: '#f8fafc', opacity: 0.6 }}
                content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-2xl z-[1000] min-w-[220px] pointer-events-none opacity-100 ring-8 ring-black/5">
                        <div className="flex justify-between items-center mb-3 pb-1.5 border-b border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                        </div>
                        <div className="space-y-2">
                          {payload.map((p: any, i: number) => {
                            if (p.dataKey === 'totalValue' || !p.value) return null;
                            return (
                              <div key={i} className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    {lang.categories[p.name as keyof typeof lang.categories] || p.name}
                                  </span>
                                </div>
                                <span className="text-xs font-black text-black">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                            );
                          })}
                          <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">{lang.total}</span>
                            <span className="text-base font-black text-black">{symbol}{Number(payload.find((p:any)=>p.dataKey==='totalValue')?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 mb-6">
                    {payload?.map((entry: any, index: number) => (
                      <div key={`item-${index}`} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang.categories[entry.value as keyof typeof lang.categories] || entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {CATEGORIES.map((cat, i) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[i % COLORS.length]} barSize={10} radius={i === 0 ? [0, 0, 2, 2] : [0, 0, 0, 0]} />
              ))}
              <Line 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#000000" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 4, fill: '#000000', stroke: '#fff', strokeWidth: 1.5 }} 
              />
              <Brush 
                dataKey="displayDate" 
                height={25} 
                stroke="#e2e8f0" 
                fill="#f8fafc" 
                travellerWidth={10} 
                className="font-bold text-[9px] recharts-brush"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
