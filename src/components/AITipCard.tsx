'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Cpu, RefreshCw, AlertCircle, TrendingUp, ShieldCheck, Zap, BrainCircuit, Terminal } from 'lucide-react';
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
    title: 'Nexus Intelligence',
    desc: 'Autonomous financial matrix analysis and predictive guidance.',
    analysis: 'System Vulnerability Assessment',
    risk: 'Risk Vector Classification',
    diversification: 'Composition Entropy',
    recommendations: 'Strategic Optimization Protocols',
    ctaButton: 'Initialize Insight',
    loading: 'Processing matrix data...',
    placeholder: 'Input custom parameters or queries for deep analysis...',
    ask: 'Custom Query',
    answer: 'Nexus Protocol Decree',
  },
  zh: {
    title: 'Nexus Intelligence',
    desc: '自主化財務矩陣分析與預測性導引',
    analysis: '系統性脆弱度評估',
    risk: '風險向量分級',
    diversification: '結構熵值指數',
    recommendations: '戰略優化協議',
    ctaButton: '初始化數據洞察',
    loading: '正在處理矩陣數據...',
    placeholder: '輸入自定義參數或查詢以進行深度分析...',
    ask: '自定義查詢',
    answer: 'Nexus 協議決議',
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
      console.error('Core failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('safe') || l.includes('low') || l.includes('低') || l.includes('安全')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (l.includes('medium') || l.includes('moderate') || l.includes('中')) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
  };

  return (
    <Card className="pro-card border-none overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <BrainCircuit className="w-64 h-64 text-primary" />
      </div>

      <CardHeader className="p-10 border-b border-border/40 bg-secondary/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <Terminal className="w-6 h-6 text-primary" />
              <span className="nexus-gradient">{lang.title}</span>
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="outline" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="h-9 px-4 text-[11px] font-bold tracking-widest uppercase border-primary/30 text-primary hover:bg-primary/10 rounded-full">
              <RefreshCw className="h-3 w-3 mr-2" />
              Reset Matrix
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-10">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            <div className="flex-1 space-y-4">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-40 bg-secondary/30 border-border/50 focus:border-primary/50 text-base font-medium rounded-xl p-6 transition-all"
              />
            </div>
            <Button 
              className="w-full lg:w-60 bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex flex-col items-center justify-center gap-4 group rounded-xl"
              onClick={fetchTip}
              disabled={loading || assets.length === 0}
            >
              <div className={cn("p-4 rounded-full bg-white/10", loading && "animate-spin")}>
                {loading ? <RefreshCw className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
              </div>
              <span className="text-[11px] uppercase tracking-widest">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 animate-in fade-in duration-700">
            <div className="xl:col-span-5 space-y-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">{lang.answer}</h4>
                <div className="text-lg text-white leading-relaxed bg-secondary/30 p-8 rounded-xl border border-primary/20 font-medium italic">
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-secondary/20 p-6 rounded-xl border border-border/40">
                  <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-xs font-bold py-2 px-4 rounded-full w-full justify-center tracking-wide", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-secondary/20 p-6 rounded-xl border border-border/40">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-xs font-bold text-primary">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-1.5 bg-white/5 rounded-full" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-sm font-bold flex items-center gap-3 text-white uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  {lang.analysis}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-bold flex items-center gap-3 text-white uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {lang.recommendations}
                </h4>
                <ul className="space-y-4">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs flex gap-4 text-muted-foreground items-start">
                      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] border border-primary/20">
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