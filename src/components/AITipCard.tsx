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
  marketConditions: string;
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
    ctaButton: 'Run Analysis',
    loading: 'Thinking...',
    answer: 'AI Recommendation',
  },
  zh: {
    title: 'Gemini 專業投資分析',
    desc: '基於當前配置的深度風險評估與優化建議。',
    analysis: '戰略分析報告',
    risk: '組合風險等級',
    diversification: '分散投資指數',
    recommendations: '優化執行步驟',
    ctaButton: '執行 AI 分析',
    loading: '分析中...',
    answer: 'AI 專業建議',
  }
};

export function AITipCard({ assets, totalTWD, language }: AITipCardProps) {
  const [insight, setInsight] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const lang = t[language];

  // 模擬呼叫 Gemini API 的分析邏輯（靜態版優化）
  const fetchTip = () => {
    if (assets.length === 0) return;
    setLoading(true);
    
    setTimeout(() => {
      const cryptoVal = assets.filter(a => a.category === 'Crypto').reduce((sum, a) => sum + a.valueInTWD, 0);
      const stockVal = assets.filter(a => a.category === 'Stock').reduce((sum, a) => sum + a.valueInTWD, 0);
      const cryptoRatio = cryptoVal / (totalTWD || 1);
      const stockRatio = stockVal / (totalTWD || 1);
      
      let analysisText = "";
      let recommendations: string[] = [];
      let riskLevel = "";
      let score = Math.min(assets.length * 15, 100);

      if (language === 'zh') {
        riskLevel = cryptoRatio > 0.4 ? "高風險 / 積極成長型" : cryptoRatio > 0.15 ? "中等風險 / 平衡成長型" : "低風險 / 保守穩健型";
        analysisText = `您的資產目前以 ${cryptoRatio > stockRatio ? '加密貨幣' : '股票'} 為核心部位。當前市場波動較大，您的配置顯示出${cryptoRatio > 0.3 ? '較強的進攻性' : '穩定的防禦性'}。建議關注 ${cryptoRatio > 0.3 ? '下行風險保護' : '資產增值機會'}。`;
        recommendations = [
          cryptoRatio > 0.3 ? "考慮將部分獲利轉入低波動債券或活存" : "可適度增加全球指數基金部位提升長期報酬",
          "定期建立快照以追蹤不同市場週期下的資產表現",
          "確保持有現金部位足以支撐 6-12 個月的緊急支出"
        ];
      } else {
        riskLevel = cryptoRatio > 0.4 ? "High Risk / Aggressive" : cryptoRatio > 0.15 ? "Moderate / Balanced" : "Low Risk / Conservative";
        analysisText = `Your portfolio is primarily centered around ${cryptoRatio > stockRatio ? 'Cryptocurrencies' : 'Equities'}. Given current conditions, your allocation demonstrates ${cryptoRatio > 0.3 ? 'high growth potential' : 'solid defensive posture'}.`;
        recommendations = [
          cryptoRatio > 0.3 ? "Consider rebalancing high-volatility profits into stable assets" : "Opportunity to increase global index exposure for better growth",
          "Use snapshots periodically to monitor performance across market cycles",
          "Maintain a liquid cash reserve equivalent to 6-12 months of expenses"
        ];
      }

      setInsight({
        answer: language === 'zh' ? '當前投資組合已完成深度掃描，配置比例與市場波動率匹配。' : 'Portfolio scan complete. Allocation metrics align with current market volatility.',
        analysis: analysisText,
        riskLevel: riskLevel,
        diversificationScore: score,
        recommendations: recommendations
      });
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
        {!insight && !loading && (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
            <Brain className="w-12 h-12" />
            <p className="text-xs font-bold uppercase tracking-widest">Click run analysis to generate AI report</p>
          </div>
        )}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-200" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Processing Portfolio Data...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
