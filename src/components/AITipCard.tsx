'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, RefreshCw, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
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
    desc: 'Intelligent portfolio analysis and strategic optimization.',
    analysis: 'Strategic Analysis',
    risk: 'Risk Level',
    diversification: 'Diversification Score',
    recommendations: 'Actionable Steps',
    ctaButton: 'Generate AI Report',
    loading: 'Analyzing...',
    placeholder: 'Specific question about your assets...',
    ask: 'Custom Query',
    answer: 'AI Report',
  },
  zh: {
    title: 'AI 財務顧問',
    desc: '基於數據的資產優化戰略建議',
    analysis: '戰略分析報告',
    risk: '風險等級',
    diversification: '多樣化評分',
    recommendations: '優化建議',
    ctaButton: '生成 AI 洞察',
    loading: '分析中...',
    placeholder: '輸入關於資產的具體問題...',
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
    if (l.includes('safe') || l.includes('low') || l.includes('低')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (l.includes('medium') || l.includes('moderate') || l.includes('中')) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <Card className="modern-card border-slate-200 bg-white overflow-hidden">
      <CardHeader className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-black">
              <Sparkles className="w-5 h-5" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="ghost" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="text-black hover:bg-slate-100 font-bold text-xs uppercase tracking-widest">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-28 bg-slate-50 border-slate-200 focus:border-black rounded-lg text-sm p-4 transition-all"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button 
                className="w-full lg:w-48 h-28 bg-black hover:bg-slate-800 text-white font-bold rounded-lg flex flex-col gap-3 shadow-sm transition-all"
                onClick={fetchTip}
                disabled={loading || assets.length === 0}
              >
                <div className={cn("p-2.5 rounded-full bg-white/10", loading && "animate-spin")}>
                  {loading ? <RefreshCw className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                </div>
                <span className="text-[10px] tracking-widest uppercase">{loading ? lang.loading : lang.ctaButton}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-fade-in">
            <div className="xl:col-span-5 space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-black uppercase tracking-widest">{lang.answer}</h4>
                <div className="text-base text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-lg border border-slate-100 font-medium italic">
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-lg border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-[10px] font-bold py-1 px-3 rounded w-full justify-center", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-white p-5 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-[10px] font-bold text-black">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-1.5 bg-slate-100" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-xs font-bold flex items-center gap-2 text-black uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  {lang.analysis}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold flex items-center gap-2 text-black uppercase tracking-widest">
                  <TrendingUp className="w-4 h-4" />
                  {lang.recommendations}
                </h4>
                <ul className="space-y-3">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-[11px] flex gap-3 text-slate-600 items-start">
                      <div className="w-5 h-5 rounded bg-slate-100 text-black flex items-center justify-center shrink-0 font-bold text-[10px] border border-slate-200">
                        {i + 1}
                      </div>
                      <span className="pt-0.5 font-medium">{rec}</span>
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
