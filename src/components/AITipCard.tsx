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
    title: 'AI Portfolio Advisor',
    desc: 'Intelligent financial insights and strategic planning.',
    analysis: 'Allocation Strategy',
    risk: 'Risk Profile',
    diversification: 'Diversity Score',
    recommendations: 'Strategic Actions',
    ctaButton: 'Generate Analysis',
    loading: 'Analyzing...',
    placeholder: 'Ask me anything about your portfolio...',
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
    ctaButton: '開始分析',
    loading: '正在生成分析報告...',
    placeholder: '詢問任何問題，例如「我該如何提升收益？」...',
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
    if (l.includes('low') || l.includes('低') || l.includes('conservative')) return 'bg-green-50 text-green-700 border-green-100';
    if (l.includes('medium') || l.includes('中') || l.includes('moderate')) return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  return (
    <Card className="neo-card border-none overflow-hidden">
      <div className="bg-slate-50 p-6 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-primary text-xl">
              <Sparkles className="h-5 w-5" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs font-medium">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="ghost" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="text-xs h-8">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              {language === 'en' ? 'New Analysis' : '重新分析'}
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-8">
        {!insight ? (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-20 rounded-xl bg-slate-50/50 border-slate-200 text-sm p-4 focus:bg-white transition-colors"
              />
            </div>
            <Button 
              className="h-20 w-full md:w-32 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex flex-col items-center justify-center gap-2"
              onClick={fetchTip}
              disabled={loading || assets.length === 0}
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span className="font-bold text-xs">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">{lang.answer}</h4>
                <div className="text-sm text-slate-700 leading-relaxed bg-primary/5 p-5 rounded-2xl border border-primary/10 italic">
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-2">{lang.risk}</h4>
                  <Badge variant="outline" className={`text-[10px] font-bold py-0.5 px-2 border-none ${getRiskColor(insight.riskLevel)}`}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase">{lang.diversification}</h4>
                    <span className="text-[10px] font-bold text-primary">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-1.5 bg-slate-200" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 border-l border-slate-50 pl-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold flex items-center gap-2 text-slate-900">
                  <div className="bg-slate-100 p-1.5 rounded-lg"><PieChart className="h-4 w-4 text-slate-600" /></div>
                  {lang.analysis}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold flex items-center gap-2 text-slate-900">
                  <div className="bg-slate-100 p-1.5 rounded-lg"><CheckCircle2 className="h-4 w-4 text-slate-600" /></div>
                  {lang.recommendations}
                </h4>
                <ul className="space-y-3">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs flex gap-2 text-slate-600 items-start">
                      <div className="h-4 w-4 rounded bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[9px]">{i+1}</div>
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