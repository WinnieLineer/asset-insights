
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, AlertTriangle, PieChart, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { getFinancialTip, type FinancialTipOutput } from '@/ai/flows/financial-tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
    title: 'AI Wealth Advisor',
    desc: 'Deep portfolio intelligence and interactive financial planning.',
    analysis: 'Allocation Strategy',
    risk: 'Risk Profile',
    diversification: 'Diversity Score',
    recommendations: 'Strategic Actions',
    ctaTitle: 'Smart Consultant',
    ctaButton: 'Generate Analysis',
    loading: 'Generating Insights...',
    placeholder: 'Ask me anything: "How can I improve my yield?" or "Is my risk too high?"',
    ask: 'Strategic Question',
    answer: 'Advisor Response',
  },
  zh: {
    title: 'AI 財富顧問',
    desc: '深度資產情報與互動式財務規劃建議。',
    analysis: '資產配置策略',
    risk: '風險概況',
    diversification: '配置多樣性',
    recommendations: '策略行動建議',
    ctaTitle: '智慧諮詢',
    ctaButton: '開始深度分析',
    loading: '正在生成分析報告...',
    placeholder: '詢問任何問題：例如「我該如何提升收益？」或「風險是否過高？」',
    ask: '策略性提問',
    answer: '顧問回覆',
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
    if (l.includes('low') || l.includes('低') || l.includes('conservative')) return 'bg-green-100 text-green-700 border-green-200';
    if (l.includes('medium') || l.includes('中') || l.includes('moderate')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <Card className="neo-card border-none bg-white shadow-2xl shadow-blue-900/5 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 p-8 border-b border-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-3 text-blue-600 font-headline text-2xl">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              {lang.title}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="outline" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'en' ? 'New Analysis' : '重新分析'}
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-8">
        {!insight ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-9 space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                {lang.ask}
              </label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-24 rounded-[1.5rem] bg-slate-50 border-none focus-visible:ring-blue-200 text-base p-5 transition-all"
              />
            </div>
            <div className="lg:col-span-3">
              <Button 
                className="w-full h-24 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                onClick={fetchTip}
                disabled={loading || assets.length === 0}
              >
                {loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                <span className="font-bold">{loading ? lang.loading : lang.ctaButton}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Answer Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {lang.answer}
                </h4>
                <div className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 italic shadow-inner">
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">{lang.risk}</h4>
                  <Badge variant="outline" className={`text-[10px] font-bold py-1 px-3 border-none rounded-lg ${getRiskColor(insight.riskLevel)}`}>
                    <AlertTriangle className="h-3 w-3 mr-1.5" />
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase">{lang.diversification}</h4>
                    <span className="text-xs font-bold text-blue-600">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-2 bg-slate-200" />
                </div>
              </div>
            </div>

            {/* Analysis & Recs Column */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <div className="bg-indigo-100 p-2 rounded-lg"><PieChart className="h-4 w-4 text-indigo-600" /></div>
                  {lang.analysis}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <div className="bg-green-100 p-2 rounded-lg"><CheckCircle2 className="h-4 w-4 text-green-600" /></div>
                  {lang.recommendations}
                </h4>
                <ul className="space-y-4">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex gap-3 text-slate-600 group items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors font-bold text-[10px]">{i+1}</div>
                      {rec}
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
