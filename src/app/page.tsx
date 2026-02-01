
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
  ArrowRightLeft,
  Edit2,
  Check,
  X
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
import { Input } from '@/components/ui/input';

export default function AssetTrackerPage() {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [marketData, setMarketData] = useState<MarketData>({
    exchangeRate: 32.5,
    rates: { TWD: 32.5, CNY: 7.2, USD: 1 },
    cryptoPrices: {},
    stockPrices: {}
  });
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

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
    } else {
      localStorage.removeItem('assets');
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
        description: `成功抓取數據。1 USD = ${data.rates.TWD.toFixed(2)} TWD / ${data.rates.CNY.toFixed(2)} CNY`
      });
    } catch (error) {
      console.error('Market update failed', error);
      toast({
        variant: "destructive",
        title: "抓取失敗",
        description: "目前無法連接到市場數據介面。"
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
        const usdValue = (asset.category === 'Stock' || asset.category === 'Crypto') 
          ? asset.amount * price 
          : asset.amount;
        valueInTWD = usdValue * marketData.rates.TWD;
      } else if (asset.currency === 'CNY') {
        // CNY to TWD via USD cross rate
        valueInTWD = asset.amount * (marketData.rates.TWD / marketData.rates.CNY);
      } else {
        // TWD 資產
        const multiplier = (asset.category === 'Stock' ? price : 1);
        valueInTWD = asset.amount * multiplier;
      }

      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;

      // 轉換為當前顯示幣別
      let valueInDisplay = valueInTWD;
      if (displayCurrency === 'USD') {
        valueInDisplay = valueInTWD / marketData.rates.TWD;
      } else if (displayCurrency === 'CNY') {
        valueInDisplay = valueInTWD * (marketData.rates.CNY / marketData.rates.TWD);
      }

      return {
        ...asset,
        calculatedPrice: price,
        valueInTWD,
        valueInDisplay
      };
    });

    let totalDisplay = totalTWD;
    if (displayCurrency === 'USD') {
      totalDisplay = totalTWD / marketData.rates.TWD;
    } else if (displayCurrency === 'CNY') {
      totalDisplay = totalTWD * (marketData.rates.CNY / marketData.rates.TWD);
    }

    return { 
      processedAssets, 
      totalTWD,
      totalDisplay,
      allocationData: Object.entries(allocationMap)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => {
          let displayVal = value;
          if (displayCurrency === 'USD') displayVal = value / marketData.rates.TWD;
          if (displayCurrency === 'CNY') displayVal = value * (marketData.rates.CNY / marketData.rates.TWD);
          return { name, value: displayVal };
        })
    };
  }, [assets, marketData, displayCurrency]);

  const addAsset = (newAsset: Omit<Asset, 'id'>) => {
    const id = crypto.randomUUID();
    setAssets(prev => [...prev, { ...newAsset, id }]);
  };

  const removeAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const startEditing = (asset: Asset) => {
    setEditingId(asset.id);
    setEditAmount(asset.amount.toString());
  };

  const saveEdit = () => {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount < 0) {
      toast({
        variant: "destructive",
        title: "無效的數值",
        description: "請輸入大於或等於 0 的數字。"
      });
      return;
    }

    setAssets(prev => prev.map(a => 
      a.id === editingId ? { ...a, amount: newAmount } : a
    ));
    setEditingId(null);
    toast({
      title: "持有量已更新",
      description: "資產數據已成功修改。"
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
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

  const getCurrencySymbol = (cur: Currency) => {
    if (cur === 'USD') return '$';
    if (cur === 'CNY') return '¥';
    return 'NT$';
  };

  const portfolioSummary = `Current portfolio total: NT$${assetCalculations.totalTWD.toLocaleString()}.`;
  const marketConditions = `Rates: 1 USD = ${marketData.rates.TWD.toFixed(2)} TWD, ${marketData.rates.CNY.toFixed(2)} CNY.`;

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-accent" />
            Asset Insights
          </h1>
          <p className="text-muted-foreground mt-1">追蹤全球資產組合。</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="TWD">TWD</TabsTrigger>
              <TabsTrigger value="USD">USD</TabsTrigger>
              <TabsTrigger value="CNY">CNY</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={updateMarketData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            更新數據
          </Button>
          <Button onClick={takeSnapshot} className="bg-accent hover:bg-accent/90">
            <History className="h-4 w-4 mr-2" />
            存儲快照
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">
              總資產估值 ({displayCurrency})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              {getCurrencySymbol(displayCurrency)} {assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-2 bg-white/50 w-fit px-2 py-1 rounded">
              1 USD = {marketData.rates.TWD.toFixed(2)} TWD / {marketData.rates.CNY.toFixed(2)} CNY
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">資產數量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{assets.length} <span className="text-sm font-normal">項</span></div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <AITipCard portfolioSummary={portfolioSummary} marketConditions={marketConditions} />
        </div>
      </div>

      <PortfolioCharts 
        allocationData={assetCalculations.allocationData} 
        historicalData={snapshots} 
        displayCurrency={displayCurrency}
        rates={marketData.rates}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <Card><CardHeader><CardTitle className="text-lg">新增資產</CardTitle></CardHeader>
            <CardContent><AssetForm onAdd={addAsset} /></CardContent>
          </Card>
        </div>
        <div className="xl:col-span-2">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>資產名稱</TableHead>
                  <TableHead>持有量</TableHead>
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
                      {editingId === asset.id ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={editAmount} 
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-8 w-24 text-sm font-mono"
                            step="any"
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={cancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/amount">
                          <div className="font-mono text-sm">
                            {asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              {asset.category === 'Stock' ? '股' : asset.category === 'Crypto' ? asset.symbol : asset.currency}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover/amount:opacity-100 transition-opacity"
                            onClick={() => startEditing(asset)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {getCurrencySymbol(displayCurrency)} {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
