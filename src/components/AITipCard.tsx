'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, ShieldCheck, TrendingUp, Sparkles, MessageSquare, AlertCircle, LayoutDashboard, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
    title: 'Gemini Strategic Insights',
    desc: 'Deep portfolio intelligence and risk matrix analysis.',
    analysis: 'Strategic Analysis',
    risk: 'Portfolio Risk Level',
    diversification: 'Diversification Matrix',
    recommendations: 'Tactical Recommendations',
    ctaButton: 'Generate AI Report',
    loading: 'Gemini is processing...',
    answer: 'AI Executive Summary',
    instructionLabel: 'Custom Context / Inquiry',
    instructionPlaceholder: 'e.g., Analyze my risk exposure if US markets drop 10%',
    noApiKey: 'Gemini API Key missing. Set NEXT_PUBLIC_GEMINI_API_KEY in repository secrets.'
  },
  zh: {
    title: 'Gemini 專業投資分析',
    desc: '基於當前資產配置的深度風險評估與戰略優化建議。',
    analysis: '核心戰略分析',
    risk: '投資組合風險等級',
    diversification: '分散投資健康指數',
    recommendations: '優化執行路徑',
    ctaButton: '產出 AI 戰略報告',
    loading: 'Gemini 正在掃描資產...',
    answer: 'AI 專業總結建議',
    instructionLabel: '自定義分析指令 / 提問',
    instructionPlaceholder: '例如：如果美股大跌 10%，我的組合風險會如何變化？',
    noApiKey: '缺少 Gemini API 金鑰。請在 GitHub Secrets 中設定 NEXT_PUBLIC_GEMINI_API_KEY。'
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
        title: 'API Key Error',
        description: lang.noApiKey
      });
      return;
    }

    setLoading(true);
    
    const portfolioSummary = assets.map(a => 
      `${a.name} (${a.symbol}): ${a.amount} ${a.currency}, Value: ${a.valueInTWD.toFixed(0)} TWD`
    ).join('\n');

    const prompt = `
      You are a high-end institutional financial analyst. Provide a professional portfolio audit.
      
      PORTFOLIO DATA:
      ${portfolioSummary}
      Total Value (TWD): ${totalTWD.toFixed(0)}
      Current Context: ${marketConditions}
      User Custom Inquiry: "${userQuestion || 'Full portfolio audit'}"
      
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5 }
        })
      });

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanJson = rawText.replace(/```json|```/gi, '').trim();
      setInsight(JSON.parse(cleanJson));
    } catch (error) {
      toast({ variant: 'destructive', title: 'AI Error', description: 'API connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('low') || l.includes('低') || l.includes('safe')) return 'bg-black text-white border-black';
    if (l.includes('high') || l.includes('高') || l.includes('aggressive')) return 'bg-rose-500 text-white border-rose-600';
    return 'bg-zinc-800 text-white border-zinc-900';
  };

  return (
    <Card className="modern-card border-slate-200 bg-white shadow-xl overflow-hidden animate-fade-in">
      <CardHeader className="px-10 py-8 border-b border-slate-100 bg-zinc-50/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-black rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tight">{lang.title}</CardTitle>
            </div>
            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{lang.desc}</CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4 flex-1 max-w-2xl">
            <div className="w-full space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <MessageSquare className="w-3 h-3" />
                {lang.instructionLabel}
              </label>
              <Textarea 
                placeholder={lang.instructionPlaceholder}
                className="text-xs min-h-[50px] bg-white border-zinc-200 focus:ring-black focus:border-black rounded-xl transition-all"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
              />
            </div>
            <Button 
              className="bg-black hover:bg-zinc-800 text-white font-bold h-[50px] px-8 rounded-xl transition-all shrink-0 shadow-lg shadow-zinc-200"
              onClick={callGeminiAPI}
              disabled={loading || assets.length === 0}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2 text-zinc-300" />}
              <span className="text-[11px] tracking-widest uppercase">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-10">
        {insight ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 animate-fade-in">
            {/* Left Column: Summary & Scores */}
            <div className="xl:col-span-5 space-y-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  {lang.answer}
                </h4>
                <div className="text-lg font-medium text-zinc-900 leading-snug border-l-[3px] border-black pl-6 py-2 bg-zinc-50/50 italic">
                  "{insight.answer}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-between">
                  <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">{lang.risk}</h4>
                  <Badge className={cn("text-[11px] font-black py-2 px-4 rounded-xl border-none shadow-sm", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-xs font-black text-black">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-2 bg-zinc-100 [&>div]:bg-black" />
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Analysis & Recommendations */}
            <div className="xl:col-span-7 space-y-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-300" />
                  {lang.analysis}
                </h4>
                <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-300" />
                  {lang.recommendations}
                </h4>
                <div className="grid gap-3">
                  {insight.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="group flex items-center gap-5 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl hover:border-black hover:bg-white transition-all duration-300">
                      <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0 font-black text-[11px] shadow-sm group-hover:scale-110 transition-transform">
                        {i + 1}
                      </div>
                      <span className="text-xs font-bold text-zinc-700 tracking-tight">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="py-24 text-center flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-100 border-t-black rounded-full animate-spin"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-zinc-200" />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-black">Scanning Assets</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Generating Strategic Intelligence...</p>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center flex flex-col items-center gap-6 opacity-20 hover:opacity-30 transition-opacity">
            <div className="p-6 bg-zinc-50 rounded-full">
              <LayoutDashboard className="w-12 h-12 text-black" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.4em]">Strategic Engine Idle</p>
              <p className="text-[9px] font-bold uppercase tracking-widest">Click to initiate Gemini deep audit</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
