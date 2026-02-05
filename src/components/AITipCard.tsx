'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, AlertTriangle, PieChart, CheckCircle2, MessageSquare, Send, Zap } from 'lucide-react';
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
    title: 'AI Portfolio Intelligence',
    desc: 'Strategic insights and interactive wealth planning powered by Gemini.',
    analysis: 'Strategic Analysis',
    risk: 'Risk Exposure',
    diversification: 'Diversity Index',
    recommendations: 'Strategic Actions',
    ctaButton: 'Analyze Portfolio',
    loading: 'Generating Strategy...',
    placeholder: 'Ask about rebalancing, returns, or risks...',
    ask: 'Strategic Query',
    answer: 'AI Recommendation',
  },
  zh: {
    title: 'AI 財富顧問',
    desc: '基於 Gemini 的深度資產情報與互動式財務規劃。',
    analysis: '資產配置策略分析',
    risk: '風險暴露等級',
    diversification: '資產多樣性指數',
    recommendations: '策略行動與建議',
    ctaButton: '開始深度分析',
    loading: '正在生成策略報表...',
    placeholder: '詢問如何優化配置、對抗通膨或降低風險...',
    ask: '策略性提問',
    answer: '顧問深度回覆',
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
      console.error('Failed to get insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('low') || l.includes('低') || l.includes('conservative')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (l.includes('medium') || l.includes('中') || l.includes('moderate')) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  return (
    <Card className="neo-card border-none overflow-hidden rounded-[2.5rem] shadow-2xl shadow-slate-200">
      <div className="bg-slate-900 px-10 py-8 text-white relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Zap className="h-24 w-24" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-3 text-2xl font-headline font-bold">
              <Sparkles className="h-6 w-6 text-blue-400" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-white/50 text-xs font-bold uppercase tracking-widest">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="outline" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="text-[10px] h-9 px-5 font-bold uppercase tracking-widest border-white/20 bg-white/5 hover:bg-white/10 hover:text-white transition-all rounded-xl">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              {language === 'en' ? 'Reset Analysis' : '重新分析'}
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-10">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 w-full space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-28 rounded-2xl bg-slate-50 border-slate-200 text-sm p-5 focus:bg-white focus:ring-primary focus:border-primary transition-all shadow-inner"
              />
            </div>
            <Button 
              className="h-28 w-full lg:w-48 rounded-[2rem] bg-slate-900 hover:bg-blue-600 text-white flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-xl group"
              onClick={fetchTip}
              disabled={loading || assets.length === 0}
            >
              <div className={cn("bg-white/10 p-3 rounded-full group-hover:bg-white/20 transition-colors", loading && "animate-spin")}>
                {loading ? <RefreshCw className="h-6 w-6" /> : <Send className="h-6 w-6" />}
              </div>
              <span className="font-bold text-xs uppercase tracking-widest">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="xl:col-span-5 space-y-8">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{lang.answer}</h4>
                <div className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 italic font-medium relative shadow-sm">
                   <MessageSquare className="absolute -top-3 -left-3 h-8 w-8 text-blue-200/50 -rotate-12" />
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-[11px] font-bold py-1 px-3 border-none", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-xs font-bold text-primary">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-2 bg-slate-200" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10 border-slate-100">
              <div className="space-y-5">
                <h4 className="text-sm font-bold flex items-center gap-3 text-slate-900">
                  <div className="bg-blue-100 p-2 rounded-xl"><PieChart className="h-4 w-4 text-blue-600" /></div>
                  {lang.analysis}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-5">
                <h4 className="text-sm font-bold flex items-center gap-3 text-slate-900">
                  <div className="bg-emerald-100 p-2 rounded-xl"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
                  {lang.recommendations}
                </h4>
                <ul className="space-y-4">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs flex gap-3 text-slate-600 items-start group">
                      <div className="h-5 w-5 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] group-hover:bg-primary group-hover:text-white transition-colors">{i+1}</div>
                      <span className="font-medium">{rec}</span>
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
