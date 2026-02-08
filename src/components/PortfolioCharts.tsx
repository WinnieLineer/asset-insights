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
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <circle cx={cx} cy={cy} r={innerRadius - 6} fill={fill} opacity={0.05} />
    </g>
  );
};

// Custom Label with Leader Line
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent, symbol, langCategories }: any) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#94a3b8" strokeWidth={1} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill="#94a3b8" stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={-4} textAnchor={textAnchor} fill="#334155" fontSize={12} fontWeight={800} className="uppercase tracking-widest">
        {langCategories[name] || name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={16} textAnchor={textAnchor} fill="#94a3b8" fontSize={11} fontWeight={700}>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 h-[550px]"><Skeleton className="w-full h-full rounded-2xl" /></div>
        <div className="lg:col-span-8 h-[550px]"><Skeleton className="w-full h-full rounded-2xl" /></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4 modern-card p-10 flex flex-col items-center min-h-[550px] border-slate-100 bg-white relative shadow-xl rounded-2xl overflow-hidden">
        <div className="w-full mb-8">
          <h3 className="text-sm font-bold text-black uppercase tracking-widest">{lang.allocation}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">資產權重分佈與導引</p>
        </div>
        
        <div className="h-[360px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={4}
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
                wrapperStyle={{ zIndex: 1000 }}
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const val = Number(payload[0].value);
                    return (
                      <div className="bg-white border-2 border-slate-100 p-5 rounded-xl shadow-2xl z-[1000] min-w-[180px] pointer-events-none ring-1 ring-black/5 opacity-100 animate-fade-in">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
                          {lang.categories[payload[0].name as keyof typeof lang.categories] || payload[0].name}
                        </p>
                        <p className="text-base font-bold text-black">{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full max-w-[120px]">
            {activeIndex !== null && allocationData[activeIndex] ? (
              <div className="animate-fade-in">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate px-2">
                  {lang.categories[allocationData[activeIndex].name as keyof typeof lang.categories] || allocationData[activeIndex].name}
                </p>
                <p className="text-lg font-bold text-black tracking-tighter mt-1">
                  {((allocationData[activeIndex].value / (totalAllocationValue || 1)) * 100).toFixed(1)}%
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{lang.total}</p>
                <p className="text-lg font-bold text-slate-200 tracking-tighter mt-1">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 modern-card p-10 flex flex-col min-h-[550px] border-slate-100 bg-white relative shadow-xl rounded-2xl">
        <div className="w-full mb-8">
          <h3 className="text-sm font-bold text-black uppercase tracking-widest">{lang.trend}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">歷史累積價值演變軸</p>
        </div>

        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#cbd5e1', fontWeight: 600 }} tickFormatter={(v) => `${symbol}${(v/1000).toFixed(0)}k`} />
              <RechartsTooltip 
                wrapperStyle={{ zIndex: 1000 }}
                cursor={{ fill: '#f8fafc', opacity: 0.5 }}
                content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white border-2 border-slate-100 p-6 rounded-xl shadow-2xl z-[1000] min-w-[240px] pointer-events-none ring-1 ring-black/5 opacity-100">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                        </div>
                        <div className="space-y-2.5">
                          {payload.map((p: any, i: number) => {
                            if (p.dataKey === 'totalValue' || !p.value) return null;
                            return (
                              <div key={i} className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    {lang.categories[p.name as keyof typeof lang.categories] || p.name}
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-black">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                            );
                          })}
                          <div className="mt-4 pt-4 border-t-2 border-slate-50 flex justify-between items-center">
                            <span className="text-xs font-bold text-black uppercase tracking-widest">{lang.total}</span>
                            <span className="text-sm font-bold text-black">{symbol}{Number(payload.find((p:any)=>p.dataKey==='totalValue')?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" align="right" iconType="circle"
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-end gap-x-6 gap-y-2 mb-8">
                    {payload?.map((entry: any, index: number) => (
                      <div key={`item-${index}`} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.categories[entry.value as keyof typeof lang.categories] || entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {CATEGORIES.map((cat, i) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[i % COLORS.length]} barSize={10} radius={i === 0 ? [0, 0, 2, 2] : [0, 0, 0, 0]} />
              ))}
              <Line type="monotone" dataKey="totalValue" stroke="#000000" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#000000', stroke: '#fff', strokeWidth: 2 }} />
              <Brush dataKey="displayDate" height={30} stroke="#000000" fill="#f8fafc" travellerWidth={10} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
