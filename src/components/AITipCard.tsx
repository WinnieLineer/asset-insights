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
    title: 'Gemini Portfolio Intelligence',
    desc: 'Professional grade audit and risk analysis engine.',
    analysis: 'Strategic Analysis',
    risk: 'Risk Exposure',
    diversification: 'Asset Diversification',
    recommendations: 'Action Items',
    ctaButton: 'Generate AI Report',
    loading: 'Gemini is auditing...',
    answer: 'AI Executive Summary',
    instructionLabel: 'Custom Instructions',
    instructionPlaceholder: 'Ask specific questions about your portfolio...',
    noApiKey: 'API Key missing. Add NEXT_PUBLIC_GEMINI_API_KEY in repository secrets.'
  },
  zh: {
    title: 'Gemini 專業投資分析',
    desc: '針對當前配置提供深度戰略建議。',
    analysis: '核心戰略分析',
    risk: '投資組合風險等級',
    diversification: '分散投資健康指數',
    recommendations: '優化執行路徑',
    ctaButton: '產出 AI 戰略報告',
    loading: 'Gemini 正在分析...',
    answer: 'AI 專業總結建議',
    instructionLabel: '自定義分析指令 / 提問',
    instructionPlaceholder: '例如：請分析若美股回調，我的組合會受多大影響？',
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

    const promptText = `
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
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
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

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanJson = rawText.replace(/```json|```/gi, '').trim();
      setInsight(JSON.parse(cleanJson));
    } catch (error) {
      console.error('AI Error:', error);
      toast({ variant: 'destructive', title: 'AI Error', description: 'API connection failed.' });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('low') || l.includes('低')) return 'bg-black text-white';
    if (l.includes('high') || l.includes('高')) return 'bg-rose-500 text-white';
    return 'bg-zinc-800 text-white';
  };

  return (
    <Card className="modern-card border-slate-200 bg-white shadow-xl overflow-hidden animate-fade-in">
      <CardHeader className="px-10 py-8 border-b border-slate-100 bg-zinc-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">{lang.title}</CardTitle>
            </div>
            <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.desc}</CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4 flex-1 max-w-2xl">
            <div className="w-full space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <MessageSquare className="w-3 h-3" />
                {lang.instructionLabel}
              </label>
              <Textarea 
                placeholder={lang.instructionPlaceholder}
                className="text-xs min-h-[40px] bg-white border-zinc-200 focus:ring-black focus:border-black rounded"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
              />
            </div>
            <Button 
              className="bg-black hover:bg-zinc-800 text-white font-bold h-[40px] px-6 rounded shrink-0"
              onClick={callGeminiAPI}
              disabled={loading || assets.length === 0}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              <span className="text-[10px] tracking-widest uppercase">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-10">
        {insight ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-fade-in">
            <div className="xl:col-span-5 space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  {lang.answer}
                </h4>
                <div className="text-sm font-medium text-zinc-900 leading-relaxed border-l-2 border-black pl-4 py-1">
                  {insight.answer}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-4 rounded border border-zinc-100">
                  <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{lang.risk}</h4>
                  <Badge className={cn("text-[10px] font-bold py-1 px-3 border-none", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-zinc-50 p-4 rounded border border-zinc-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{lang.diversification}</h4>
                    <span className="text-[10px] font-bold text-black">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-1.5 bg-zinc-200 [&>div]:bg-black" />
                </div>
              </div>
            </div>

            <div className="xl:col-span-7 space-y-8">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {lang.analysis}
                </h4>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {insight.analysis}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {lang.recommendations}
                </h4>
                <div className="grid gap-2">
                  {insight.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded hover:border-black transition-all">
                      <div className="w-5 h-5 rounded bg-black text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {i + 1}
                      </div>
                      <span className="text-xs font-bold text-zinc-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
            <Brain className="w-10 h-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Click to initiate Gemini Strategic Audit</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
