
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Shield, RefreshCw, Skull, Map, Flag, MessageSquare, Send, Crosshair, Star } from 'lucide-react';
import { getFinancialTip, type FinancialTipOutput } from '@/ai/flows/financial-tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
    title: 'Commander Erwin\'s Briefing',
    desc: 'Strategic commands for the final reclaimed territory.',
    analysis: 'Wall Structural Analysis',
    risk: 'Titan Threat Level',
    diversification: 'Tactical Spread Index',
    recommendations: 'Strategic Orders',
    ctaButton: 'Receive Orders',
    loading: 'Commander is planning the expedition...',
    placeholder: 'Ask Commander Erwin for strategic advice on your territory!',
    ask: 'Tactical Consultation',
    answer: 'The Commander\'s Strategy',
  },
  zh: {
    title: '艾爾文團長的戰術簡報',
    desc: '關於奪還領土與人類未來的最終指令。',
    analysis: '城牆結構弱點分析',
    risk: '巨人威脅程度',
    diversification: '戰術多樣性指數',
    recommendations: '兵團作戰建議',
    ctaButton: '接收指令',
    loading: '團長正在制定作戰計畫...',
    placeholder: '針對目前的領土配置，向艾爾文團長請教戰術建議！',
    ask: '深度戰術諮詢',
    answer: '團長的最終命令',
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
      console.error('Tactical failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('low') || l.includes('低') || l.includes('conservative')) return 'bg-emerald-900/50 text-emerald-400 border-emerald-500/50';
    if (l.includes('medium') || l.includes('中') || l.includes('moderate')) return 'bg-amber-900/50 text-amber-400 border-amber-500/50';
    return 'bg-red-900/50 text-red-400 border-red-500/50';
  };

  return (
    <Card className="titan-panel border-none overflow-hidden shinzou-glow">
      <div className="bg-primary/20 border-b border-primary/30 px-12 py-10 relative">
        {/* Commander Levi/Erwin Shadow Background */}
        <div className="absolute top-0 right-0 w-64 h-full opacity-10 pointer-events-none">
           <Image src="https://picsum.photos/seed/levi/400/600" fill alt="Levi" className="object-cover grayscale" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-4 text-4xl font-black uppercase tracking-tighter text-primary">
              <Crosshair className="h-8 w-8" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-primary/60 text-sm font-bold uppercase tracking-[0.2em]">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="outline" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="scout-button h-12 px-8">
              <RefreshCw className="h-5 w-5 mr-2" />
              {language === 'en' ? 'New Briefing' : '下一個作戰計畫'}
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-12 bg-black/20">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 w-full space-y-4">
              <label className="text-xs font-black text-primary/60 uppercase tracking-[0.3em] px-1">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-40 rounded-none bg-black/40 border-2 border-primary/20 text-lg p-8 focus:border-primary transition-all font-bold text-white"
              />
            </div>
            <Button 
              className="h-40 w-full lg:w-64 scout-button flex flex-col items-center justify-center gap-4 group"
              onClick={fetchTip}
              disabled={loading || assets.length === 0}
            >
              <div className={cn("p-6 border-2 border-white/20 rounded-full group-hover:bg-white/10", loading && "animate-spin")}>
                {loading ? <RefreshCw className="h-10 w-10" /> : <Send className="h-10 w-10" />}
              </div>
              <span className="font-black text-xs uppercase tracking-widest">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="xl:col-span-5 space-y-10">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-primary uppercase tracking-[0.4em]">{lang.answer}</h4>
                <div className="text-lg text-slate-200 leading-relaxed bg-primary/5 p-10 border-l-8 border-primary relative italic font-bold">
                   <MessageSquare className="absolute -top-6 -left-6 h-12 w-12 text-primary/10 -rotate-12" />
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-black/40 p-8 border border-primary/10">
                  <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em] mb-4">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-sm font-black py-2 px-6 rounded-none", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-black/40 p-8 border border-primary/10">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">{lang.diversification}</h4>
                    <span className="text-base font-black text-primary">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-2 bg-primary/10" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-xl font-black flex items-center gap-4 text-primary uppercase italic">
                  <div className="bg-primary/10 p-4 border border-primary/20"><Flag className="h-6 w-6" /></div>
                  {lang.analysis}
                </h4>
                <p className="text-base text-slate-400 leading-relaxed font-bold">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-xl font-black flex items-center gap-4 text-primary uppercase italic">
                  <div className="bg-primary/10 p-4 border border-primary/20"><Star className="h-6 w-6" /></div>
                  {lang.recommendations}
                </h4>
                <ul className="space-y-6">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-base flex gap-4 text-slate-300 items-start group">
                      <div className="h-10 w-10 border border-primary/30 text-primary flex items-center justify-center shrink-0 font-black text-sm group-hover:bg-primary group-hover:text-white transition-all">
                        {i + 1}
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

