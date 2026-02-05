'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, AlertTriangle, PieChart, CheckCircle2, MessageSquare, Send, Cat, Star } from 'lucide-react';
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
    title: 'Capoo Advisor',
    desc: 'The hungriest financial advice you\'ll ever get!',
    analysis: 'Snack Balance Analysis',
    risk: 'Danger Level!',
    diversification: 'Tasty Mix Index',
    recommendations: 'Capoo\'s Ideas',
    ctaButton: 'Ask Capoo!',
    loading: 'Capoo is thinking (and hungry)...',
    placeholder: 'Ask Capoo anything about your snacks!',
    ask: 'Strategic Munching',
    answer: 'Capoo Says',
  },
  zh: {
    title: '咖波財富小助手',
    desc: '最愛吃肉肉的理財建議！肉肉越多越好！',
    analysis: '肉肉配置平衡分析',
    risk: '危險程度！',
    diversification: '肉肉多樣性指數',
    recommendations: '咖波的建議清單',
    ctaButton: '問問咖波！',
    loading: '咖波正在沈思（好想吃肉）...',
    placeholder: '想問咖波關於肉肉資產的什麼事？',
    ask: '深度諮詢肉肉',
    answer: '咖波的小秘密',
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
    if (l.includes('low') || l.includes('低') || l.includes('conservative')) return 'bg-emerald-100 text-emerald-800 border-none';
    if (l.includes('medium') || l.includes('中') || l.includes('moderate')) return 'bg-amber-100 text-amber-800 border-none';
    return 'bg-red-100 text-red-800 border-none';
  };

  return (
    <Card className="capoo-card border-none overflow-hidden">
      <div className="bg-primary px-12 py-10 text-white relative">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none animate-wiggle">
          <Cat className="h-32 w-32" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-4 text-4xl font-black">
              <Sparkles className="h-8 w-8 text-accent" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-white/60 text-sm font-bold uppercase tracking-widest">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="outline" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="h-12 px-8 font-black uppercase tracking-widest bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full">
              <RefreshCw className="h-5 w-5 mr-2" />
              {language === 'en' ? 'Another Question!' : '再問一個！'}
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-12">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 w-full space-y-4">
              <label className="text-xs font-black text-primary uppercase tracking-widest px-1">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-40 rounded-[2rem] bg-primary/5 border-4 border-primary/10 text-lg p-8 focus:bg-white focus:border-primary transition-all font-bold"
              />
            </div>
            <Button 
              className="h-40 w-full lg:w-64 rounded-[3rem] bg-primary hover:bg-primary/90 text-white flex flex-col items-center justify-center gap-4 transition-all shadow-2xl bouncy-button group"
              onClick={fetchTip}
              disabled={loading || assets.length === 0}
            >
              <div className={cn("p-6 bg-white/10 rounded-full group-hover:bg-white/20", loading && "animate-spin")}>
                {loading ? <RefreshCw className="h-10 w-10" /> : <Send className="h-10 w-10" />}
              </div>
              <span className="font-black text-xs uppercase tracking-widest">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="xl:col-span-5 space-y-10">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-primary uppercase tracking-widest">{lang.answer}</h4>
                <div className="text-lg text-slate-700 leading-relaxed bg-primary/5 p-10 rounded-[3rem] border-4 border-primary/10 font-black relative">
                   <MessageSquare className="absolute -top-6 -left-6 h-12 w-12 text-primary/20 -rotate-12" />
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-primary/5 p-8 rounded-[2rem] border-4 border-primary/5 shadow-inner">
                  <h4 className="text-xs font-black text-primary/40 uppercase tracking-widest mb-4">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-sm font-black py-2 px-6 rounded-full border-none", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-primary/5 p-8 rounded-[2rem] border-4 border-primary/5 shadow-inner">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-black text-primary/40 uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-base font-black text-primary">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-4 bg-primary/10" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-xl font-black flex items-center gap-4 text-primary">
                  <div className="bg-primary/10 p-4 rounded-3xl"><PieChart className="h-6 w-6" /></div>
                  {lang.analysis}
                </h4>
                <p className="text-base text-slate-500 leading-relaxed font-bold">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-xl font-black flex items-center gap-4 text-primary">
                  <div className="bg-primary/10 p-4 rounded-3xl"><CheckCircle2 className="h-6 w-6" /></div>
                  {lang.recommendations}
                </h4>
                <ul className="space-y-6">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-base flex gap-4 text-slate-600 items-start group">
                      <div className="h-10 w-10 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 font-black text-sm group-hover:scale-110 transition-transform">
                        <Star className="h-5 w-5 fill-current" />
                      </div>
                      <span className="font-bold pt-1">{rec}</span>
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
