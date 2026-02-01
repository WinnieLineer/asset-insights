'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, AlertTriangle, PieChart, CheckCircle2 } from 'lucide-react';
import { getFinancialTip, type FinancialTipOutput } from '@/ai/flows/financial-tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AITipCardProps {
  portfolioSummary: string;
  marketConditions: string;
}

export function AITipCard({ portfolioSummary, marketConditions }: AITipCardProps) {
  const [insight, setInsight] = useState<FinancialTipOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTip = async () => {
    setLoading(true);
    try {
      const response = await getFinancialTip({ portfolioSummary, marketConditions });
      setInsight(response);
    } catch (error) {
      console.error('Failed to get insight:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === '低') return 'bg-green-100 text-green-700 border-green-200';
    if (level === '中') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  return (
    <Card className="border-accent/20 bg-accent/5 overflow-hidden h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-accent font-headline">
            <Sparkles className="h-5 w-5" />
            AI 財務顧問
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchTip} 
            disabled={loading}
            className="hover:bg-accent/10 text-accent"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          基於您的即時資產配置進行深度分析。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {insight ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                現狀分析
              </h4>
              <p className="text-sm text-foreground/80 leading-relaxed bg-white/50 p-3 rounded-lg border border-accent/10">
                {insight.analysis}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">風險評估</h4>
                <Badge variant="outline" className={getRiskColor(insight.riskLevel)}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {insight.riskLevel} 風險
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">配置多樣性</h4>
                  <span className="text-xs font-bold">{insight.diversificationScore}%</span>
                </div>
                <Progress value={insight.diversificationScore} className="h-1.5" />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                行動建議
              </h4>
              <ul className="space-y-2">
                {insight.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs flex gap-2 text-foreground/70 items-start">
                    <span className="text-accent mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground flex flex-col items-center py-8 text-center space-y-4">
            <div className="p-4 bg-accent/10 rounded-full">
              <Sparkles className="h-8 w-8 text-accent/50" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">準備好分析您的資產組合了嗎？</p>
              <p className="text-xs">點擊按鈕獲取由 AI 生成的深度洞察報告。</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTip} 
              disabled={loading}
              className="mt-2 border-accent text-accent hover:bg-accent hover:text-white"
            >
              {loading ? '分析中...' : '產生深度報告'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
