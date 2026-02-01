
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getFinancialTip } from '@/ai/flows/financial-tooltip';

interface AITipCardProps {
  portfolioSummary: string;
  marketConditions: string;
}

export function AITipCard({ portfolioSummary, marketConditions }: AITipCardProps) {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTip = async () => {
    setLoading(true);
    try {
      const response = await getFinancialTip({ portfolioSummary, marketConditions });
      setTip(response.tip);
    } catch (error) {
      console.error('Failed to get tip:', error);
      setTip("Diversification is key to long-term growth. Consider balancing your portfolio across different asset classes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/20 bg-accent/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-accent font-headline">
            <Sparkles className="h-5 w-5" />
            AI Insights
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
          Personalized advice based on your current allocation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tip ? (
          <p className="text-sm leading-relaxed text-foreground/80 italic">
            "{tip}"
          </p>
        ) : (
          <div className="text-sm text-muted-foreground flex flex-col items-center py-4 text-center">
            <p>Ready to analyze your portfolio?</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTip} 
              className="mt-3 border-accent text-accent hover:bg-accent hover:text-white"
            >
              Generate Tip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
