'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Shield, RefreshCw, Skull, Map, Flag, MessageSquare, Send, Crosshair, Star, Target } from 'lucide-react';
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
    title: 'Commander Erwin\'s Strategy Brief',
    desc: 'Strategic orders for the humanity\'s financial survival.',
    analysis: 'Wall Vulnerability Analysis',
    risk: 'Titan Threat Level',
    diversification: 'Tactical Spread Index',
    recommendations: 'Operational Orders',
    ctaButton: 'Receive Commands',
    loading: 'Commander is planning the next expedition...',
    placeholder: 'Ask the Commander for specific tactical advice on your divisions!',
    ask: 'Tactical Inquiry',
    answer: 'The Commander\'s Decree',
  },
  zh: {
    title: '艾爾文團長的戰術簡報',
    desc: '關於奪還領土與人類財富未來的最終指令。',
    analysis: '城牆結構弱點深度評估',
    risk: '巨人威脅威懾程度',
    diversification: '分隊戰術多樣性指數',
    recommendations: '兵團作戰具體行動建議',
    ctaButton: '接收最終指令',
    loading: '團長正在制定壁外調查作戰計畫...',
    placeholder: '針對目前的領土戰力配置，向艾爾文團長請教戰術指令！',
    ask: '機密戰術諮詢',
    answer: '團長的作戰決議',
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
      console.error('Operational failure:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('safe') || l.includes('low') || l.includes('安全')) return 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50';
    if (l.includes('abnormal') || l.includes('medium') || l.includes('奇行種')) return 'bg-amber-900/40 text-amber-400 border-amber-500/50';
    return 'bg-red-900/40 text-red-400 border-red-500/50';
  };

  return (
    <Card className="titan-panel border-none rounded-none shadow-2xl relative overflow-hidden">
      {/* Background Character: Levi Silhouette or similar */}
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none grayscale">
         <Image src="https://picsum.photos/seed/levi/600/800" fill alt="Levi" className="object-cover" data-ai-hint="levi anime" />
      </div>

      <div className="bg-primary/10 border-b border-primary/20 px-12 py-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-4">
            <CardTitle className="flex items-center gap-6 text-4xl font-black uppercase tracking-tighter text-primary italic">
              <Crosshair className="h-10 w-10" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-primary/60 text-xs font-black uppercase tracking-[0.5em]">{lang.desc}</CardDescription>
          </div>
          {insight && (
            <Button variant="outline" size="sm" onClick={() => { setInsight(null); setQuestion(''); }} className="scout-button h-14 px-10 rounded-none border border-primary/30">
              <RefreshCw className="h-5 w-5 mr-3" />
              {language === 'en' ? 'New Tactical Request' : '申請新的作戰指令'}
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-12 relative z-10">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1 w-full space-y-6">
              <label className="text-[10px] font-black text-primary/70 uppercase tracking-[0.4em] block px-2">{lang.ask}</label>
              <Textarea 
                placeholder={lang.placeholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="resize-none h-48 rounded-none bg-black/60 border-2 border-primary/30 text-xl p-10 focus:border-primary transition-all font-black text-white custom-scrollbar"
              />
            </div>
            <Button 
              className="h-48 w-full lg:w-72 scout-button flex flex-col items-center justify-center gap-5 group rounded-none"
              onClick={fetchTip}
              disabled={loading || assets.length === 0}
            >
              <div className={cn("p-6 border-2 border-white/20 rounded-full group-hover:bg-white/10 transition-all", loading && "animate-spin")}>
                {loading ? <RefreshCw className="h-12 w-12" /> : <Target className="h-12 w-12" />}
              </div>
              <span className="font-black text-xs uppercase tracking-[0.3em]">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="xl:col-span-5 space-y-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.5em]">{lang.answer}</h4>
                <div className="text-xl text-slate-100 leading-relaxed bg-black/40 p-12 border-l-[12px] border-primary relative italic font-black shadow-2xl">
                   <MessageSquare className="absolute -top-10 -left-10 h-20 w-20 text-primary/5 -rotate-12" />
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="bg-black/60 p-10 border border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10"><Skull className="h-12 w-12" /></div>
                  <h4 className="text-[10px] font-black text-primary/50 uppercase tracking-[0.4em] mb-6">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-base font-black py-3 px-8 rounded-none w-full justify-center tracking-tighter", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-black/60 p-10 border border-primary/20">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black text-primary/50 uppercase tracking-[0.4em]">{lang.diversification}</h4>
                    <span className="text-xl font-black text-primary">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-3 bg-primary/10 rounded-none" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-8">
                <h4 className="text-2xl font-black flex items-center gap-5 text-primary uppercase italic tracking-tighter">
                  <div className="bg-primary/20 p-5 border border-primary/30"><Shield className="h-7 w-7" /></div>
                  {lang.analysis}
                </h4>
                <p className="text-lg text-slate-400 leading-relaxed font-black opacity-90">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-8">
                <h4 className="text-2xl font-black flex items-center gap-5 text-primary uppercase italic tracking-tighter">
                  <div className="bg-primary/20 p-5 border border-primary/30"><Star className="h-7 w-7" /></div>
                  {lang.recommendations}
                </h4>
                <ul className="space-y-8">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-lg flex gap-6 text-slate-200 items-start group">
                      <div className="h-12 w-12 border-2 border-primary/40 text-primary flex items-center justify-center shrink-0 font-black text-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        {i + 1}
                      </div>
                      <span className="font-black pt-2 leading-snug tracking-tight">{rec}</span>
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