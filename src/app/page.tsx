
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset, Snapshot, MarketData, AssetCategory } from './lib/types';
import { fetchMarketData } from '@/lib/api-service';
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
  Coins,
  Banknote,
  Briefcase
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

export default function AssetTrackerPage() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
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
      // 根據您的需求預設 0050 數據
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

  // Fetch live data
  const updateMarketData = async () => {
    setLoading(true);
    const cryptos = assets.filter(a => a.category === 'Crypto').map(a => a.symbol);
    const stocks = assets.filter(a => a.category === 'Stock').map(a => a.symbol);
    
    try {
      const data = await fetchMarketData({ cryptos, stocks });
      setMarketData(data);
      toast({
        title: "行情已更新",
        description: `匯率：${data.exchangeRate.toFixed(2)}，股票/加密貨幣已同步。`
      });
    } catch (error) {
      console.error('Market update failed', error);
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
        // TWD 計價資產 (如 0050) 直接乘上 TWD 價格
        valueInTWD = asset.amount * price;
      }

      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;

      return {
        ...asset,
        calculatedPrice: price,
        valueInTWD
      };
    });

    return { 
      processedAssets, 
      totalTWD, 
      allocationData: Object.entries(allocationMap).map(([name, value]) => ({ name, value }))
    };
  }, [assets, marketData]);

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
      allocations: assetCalculations.allocationData.map(d => ({ category: d.name as AssetCategory, value: d.value }))
    };
    setSnapshots(prev => [...prev, newSnapshot].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({
      title: "快照已存檔",
      description: `當前總資產 NT$${assetCalculations.totalTWD.toLocaleString()}。`
    });
  };

  const portfolioSummary = `Current portfolio: Total NT$${assetCalculations.totalTWD.toLocaleString()}. Allocation: ${assetCalculations.allocationData.map(d => `${d.name}: ${((d.value/assetCalculations.totalTWD)*100).toFixed(1)}%`).join(', ')}.`;
  const marketConditions = `USD/TWD rate is ${marketData.exchangeRate}. 0050 is trading around ${marketData.stockPrices['0050']} TWD.`;

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-accent" />
            Asset Insights
          </h1>
          <p className="text-muted-foreground mt-1">追蹤並優化您的個人資產組合。</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={updateMarketData} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            更新行情
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
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">總資產估值 (TWD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">NT$ {assetCalculations.totalTWD.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">匯率參考：USD/TWD @ {marketData.exchangeRate.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">資產類別多樣性</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div className="text-2xl font-bold font-headline">
              {assets.length} <span className="text-sm font-normal text-muted-foreground">項資產</span>
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
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
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
              <CardTitle className="flex items-center gap-2 font-headline">
                <Wallet className="h-5 w-5 text-primary" />
                資產明細
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>資產名稱</TableHead>
                    <TableHead>分類</TableHead>
                    <TableHead>持有量</TableHead>
                    <TableHead>市場單價</TableHead>
                    <TableHead className="text-right">估值 (TWD)</TableHead>
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
                          {asset.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">{asset.amount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{asset.currency}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">
                          {asset.category === 'Stock' || asset.category === 'Crypto' 
                            ? `${asset.currency === 'USD' ? '$' : 'NT$'}${asset.calculatedPrice?.toLocaleString()}` 
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        NT$ {asset.valueInTWD.toLocaleString()}
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
