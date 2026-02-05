'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, RefreshCw, ChevronRight, ShieldCheck, TrendingUp, Sparkles, LayoutPanelLeft } from 'lucide-react';
import { getFinancialTip, type FinancialTipOutput } from '@/ai/flows/financial-tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface AssetDetail {
  name: string;
  symbol: string;
  category: string;
  amount: number;
  currency: string;
  price?: number;
  valueInTWD: number;
}

interface AITipCardProps {
  assets: AssetDetail[];
  totalTWD: number;
  marketConditions: string;
  language: 'en' | 'zh';
}

const t = {
  en: {
    title: 'AI Financial Advisor',
    desc: 'Intelligent portfolio analysis and personalized strategic guidance.',
    analysis: 'Strategic Analysis',
    risk: 'Portfolio Risk Level',
    diversification: 'Diversification Score',
    recommendations: 'Actionable Recommendations',
    ctaButton: 'Generate AI Insight',
    loading: 'Analyzing Portfolio...',
    placeholder: 'Ask a specific question about your assets (e.g., "Is my portfolio too tech-heavy?")...',
    ask: 'Custom Query',
    answer: 'AI Analysis Report',
  },
  zh: {
    title: 'AI 財務智庫',
    desc: '基於大數據與市場動態的個人化資產分析建議',
    analysis: '核心戰略分析',
    risk: '投資組合風險等級',
    diversification: '多樣化評分',
    recommendations: '具體優化建議',
    ctaButton: '生成 AI 洞察',
    loading: '正在分析投資組合...',
    placeholder: '輸入關於資產的具體問題（例如：「我的科技股佔比是否過高？」）...',
    ask: '自定義查詢',
    answer: 'AI 分析報告',
  }
};

export function AITipCard({ assets, totalTWD, marketConditions, language }: AITipCardProps) {
  const [insight, setInsight] = useState<FinancialTipOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const lang = t[language];

  const fetchTip = async () => {
    if (assets.length === 0) return;
    setLoading(true);
    try {
      const response = await getFinancialTip({ 
        assets, 
        totalTWD, 
        marketConditions, 
        language,
        userQuestion: question || undefined
      });
      setInsight(response);
    } catch (error) {
      console.error('Analysis failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('safe') || l.includes('low') || l.includes('低') || l.includes('安全')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (l.includes('medium') || l.includes('moderate') || l.includes('中')) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <Card className="modern-card border-none bg-white overflow-hidden shadow-xl shadow-slate-200/50">
      <CardHeader className="px-10 py-8 border-b border-slate-50 bg-slate-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="ghost" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="text-indigo-600 hover:bg-indigo-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              重新分析
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-10">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-32 bg-slate-50 border-slate-100 focus:border-indigo-300 rounded-xl text-base p-5 transition-all shadow-inner"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button 
                className="w-full lg:w-56 h-32 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex flex-col gap-3 shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1"
                onClick={fetchTip}
                disabled={loading || assets.length === 0}
              >
                <div className={cn("p-3 rounded-full bg-white/10", loading && "animate-spin")}>
                  {loading ? <RefreshCw className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                </div>
                <span className="text-sm tracking-tight">{loading ? lang.loading : lang.ctaButton}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 animate-in fade-in duration-700">
            <div className="xl:col-span-5 space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{lang.answer}</h4>
                <div className="text-lg text-slate-800 leading-relaxed bg-indigo-50/50 p-8 rounded-2xl border border-indigo-100 font-medium italic shadow-sm">
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-xs font-bold py-1.5 px-4 rounded-full w-full justify-center", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-xs font-bold text-indigo-600">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-2 bg-slate-100 rounded-full" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  {lang.analysis}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  {lang.recommendations}
                </h4>
                <ul className="space-y-4">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs flex gap-4 text-slate-600 items-start">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-[10px] border border-indigo-100">
                        {i + 1}
                      </div>
                      <span className="pt-1 font-medium leading-normal">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}