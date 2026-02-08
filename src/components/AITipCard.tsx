'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, ShieldCheck, TrendingUp, Sparkles, MessageSquare, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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

interface FinancialTipOutput {
  answer: string;
  analysis: string;
  riskLevel: string;
  diversificationScore: number;
  recommendations: string[];
}

interface AITipCardProps {
  assets: AssetDetail[];
  totalTWD: number;
  marketConditions?: string;
  language: 'en' | 'zh';
}

const t = {
  en: {
    title: 'Gemini Portfolio Analysis',
    desc: 'Advanced portfolio auditing powered by Gemini 3 Flash Intelligence.',
    analysis: 'Strategic Position Review',
    risk: 'Portfolio Risk Index',
    diversification: 'Diversification Health',
    recommendations: 'Tactical Optimization',
    ctaButton: 'Generate Analysis',
    loading: 'Processing Intelligence...',
    answer: 'Executive Summary',
    instructionLabel: 'Custom Analysis Directives',
    instructionPlaceholder: 'e.g., How should I rebalance if market volatility increases?',
    noApiKey: 'Gemini API Configuration missing.'
  },
  zh: {
    title: 'Gemini 資產部位分析',
    desc: '整合 Gemini 3 Flash Preview 提供專業級資產配置優化與戰略建議。',
    analysis: '資產配置與核心戰略評估',
    risk: '當前部位風險等級',
    diversification: '資產分散健康評分',
    recommendations: '具體優化執行路徑',
    ctaButton: '生成 AI 部位分析',
    loading: 'Gemini 正在分析資產模型...',
    answer: 'AI 專業執行總結',
    instructionLabel: '自定義分析指令 / 提問',
    instructionPlaceholder: '例如：如果未來半年台幣持續升值，我的部位應如何調整？',
    noApiKey: '請在環境設定中配置 Gemini API Key。'
  }
};

export function AITipCard({ assets, totalTWD, language, marketConditions = "Stable" }: AITipCardProps) {
  const { toast } = useToast();
  const [insight, setInsight] = useState<FinancialTipOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const lang = t[language];

  const callGeminiAPI = async () => {
    if (assets.length === 0) return;
    
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: lang.noApiKey
      });
      return;
    }

    setLoading(true);
    
    const portfolioSummary = assets.map(a => 
      `${a.name} (${a.symbol || a.category}): ${a.amount} ${a.currency}, Value: ${a.valueInTWD.toFixed(0)} TWD`
    ).join('\n');

    const promptText = `
      You are a high-end institutional financial analyst. Provide a professional portfolio audit.
      
      PORTFOLIO DATA:
      ${portfolioSummary}
      Total Value (TWD): ${totalTWD.toFixed(0)}
      Current Context: ${marketConditions}
      User Custom Inquiry: "${userQuestion || 'Full portfolio analysis'}"
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "answer": "Concise executive answer to the inquiry",
        "analysis": "Professional strategic overview of current allocation",
        "riskLevel": "Low | Moderate | High",
        "diversificationScore": 0-100,
        "recommendations": ["Step 1", "Step 2", "Step 3"]
      }
      
      Language: ${language === 'zh' ? 'Traditional Chinese' : 'English'}.
      IMPORTANT: Return ONLY raw JSON. No markdown code blocks.
    `;

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey 
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptText
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanJson = rawText.replace(/```json|```/gi, '').trim();
      setInsight(JSON.parse(cleanJson));
    } catch (error) {
      console.error('AI Error:', error);
      toast({ variant: 'destructive', title: 'AI Audit Failed', description: 'Model synchronization error.' });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('low') || l.includes('低')) return 'bg-black text-white';
    if (l.includes('high') || l.includes('高')) return 'bg-rose-600 text-white';
    return 'bg-zinc-800 text-white';
  };

  return (
    <Card className="modern-card border-slate-200 bg-white shadow-xl overflow-hidden animate-fade-in">
      <CardHeader className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-100 bg-zinc-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold tracking-tight uppercase">{lang.title}</CardTitle>
            </div>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang.desc}</CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 flex-1 max-w-2xl w-full">
            <div className="w-full space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {lang.instructionLabel}
              </label>
              <Textarea 
                placeholder={lang.instructionPlaceholder}
                className="text-sm min-h-[60px] bg-white border-zinc-200 focus:ring-black focus:border-black rounded-md p-3 font-bold shadow-sm"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
              />
            </div>
            <Button 
              className="bg-black hover:bg-zinc-800 text-white font-bold h-[60px] px-8 rounded-md shrink-0 w-full sm:w-auto transition-all active:scale-95 shadow-md"
              onClick={callGeminiAPI}
              disabled={loading || assets.length === 0}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              <span className="text-xs tracking-widest uppercase">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 sm:p-10">
        {insight ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-fade-in">
            <div className="xl:col-span-5 space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {lang.answer}
                </h4>
                <div className="text-sm sm:text-base font-bold text-zinc-900 leading-relaxed border-l-4 border-black pl-5 py-2">
                  {insight.answer}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-zinc-50 p-6 rounded-md border border-zinc-100 shadow-inner">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">{lang.risk}</h4>
                  <Badge className={cn("text-xs font-bold py-1.5 px-4 border-none uppercase tracking-widest", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-zinc-50 p-6 rounded-md border border-zinc-100 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-xs font-bold text-black">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-2 bg-zinc-200 [&>div]:bg-black" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 space-y-10">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  {lang.analysis}
                </h4>
                <p className="text-sm sm:text-base font-medium text-zinc-600 leading-loose">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-5">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {lang.recommendations}
                </h4>
                <div className="grid gap-3">
                  {insight.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-md hover:border-black transition-all group shadow-sm">
                      <div className="w-6 h-6 rounded bg-black text-white flex items-center justify-center shrink-0 font-bold text-xs group-hover:scale-110 transition-transform">
                        {i + 1}
                      </div>
                      <span className="text-sm font-bold text-zinc-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-6 opacity-30">
            <Brain className="w-16 h-16" />
            <p className="text-sm font-bold uppercase tracking-widest">點擊按鈕開始資產配置分析</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
