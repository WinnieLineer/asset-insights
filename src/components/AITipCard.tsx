'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, ShieldCheck, Target, Loader2, Cpu, MessageSquare, Sparkles, Key, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AssetDetail {
  name: string;
  symbol: string;
  category: string;
  amount: number;
  currency: string;
  priceInDisplay?: number;
  valueInDisplay?: number;
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
    title: 'GEMINI ASSET POSITION ANALYSIS',
    desc: 'ADVANCED PORTFOLIO INTELLIGENCE POWERED BY GEMINI POWER.',
    analysis: 'Strategic Position Review',
    risk: 'Portfolio Risk Index',
    diversification: 'Diversification Health',
    recommendations: 'Tactical Optimization',
    ctaButton: 'EXECUTE ANALYSIS',
    loading: 'PROCESSING...',
    answer: 'EXECUTIVE SUMMARY',
    instructionLabel: 'CUSTOM ANALYSIS INSTRUCTION',
    instructionPlaceholder: 'ENTER COMMAND (e.g. Audit for volatility)...',
    noApiKey: 'Gemini API Configuration missing. Please set your API key.',
    apiKeySettings: 'Gemini API Key',
    apiKeyModalTitle: 'Gemini API Key Settings',
    apiKeyModalDesc: 'Configure your Google Gemini API key. Your key is stored securely in your browser localStorage only and is never uploaded to any third-party server.',
    apiKeyPlaceholder: 'AIzaSy...',
    saveKey: 'Save Key',
    clearKey: 'Clear Key',
    keySaved: 'API Key saved successfully',
    keyCleared: 'API Key removed',
    keyConfigured: 'AI Key Configured',
    keyMissing: 'AI Key Missing'
  },
  zh: {
    title: 'GEMINI 資產部位分析',
    desc: '整合 GEMINI 2.5 FLASH LITE 提供專業級資產配置優化與戰略建議。',
    analysis: '資產配置與核心戰略評估',
    risk: '當前部位風險等級',
    diversification: '資產分散健康評分',
    recommendations: '具體優化執行路徑',
    ctaButton: '生成 AI 部位分析',
    loading: 'GEMINI 正在分析中...',
    answer: 'AI 專業執行總結',
    instructionLabel: '自定義分析指令',
    instructionPlaceholder: '例如：如果未來半年台幣持續升值，我的部位應如何調整？',
    noApiKey: '尚未設定 Gemini API Key，請點擊金鑰圖示進行設定。',
    apiKeySettings: 'Gemini API 金鑰',
    apiKeyModalTitle: 'Gemini API 金鑰設定',
    apiKeyModalDesc: '請輸入您的 Google Gemini API Key。金鑰僅安全儲存於您本地瀏覽器 (localStorage)，絕不會上傳至第三方伺服器。',
    apiKeyPlaceholder: '請輸入 AIzaSy... 開頭的 API Key',
    saveKey: '儲存金鑰',
    clearKey: '清除金鑰',
    keySaved: 'API 金鑰已成功儲存',
    keyCleared: '已清除 API 金鑰',
    keyConfigured: 'AI 金鑰已設定',
    keyMissing: '尚未設定金鑰'
  }
};

export function AITipCard({ assets, totalTWD, language, marketConditions = "Stable" }: AITipCardProps) {
  const { toast } = useToast();
  const [insight, setInsight] = useState<FinancialTipOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const lang = t[language];

  // Load API key state on mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('gemini_api_key');
      const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (savedKey) {
        setCustomApiKey(savedKey);
        setHasApiKey(true);
      } else if (envKey) {
        setHasApiKey(true);
      }
    } catch (e) {}
  }, []);

  const getEffectiveApiKey = (): string => {
    try {
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey && savedKey.trim()) return savedKey.trim();
    } catch (e) {}
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  };

  const handleSaveApiKey = () => {
    const trimmed = customApiKey.trim();
    if (!trimmed) {
      toast({ variant: 'destructive', title: language === 'zh' ? '請輸入金鑰' : 'Please enter an API Key' });
      return;
    }
    try {
      localStorage.setItem('gemini_api_key', trimmed);
      setHasApiKey(true);
      setIsKeyModalOpen(false);
      toast({ title: lang.keySaved });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Storage Error' });
    }
  };

  const handleClearApiKey = () => {
    try {
      localStorage.removeItem('gemini_api_key');
      setCustomApiKey('');
      setHasApiKey(Boolean(process.env.NEXT_PUBLIC_GEMINI_API_KEY));
      setIsKeyModalOpen(false);
      toast({ title: lang.keyCleared });
    } catch (e) {}
  };

  const callGeminiAPI = async () => {
    if (assets.length === 0) return;
    const apiKey = getEffectiveApiKey();
    if (!apiKey) {
      setIsKeyModalOpen(true);
      toast({ variant: 'destructive', title: 'Gemini API Key', description: lang.noApiKey });
      return;
    }
    setLoading(true);
    const portfolioSummary = assets.map(a => 
      `${a.name} (${a.symbol || a.category}): ${(a.amount ?? 0).toFixed(5)} units, Unit Price: ${(a.priceInDisplay ?? 0).toFixed(4)}, Total Value: ${(a.valueInDisplay ?? 0).toFixed(0)}`
    ).join('\n');
    const promptText = `
      You are a high-end institutional financial analyst. Provide a professional portfolio audit.
      PORTFOLIO DATA:
      ${portfolioSummary}
      Total Portfolio Value (TWD): ${(totalTWD ?? 0).toFixed(0)}
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
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      if (!response.ok) {
        if (response.status === 400 || response.status === 403 || response.status === 401) {
          throw new Error(language === 'zh' ? 'Gemini API 金鑰無效或權限不足 (400/403)' : 'Invalid or unauthorized Gemini API key');
        }
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini');
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      let parsed: FinancialTipOutput;
      try {
        parsed = JSON.parse(cleanJson);
      } catch {
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Unable to parse JSON from AI response');
        }
      }
      setInsight(parsed);
    } catch (error: any) {
      console.error('AI Error:', error);
      toast({ 
        variant: 'destructive', 
        title: language === 'zh' ? 'AI 分析失敗' : 'AI Audit Failed', 
        description: error.message || (language === 'zh' ? '請檢查網路連線或 API 金鑰' : 'Model synchronization error')
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const l = (level || '').toLowerCase();
    if (l.includes('low') || l.includes('低')) return 'bg-black text-white';
    if (l.includes('high') || l.includes('高')) return 'bg-rose-600 text-white';
    return 'bg-zinc-800 text-white';
  };

  return (
    <Card className="modern-card border-slate-200 bg-white overflow-hidden animate-fade-in h-full flex flex-col">
      <CardHeader 
        className={cn(
          "px-6 sm:px-10 py-6 border-b border-slate-100 bg-zinc-50/50 shrink-0 cursor-pointer hover:bg-zinc-50 transition-colors",
          !isCollapsed && "sm:py-8"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-black rounded-lg shrink-0 shadow-lg"><Brain className="w-5 h-5 text-white" /></div>
              <div className="flex flex-col">
                <h3 className="pro-label text-sm sm:text-base">{lang.title}</h3>
                {isCollapsed && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Click to expand for AI insights</span>}
              </div>
            </div>
            {!isCollapsed && <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang.desc}</div>}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 flex-1 max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-full space-y-2">
                <label className="pro-label tracking-[0.2em] flex items-center gap-3 ml-1 mb-2 text-slate-500">
                  <MessageSquare className="w-4 h-4" /> {lang.instructionLabel}
                </label>
                <Textarea 
                  placeholder={lang.instructionPlaceholder}
                  className="text-sm min-h-[80px] bg-white text-black border border-slate-200 focus:ring-2 focus:ring-black focus:border-black rounded-xl p-4 font-bold placeholder:text-slate-300 transition-all shadow-sm"
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                />
              </div>
              <Button 
                className="bg-black hover:bg-zinc-800 text-white font-black h-[60px] px-8 rounded-xl shrink-0 w-full sm:w-auto transition-all active:scale-95 shadow-xl border border-zinc-700/50"
                onClick={callGeminiAPI}
                disabled={loading || assets.length === 0}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                <span className="text-[14px] tracking-[0.3em] uppercase">{loading ? lang.loading : lang.ctaButton}</span>
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsKeyModalOpen(true);
              }}
              className={cn(
                "h-8 px-2.5 rounded-lg border text-xs font-bold gap-1.5 transition-all shrink-0",
                hasApiKey 
                  ? "bg-emerald-50/80 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                  : "bg-amber-50/80 text-amber-700 border-amber-200 hover:bg-amber-100"
              )}
              title={hasApiKey ? lang.keyConfigured : lang.keyMissing}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{hasApiKey ? lang.keyConfigured : lang.keyMissing}</span>
            </Button>
            <div className="hidden lg:block">
              <Button variant="ghost" size="icon" className="rounded-full">
                {isCollapsed ? <Cpu className="w-5 h-5 text-slate-300" /> : <Target className="w-5 h-5 text-black" />}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="p-6 sm:p-10 flex-1 overflow-auto no-scrollbar">
          {insight ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-fade-in">
            <div className="xl:col-span-5 space-y-10">
              <div className="space-y-5">
                <h4 className="pro-label"><Target className="w-4 h-4" /> {lang.answer}</h4>
                <div className="text-[15px] font-black text-zinc-900 leading-relaxed border-l-[6px] border-black pl-8 py-4 bg-zinc-50 rounded-r-xl shadow-sm">
                  {insight.answer}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-zinc-100 shadow-xl">
                  <h4 className="pro-label mb-5">{lang.risk}</h4>
                  <Badge className={cn("text-[12px] font-black py-2 px-5 border-none uppercase tracking-[0.2em] rounded-full", getRiskColor(insight.riskLevel))}>
                    {insight.riskLevel}
                  </Badge>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-zinc-100 shadow-xl">
                  <div className="flex justify-between items-center mb-5">
                    <h4 className="pro-label">{lang.diversification}</h4>
                    <span className="text-sm font-black text-black">{insight.diversificationScore}%</span>
                  </div>
                  <Progress value={insight.diversificationScore} className="h-2.5 bg-zinc-100 [&>div]:bg-black" />
                </div>
              </div>
            </div>
            <div className="xl:col-span-7 space-y-10">
              <div className="space-y-5">
                <h4 className="pro-label"><ShieldCheck className="w-4 h-4" /> {lang.analysis}</h4>
                <p className="text-[14px] font-bold text-zinc-600 leading-loose bg-zinc-50/30 p-6 rounded-2xl border border-zinc-50">
                  {insight.analysis}
                </p>
              </div>
              <div className="space-y-6">
                <h4 className="pro-label"><Cpu className="w-4 h-4" /> {lang.recommendations}</h4>
                <div className="grid gap-3">
                  {insight.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-center gap-5 p-4 bg-white border-2 border-zinc-100 rounded-xl hover:border-black transition-all group shadow-sm">
                      <div className="w-7 h-7 rounded bg-black text-white flex items-center justify-center shrink-0 font-black text-[13px] group-hover:scale-110 transition-transform">{i + 1}</div>
                      <span className="text-[13px] font-black text-zinc-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center gap-6 opacity-10">
            <Brain className="w-20 h-20" />
            <p className="pro-label tracking-[0.5em]">點擊按鈕啟動專業資產審計</p>
          </div>
        )}
      </CardContent>
    )}

      {/* Gemini API Key Configuration Dialog */}
      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Key className="w-5 h-5 text-indigo-600" />
              {lang.apiKeyModalTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed pt-1">
              {lang.apiKeyModalDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">{lang.apiKeySettings}</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={lang.apiKeyPlaceholder}
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="pr-10 font-mono text-xs h-10 border-slate-200 focus:ring-2 focus:ring-black rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'zh' 
                  ? '可至 Google AI Studio (aistudio.google.com) 免費申請 Gemini API Key。' 
                  : 'Get a free key from Google AI Studio (aistudio.google.com).'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-row justify-between items-center sm:justify-between gap-2 pt-2">
            {hasApiKey ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearApiKey}
                className="text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl text-xs font-bold"
              >
                {lang.clearKey}
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsKeyModalOpen(false)}
                className="rounded-xl text-xs"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveApiKey}
                className="bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold px-4"
              >
                {lang.saveKey}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
