'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, AlertTriangle, PieChart, CheckCircle2, MessageSquare, Send, Leaf } from 'lucide-react';
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
    title: 'Calm Advisor',
    desc: 'Strategic insights with a touch of Zen intelligence.',
    analysis: 'Portfolio Balance Analysis',
    risk: 'Exposure Level',
    diversification: 'Balance Index',
    recommendations: 'Mindful Actions',
    ctaButton: 'Seek Guidance',
    loading: 'Meditating on data...',
    placeholder: 'Ask about balance, focus, or risk management...',
    ask: 'Strategic Query',
    answer: 'Insightful Response',
  },
  zh: {
    title: '靜謐財富顧問',
    desc: '融合智慧與寂靜美學的深度資產洞察。',
    analysis: '資產動態平衡分析',
    risk: '風險暴露水位',
    diversification: '配置平衡指數',
    recommendations: '建議調整方向',
    ctaButton: '尋求智慧啟發',
    loading: '正在沈思數據中...',
    placeholder: '詢問如何優化配置、對抗波動或長期規劃...',
    ask: '深度諮詢',
    answer: '顧問深度觀點',
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
    if (l.includes('low') || l.includes('低') || l.includes('conservative')) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (l.includes('medium') || l.includes('中') || l.includes('moderate')) return 'bg-amber-50 text-amber-800 border-amber-100';
    return 'bg-red-50 text-red-800 border-red-100';
  };

  return (
    <Card className="wabi-card border-none overflow-hidden shadow-2xl shadow-slate-200/50">
      <div className="bg-slate-800 px-12 py-10 text-white relative">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Leaf className="h-32 w-32" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-4 text-3xl font-headline font-bold">
              <Sparkles className="h-7 w-7 text-slate-400" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="outline" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="text-[10px] h-10 px-6 font-bold uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all rounded-2xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Reset Session' : '開啟新諮詢'}
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-12">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 w-full space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] px-1">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-32 rounded-[1.5rem] bg-slate-50 border-slate-200/60 text-base p-6 focus:bg-white focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>
            <Button 
              className="h-32 w-full lg:w-56 rounded-[2rem] bg-slate-800 hover:bg-slate-700 text-white flex flex-col items-center justify-center gap-4 transition-all shadow-xl group"
              onClick={fetchTip}
              disabled={loading || assets.length === 0}
            >
              <div className={cn("p-4 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors", loading && "animate-spin")}>
                {loading ? <RefreshCw className="h-7 w-7" /> : <Send className="h-7 w-7" />}
              </div>
              <span className="font-bold text-[10px] uppercase tracking-[0.2em]">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="xl:col-span-5 space-y-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{lang.answer}</h4>
                <div className="text-base text-slate-700 leading-relaxed bg-slate-50 p-8 rounded-[2rem] border border-slate-200/50 italic font-medium relative">
                   <MessageSquare className="absolute -top-4 -left-4 h-10 w-10 text-slate-200/60 -rotate-12" />
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-[12px] font-bold py-1.5 px-4 border-none", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-sm font-bold text-primary">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-2.5 bg-slate-200" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-base font-bold flex items-center gap-4 text-slate-800">
                  <div className="bg-slate-100 p-2.5 rounded-2xl"><PieChart className="h-5 w-5 text-slate-500" /></div>
                  {lang.analysis}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-base font-bold flex items-center gap-4 text-slate-800">
                  <div className="bg-slate-100 p-2.5 rounded-2xl"><CheckCircle2 className="h-5 w-5 text-slate-500" /></div>
                  {lang.recommendations}
                </h4>
                <ul className="space-y-5">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex gap-4 text-slate-600 items-start group">
                      <div className="h-6 w-6 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px] group-hover:bg-slate-800 group-hover:text-white transition-colors">{i+1}</div>
                      <span className="font-medium pt-0.5">{rec}</span>
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