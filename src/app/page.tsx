'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset, Snapshot, MarketData, AssetCategory, Currency } from './lib/types';
import { getMarketData } from '@/app/actions/market';
import { AssetForm } from '@/components/AssetForm';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Wallet, 
  History, 
  Trash2, 
  RefreshCw, 
  Plus,
  ArrowRightLeft
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AssetTrackerPage() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [marketData, setMarketData] = useState<MarketData>({
    exchangeRate: 32.5,
    cryptoPrices: {},
    stockPrices: {}
  });
  const [loading, setLoading] = useState(true);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedAssets = localStorage.getItem('assets');
    const savedSnapshots = localStorage.getItem('snapshots');
    
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    } else {
      const initialAssets: Asset[] = [
        {
          id: 'default-0050',
          name: '富邦/大昌/元大',
          symbol: '0050',
          category: 'Stock',
          amount: 19885,
          currency: 'TWD'
        }
      ];
      setAssets(initialAssets);
    }
    
    if (savedSnapshots) setSnapshots(JSON.parse(savedSnapshots));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (assets.length > 0) {
      localStorage.setItem('assets', JSON.stringify(assets));
    }
    if (snapshots.length > 0) {
      localStorage.setItem('snapshots', JSON.stringify(snapshots));
    }
  }, [assets, snapshots]);

  // Fetch live data via Server Action
  const updateMarketData = async () => {
    setLoading(true);
    const cryptos = assets.filter(a => a.category === 'Crypto').map(a => a.symbol);
    const stocks = assets.filter(a => a.category === 'Stock').map(a => a.symbol);
    
    try {
      const data = await getMarketData({ cryptos, stocks });
      setMarketData(data);
      toast({
        title: "市場數據已更新",
        description: `成功抓取 ${stocks.length} 項股票及 ${cryptos.length} 項加密貨幣數據。`
      });
    } catch (error) {
      console.error('Market update failed', error);
      toast({
        variant: "destructive",
        title: "抓取失敗",
        description: "目前無法連接到市場數據介面，請稍後再試。"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assets.length > 0) {
      updateMarketData();
    } else {
      setLoading(false);
    }
  }, [assets.length]);

  // Calculations
  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<AssetCategory, number> = {
      'Stock': 0,
      'Crypto': 0,
      'Bank': 0,
      'Fixed Deposit': 0,
      'Savings': 0,
    };

    const processedAssets = assets.map(asset => {
      let price = 1; 
      
      if (asset.category === 'Crypto') {
        price = marketData.cryptoPrices[asset.symbol.toUpperCase()] || 0;
      } else if (asset.category === 'Stock') {
        price = marketData.stockPrices[asset.symbol.toUpperCase()] || 0;
      }

      let valueInTWD = 0;
      if (asset.currency === 'USD') {
        if (asset.category === 'Stock' || asset.category === 'Crypto') {
          valueInTWD = asset.amount * price * marketData.exchangeRate;
        } else {
          valueInTWD = asset.amount * marketData.exchangeRate;
        }
      } else {
        // TWD 資產
        const multiplier = (asset.category === 'Stock' ? price : 1);
        valueInTWD = asset.amount * multiplier;
      }

      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;

      // 轉換為當前顯示幣別的價值
      const valueInDisplay = displayCurrency === 'TWD' ? valueInTWD : valueInTWD / marketData.exchangeRate;

      return {
        ...asset,
        calculatedPrice: price,
        valueInTWD,
        valueInDisplay
      };
    });

    const totalDisplay = displayCurrency === 'TWD' ? totalTWD : totalTWD / marketData.exchangeRate;

    return { 
      processedAssets, 
      totalTWD,
      totalDisplay,
      allocationData: Object.entries(allocationMap)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ 
          name, 
          value: displayCurrency === 'TWD' ? value : value / marketData.exchangeRate 
        }))
    };
  }, [assets, marketData, displayCurrency]);

  const addAsset = (newAsset: Omit<Asset, 'id'>) => {
    const id = crypto.randomUUID();
    setAssets(prev => [...prev, { ...newAsset, id }]);
  };

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const takeSnapshot = () => {
    const newSnapshot: Snapshot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      totalTWD: assetCalculations.totalTWD,
      allocations: assetCalculations.processedAssets.map(a => ({ category: a.category, value: a.valueInTWD }))
    };
    setSnapshots(prev => [...prev, newSnapshot].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({
      title: "快照已存檔",
      description: `當前總資產 NT$${assetCalculations.totalTWD.toLocaleString()}。`
    });
  };

  const portfolioSummary = `Current portfolio: Total NT$${assetCalculations.totalTWD.toLocaleString()}. Allocation: ${assetCalculations.allocationData.map(d => `${d.name}: ${((d.value/assetCalculations.totalDisplay)*100).toFixed(1)}%`).join(', ')}.`;
  const marketConditions = `USD/TWD rate is ${marketData.exchangeRate.toFixed(2)}. Market prices are live.`;

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-accent" />
            Asset Insights
          </h1>
          <p className="text-muted-foreground mt-1">追蹤您的全球與台灣資產組合。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="TWD">TWD</TabsTrigger>
              <TabsTrigger value="USD">USD</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="outline" 
            onClick={updateMarketData} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            更新數據
          </Button>
          <Button 
            onClick={takeSnapshot} 
            className="bg-accent hover:bg-accent/90 flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            存儲快照
          </Button>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">
              總資產估值 ({displayCurrency})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              {displayCurrency === 'USD' ? '$' : 'NT$'} {assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'USD' ? 2 : 0 })}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-white/50 w-fit px-2 py-1 rounded">
              <ArrowRightLeft className="h-3 w-3" />
              <span>1 USD = {marketData.exchangeRate.toFixed(2)} TWD</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">資產數量</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div className="text-2xl font-bold font-headline">
              {assets.length} <span className="text-sm font-normal text-muted-foreground">項</span>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <AITipCard 
            portfolioSummary={portfolioSummary} 
            marketConditions={marketConditions} 
          />
        </div>
      </div>

      <PortfolioCharts 
        allocationData={assetCalculations.allocationData} 
        historicalData={snapshots} 
        displayCurrency={displayCurrency}
        exchangeRate={marketData.exchangeRate}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-lg">
                <Plus className="h-5 w-5 text-primary" />
                新增資產
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AssetForm onAdd={addAsset} />
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2 font-headline text-lg text-primary">
                <Wallet className="h-5 w-5" />
                資產明細
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>資產名稱 / 代號</TableHead>
                    <TableHead>分類</TableHead>
                    <TableHead>持有量</TableHead>
                    <TableHead>市場單價</TableHead>
                    <TableHead className="text-right">估值 ({displayCurrency})</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetCalculations.processedAssets.map(asset => (
                    <TableRow key={asset.id} className="group">
                      <TableCell>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-xs text-muted-foreground uppercase">{asset.symbol}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {asset.category === 'Savings' ? '活期存款' : 
                           asset.category === 'Stock' ? '股票' : 
                           asset.category === 'Crypto' ? '加密貨幣' : 
                           asset.category === 'Fixed Deposit' ? '定期存款' : '其他'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono flex items-baseline gap-1">
                          <span>{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
                          <span className="text-[10px] text-muted-foreground font-sans">
                            {asset.category === 'Stock' ? '股' : 
                             asset.category === 'Crypto' ? asset.symbol.toUpperCase() : 
                             asset.currency}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">
                          {asset.category === 'Stock' || asset.category === 'Crypto' 
                            ? `${asset.currency === 'USD' ? '$' : 'NT$'}${asset.calculatedPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {displayCurrency === 'USD' ? '$' : 'NT$'} {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'USD' ? 2 : 0 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeAsset(asset.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
