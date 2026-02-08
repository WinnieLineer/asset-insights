'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, ShieldCheck, TrendingUp, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
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
    title: 'Gemini Portfolio Insights',
    desc: 'Advanced risk analysis and strategic recommendations powered by Gemini.',
    analysis: 'Strategic Analysis',
    risk: 'Portfolio Risk',
    diversification: 'Diversity Score',
    recommendations: 'Optimization Steps',
    ctaButton: 'Run Gemini AI Analysis',
    loading: 'Gemini is thinking...',
    answer: 'AI Recommendation',
    instructionLabel: 'Custom Instructions / Questions',
    instructionPlaceholder: 'e.g., How can I reduce my crypto exposure risk?',
    noApiKey: 'Gemini API Key is missing. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment.'
  },
  zh: {
    title: 'Gemini 專業投資分析',
    desc: '基於當前配置的深度風險評估與優化建議，由 Gemini 提供動力。',
    analysis: '戰略分析報告',
    risk: '組合風險等級',
    diversification: '分散投資指數',
    recommendations: '優化執行步驟',
    ctaButton: '執行 Gemini AI 分析',
    loading: 'Gemini 分析中...',
    answer: 'AI 專業建議',
    instructionLabel: '自定義指令 / 提問',
    instructionPlaceholder: '例如：我該如何降低加密貨幣的曝險風險？',
    noApiKey: '缺少 Gemini API 金鑰。請在環境變數中設定 NEXT_PUBLIC_GEMINI_API_KEY。'
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
      You are a professional financial advisor. Analyze the following user portfolio and provide strategic advice.
      
      User Portfolio:
      ${portfolioSummary}
      Total Portfolio Value (TWD): ${totalTWD.toFixed(0)}
      Market Condition: ${marketConditions}
      User's specific question/instruction: "${userQuestion || 'Provide a general analysis of my portfolio.'}"
      
      Please provide your response in JSON format with the following keys:
      - answer: A direct, professional answer to the user's question (String)
      - analysis: A high-level strategic overview of the portfolio (String)
      - riskLevel: Risk level like "Low/Conservative", "Moderate/Balanced", or "High/Aggressive" (String)
      - diversificationScore: A score from 0 to 100 (Number)
      - recommendations: An array of 3-4 specific, actionable optimization steps (Array of Strings)
      
      Language: Respond in ${language === 'zh' ? 'Traditional Chinese' : 'English'}.
      IMPORTANT: Return ONLY the raw JSON object, no markdown code blocks.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          }
        })
      });

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      
      // Attempt to clean JSON if model returned markdown blocks
      const cleanJson = rawText.replace(/```json|```/gi, '').trim();
      const result = JSON.parse(cleanJson);
      
      setInsight(result);
    } catch (error) {
      console.error('Gemini API Error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Error',
        description: 'Failed to connect to Gemini API or parse response.'
      });
    } finally {
      setLoading(false);
    }
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
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-black">
              <Sparkles className="w-5 h-5" />
              {lang.title}
            </CardTitle>
            <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang.desc}</CardDescription>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-80">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                {lang.instructionLabel}
              </label>
              <Textarea 
                placeholder={lang.instructionPlaceholder}
                className="text-[11px] min-h-[60px] bg-white border-slate-200"
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
              />
            </div>
            <Button 
              className="bg-black hover:bg-slate-800 text-white font-bold rounded px-8 h-10 shadow-sm transition-all"
              onClick={callGeminiAPI}
              disabled={loading || assets.length === 0}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
              <span className="text-[10px] tracking-widest uppercase">{loading ? lang.loading : lang.ctaButton}</span>
            </Button>
          </div>
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
