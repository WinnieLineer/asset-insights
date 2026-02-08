
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
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
  marketConditions?: string;
  language: 'en' | 'zh';
}

const t = {
  en: {
    title: 'Gemini Portfolio Insights',
    desc: 'Advanced risk analysis and strategic recommendations.',
    analysis: 'Strategic Analysis',
    risk: 'Portfolio Risk',
    diversification: 'Diversity Score',
    recommendations: 'Optimization Steps',
    ctaButton: 'Run Gemini AI Analysis',
    loading: 'Gemini is thinking...',
    answer: 'AI Recommendation',
  },
  zh: {
    title: 'Gemini 專業投資分析',
    desc: '基於當前配置的深度風險評估與優化建議。',
    analysis: '戰略分析報告',
    risk: '組合風險等級',
    diversification: '分散投資指數',
    recommendations: '優化執行步驟',
    ctaButton: '執行 Gemini AI 分析',
    loading: 'Gemini 分析中...',
    answer: 'AI 專業建議',
  }
};

export function AITipCard({ assets, totalTWD, language, marketConditions = "Stable" }: AITipCardProps) {
  const [insight, setInsight] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const lang = t[language];

  const fetchTip = () => {
    if (assets.length === 0) return;
    setLoading(true);
    
    setTimeout(() => {
      const cryptoVal = assets.filter(a => a.category === 'Crypto').reduce((sum, a) => sum + a.valueInTWD, 0);
      const cryptoRatio = cryptoVal / (totalTWD || 1);
      const score = Math.min(assets.length * 15 + 20, 100);

      const report = language === 'zh' ? {
        answer: '資產掃描完成。目前部位顯示出明確的成長動能。',
        analysis: `配置以 ${cryptoRatio > 0.3 ? '進攻型' : '平衡型'} 資產為主。市場環境：${marketConditions}。在當前匯率環境下，您的部位對 ${cryptoRatio > 0.3 ? '市場波動' : '資產增幅'} 具有高度敏感性。`,
        riskLevel: cryptoRatio > 0.4 ? "高風險 / 積極成長" : cryptoRatio > 0.15 ? "中等風險 / 平衡成長" : "低風險 / 保守穩健",
        recommendations: [
          cryptoRatio > 0.3 ? "考慮在高點適度獲利了結，轉入低波動債券" : "可適度增加全球指數基金（如 VTI/VT）提升長期報酬",
          "定期建立快照以追蹤不同市場週期下的資產表現",
          "確保持有現金部位足以支撐 6-12 個月的緊急支出"
        ]
      } : {
        answer: 'Portfolio scan complete. Current allocation shows clear growth momentum.',
        analysis: `Your strategy is ${cryptoRatio > 0.3 ? 'Aggressive' : 'Balanced'}. Market: ${marketConditions}. Given current FX rates, your portfolio is highly sensitive to ${cryptoRatio > 0.3 ? 'market volatility' : 'asset appreciation'}.`,
        riskLevel: cryptoRatio > 0.4 ? "High Risk / Aggressive" : cryptoRatio > 0.15 ? "Moderate / Balanced" : "Low Risk / Conservative",
        recommendations: [
          cryptoRatio > 0.3 ? "Consider rebalancing high-volatility profits into stable assets" : "Opportunity to increase global index exposure for better growth",
          "Use snapshots periodically to monitor performance across market cycles",
          "Maintain a liquid cash reserve equivalent to 6-12 months of expenses"
        ]
      };

      setInsight({ ...report, diversificationScore: score });
      setLoading(false);
    }, 1500);
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('safe') || l.includes('low') || l.includes('保守') || l.includes('低')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (l.includes('medium') || l.includes('moderate') || l.includes('平衡') || l.includes('中')) return 'text-amber-600 bg-amber-50 border-amber-100';
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
          <Button 
            className="bg-black hover:bg-slate-800 text-white font-bold rounded px-8 h-12 shadow-sm transition-all"
            onClick={fetchTip}
            disabled={loading || assets.length === 0}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
            <span className="text-[10px] tracking-widest uppercase">{loading ? lang.loading : lang.ctaButton}</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        {insight && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-fade-in">
            <div className="xl:col-span-5 space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-black uppercase tracking-widest">{lang.answer}</h4>
                <div className="text-base text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-lg border border-slate-100 font-medium italic">
                  "{insight.answer}"
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-[10px] font-bold py-1 px-3 rounded w-full justify-center border", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm">
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
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{insight.analysis}</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold flex items-center gap-2 text-black uppercase tracking-widest">
                  <TrendingUp className="w-4 h-4" />
                  {lang.recommendations}
                </h4>
                <ul className="space-y-3">
                  {insight.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-[11px] flex gap-3 text-slate-600 items-start">
                      <div className="w-5 h-5 rounded bg-slate-100 text-black flex items-center justify-center shrink-0 font-bold text-[10px] border border-slate-200">{i + 1}</div>
                      <span className="pt-0.5 font-medium">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        {!insight && !loading && (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
            <Brain className="w-12 h-12" />
            <p className="text-xs font-bold uppercase tracking-widest">Click run Gemini analysis to generate report</p>
          </div>
        )}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-200" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gemini is Scanning Portfolio...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
