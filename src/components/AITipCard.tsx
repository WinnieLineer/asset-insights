'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  marketConditions: string;
  language: 'en' | 'zh';
}

const t = {
  en: {
    title: 'AI Advisor (Static Mode)',
    desc: 'Automated portfolio check based on your asset allocation.',
    analysis: 'Portfolio Health',
    risk: 'Risk Level',
    diversification: 'Diversity Index',
    recommendations: 'Key Steps',
    ctaButton: 'Run Analysis',
    loading: 'Processing...',
    placeholder: 'AI requires a server to provide dynamic tips...',
    ask: 'Static Review',
    answer: 'System Status',
  },
  zh: {
    title: 'AI 財務分析 (靜態模式)',
    desc: '基於資產配置比例的自動化檢查',
    analysis: '資產健康狀況',
    risk: '風險等級',
    diversification: '多元化指數',
    recommendations: '優化建議',
    ctaButton: '開始分析',
    loading: '分析中...',
    placeholder: '靜態網頁版僅支援基礎分析，完整 AI 建議需部署至伺服器...',
    ask: '系統檢查',
    answer: '系統分析結果',
  }
};

export function AITipCard({ assets, totalTWD, language }: AITipCardProps) {
  const [insight, setInsight] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const lang = t[language];

  const fetchTip = () => {
    if (assets.length === 0) return;
    setLoading(true);
    
    // 靜態版邏輯：模擬分析，避免使用 Server Action
    setTimeout(() => {
      const cryptoRatio = assets.filter(a => a.category === 'Crypto').reduce((sum, a) => sum + a.valueInTWD, 0) / (totalTWD || 1);
      
      setInsight({
        answer: language === 'zh' ? '當前資產配置已根據市場匯率完成同步。' : 'Current portfolio has been synchronized with market rates.',
        analysis: language === 'zh' ? '資產組合包含多元化部位，建議定期建立快照以追蹤長期走勢。' : 'Portfolio contains diversified assets. Regular snapshots are recommended.',
        riskLevel: cryptoRatio > 0.3 ? (language === 'zh' ? '高風險 / 積極型' : 'High Risk / Aggressive') : (language === 'zh' ? '中低風險 / 穩健型' : 'Low-Moderate / Balanced'),
        diversificationScore: Math.min(assets.length * 15, 100),
        recommendations: language === 'zh' 
          ? ['確保緊急預備金充足', '定期檢視高波動資產比重', '利用快照功能對比歷史紀錄'] 
          : ['Ensure sufficient emergency funds', 'Review high-volatility asset exposure', 'Use snapshots to compare performance']
      });
      setLoading(false);
    }, 800);
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('safe') || l.includes('low') || l.includes('低')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (l.includes('medium') || l.includes('moderate') || l.includes('中')) return 'text-amber-600 bg-amber-50 border-amber-100';
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
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        {!insight ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.ask}</label>
              <Textarea 
                readOnly
                placeholder={lang.placeholder}
                className="resize-none h-28 bg-slate-50 border-slate-200 focus:border-black rounded-lg text-sm p-4 transition-all opacity-60"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button 
                className="w-full lg:w-48 h-28 bg-black hover:bg-slate-800 text-white font-bold rounded-lg flex flex-col gap-3 shadow-sm transition-all"
                onClick={fetchTip}
                disabled={loading || assets.length === 0}
              >
                <div className={cn("p-2.5 rounded-full bg-white/10", loading && "animate-spin")}>
                  {loading ? <RefreshCw className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
                </div>
                <span className="text-[10px] tracking-widest uppercase">{loading ? lang.loading : lang.ctaButton}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-fade-in">
            <div className="xl:col-span-5 space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-black uppercase tracking-widest">{lang.answer}</h4>
                <div className="text-base text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-lg border border-slate-100 font-medium italic">
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-lg border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{lang.risk}</h4>
                  <Badge variant="outline" className={cn("text-[10px] font-bold py-1 px-3 rounded w-full justify-center", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-white p-5 rounded-lg border border-slate-100">
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
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold flex items-center gap-2 text-black uppercase tracking-widest">
                  <TrendingUp className="w-4 h-4" />
                  {lang.recommendations}
                </h4>
                <ul className="space-y-3">
                  {insight.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-[11px] flex gap-3 text-slate-600 items-start">
                      <div className="w-5 h-5 rounded bg-slate-100 text-black flex items-center justify-center shrink-0 font-bold text-[10px] border border-slate-200">
                        {i + 1}
                      </div>
                      <span className="pt-0.5 font-medium">{rec}</span>
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
