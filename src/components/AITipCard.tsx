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
    title: 'AI Financial Advisor',
    desc: 'Ask questions or get an automated analysis of your portfolio.',
    analysis: 'Portfolio Analysis',
    risk: 'Risk Assessment',
    diversification: 'Diversification Score',
    recommendations: 'Actionable Advice',
    ctaTitle: 'Interactive Advisor',
    ctaDesc: 'Ask about your 10% yield goal or asset allocation.',
    ctaButton: 'Analyze Portfolio',
    loading: 'Analyzing...',
    placeholder: 'e.g., How can I reach a 10% annual return with my current assets?',
    ask: 'Ask a question...',
    answer: 'AI Response',
  },
  zh: {
    title: 'AI 財務顧問',
    desc: '您可以詢問特定問題，或獲取資產配置深度分析。',
    analysis: '資產配置分析',
    risk: '風險評估',
    diversification: '配置多樣性',
    recommendations: '行動建議',
    ctaTitle: '互動式顧問',
    ctaDesc: '您可以詢問：「如何達成 10% 年收益？」或配置問題。',
    ctaButton: '開始深度分析',
    loading: '分析中...',
    placeholder: '例如：我該如何調整部位以達成年收益 10%？',
    ask: '提問...',
    answer: 'AI 回覆',
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
    <Card className="border-accent/20 bg-accent/5 overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-accent font-headline text-lg md:text-xl">
            <Sparkles className="h-5 w-5" />
            {lang.title}
          </CardTitle>
          {insight && (
            <Button variant="ghost" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="hover:bg-accent/10 text-accent">
              <RefreshCw className="h-4 w-4 mr-1" />
              {language === 'en' ? 'Reset' : '重設'}
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">{lang.desc}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {!insight ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <MessageSquare className="h-3 w-3" />
                {lang.ask}
              </label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-24 bg-white/80 border-accent/20 focus-visible:ring-accent"
              />
            </div>
            <Button 
              className="w-full bg-accent hover:bg-accent/90 text-white flex items-center gap-2"
              onClick={fetchTip}
              disabled={loading || assets.length === 0}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? lang.loading : lang.ctaButton}
            </Button>
            {assets.length === 0 && (
              <p className="text-[10px] text-center text-destructive">
                {language === 'en' ? 'Add assets first to analyze.' : '請先新增資產以供分析。'}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-4">
            {/* Direct Answer */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-accent">
                <MessageSquare className="h-4 w-4" />
                {lang.answer}
              </h4>
              <div className="text-sm text-foreground leading-relaxed bg-white p-4 rounded-xl border border-accent/10 shadow-sm italic">
                "{insight.answer}"
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                {lang.analysis}
              </h4>
              <p className="text-xs text-foreground/80 leading-relaxed bg-white/50 p-3 rounded-lg border border-accent/10">
                {insight.analysis}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase">{lang.risk}</h4>
                <Badge variant="outline" className={`text-[10px] py-0 px-2 ${getRiskColor(insight.riskLevel)}`}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {insight.riskLevel}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase">{lang.diversification}</h4>
                  <span className="text-[10px] font-bold">{insight.diversificationScore}%</span>
                </div>
                <Progress value={insight.diversificationScore} className="h-1.5" />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {lang.recommendations}
              </h4>
              <ul className="space-y-2">
                {insight.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs flex gap-2 text-foreground/70 items-start">
                    <span className="text-accent mt-0.5 font-bold">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs border-accent/30 text-accent hover:bg-accent/5"
              onClick={() => setInsight(null)}
            >
              {language === 'en' ? 'Ask another question' : '詢問其他問題'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
