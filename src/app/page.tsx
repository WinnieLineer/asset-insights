
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
  X,
  Eye,
  Calendar
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  // Selected snapshot for detail view
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

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
        description: `成功抓取數據。1 USD = ${data.rates.TWD.toFixed(2)} TWD`
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
      let currentPrice = 1; 
      
      if (asset.category === 'Crypto') {
        currentPrice = marketData.cryptoPrices[asset.symbol.toUpperCase()] || 0;
      } else if (asset.category === 'Stock') {
        currentPrice = marketData.stockPrices[asset.symbol.toUpperCase()] || 0;
      }

      let valueInTWD = 0;
      if (asset.currency === 'USD') {
        const usdValue = (asset.category === 'Stock' || asset.category === 'Crypto') 
          ? asset.amount * currentPrice 
          : asset.amount;
        valueInTWD = usdValue * marketData.rates.TWD;
      } else if (asset.currency === 'CNY') {
        valueInTWD = asset.amount * (marketData.rates.TWD / marketData.rates.CNY);
      } else {
        const multiplier = (asset.category === 'Stock' ? (currentPrice || 1) : 1);
        valueInTWD = asset.amount * multiplier;
      }

      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;

      let valueInDisplay = valueInTWD;
      if (displayCurrency === 'USD') valueInDisplay = valueInTWD / marketData.rates.TWD;
      else if (displayCurrency === 'CNY') valueInDisplay = valueInTWD * (marketData.rates.CNY / marketData.rates.TWD);

      return {
        ...asset,
        calculatedPrice: currentPrice,
        valueInTWD,
        valueInDisplay
      };
    });

    let totalDisplay = totalTWD;
    if (displayCurrency === 'USD') totalDisplay = totalTWD / marketData.rates.TWD;
    else if (displayCurrency === 'CNY') totalDisplay = totalTWD * (marketData.rates.CNY / marketData.rates.TWD);

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
      toast({ variant: "destructive", title: "無效數值" });
      return;
    }
    setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: newAmount } : a));
    setEditingId(null);
  };

  const takeSnapshot = () => {
    const newSnapshot: Snapshot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      totalTWD: assetCalculations.totalTWD,
      allocations: assetCalculations.processedAssets.map(a => ({ category: a.category, value: a.valueInTWD })),
      assets: assetCalculations.processedAssets.map(a => ({
        ...a,
        price: a.calculatedPrice, // 存檔時捕捉價格
        valueInTWD: a.valueInTWD    // 存檔時捕捉台幣價值
      }))
    };
    setSnapshots(prev => [...prev, newSnapshot].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({
      title: "快照已存檔",
      description: `當前總資產 NT$${assetCalculations.totalTWD.toLocaleString(undefined, { maximumFractionDigits: 0 })}。`
    });
  };

  const deleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
    toast({ title: "快照已刪除" });
  };

  const getCurrencySymbol = (cur: Currency) => {
    if (cur === 'USD') return '$';
    if (cur === 'CNY') return '¥';
    return 'NT$';
  };

  const convertTWDToDisplay = (twdVal: number) => {
    if (displayCurrency === 'USD') return twdVal / marketData.rates.TWD;
    if (displayCurrency === 'CNY') return twdVal * (marketData.rates.CNY / marketData.rates.TWD);
    return twdVal;
  };

  const portfolioSummary = `Current portfolio total: NT$${assetCalculations.totalTWD.toLocaleString()}.`;
  const marketConditions = `Rates: 1 USD = ${marketData.rates.TWD.toFixed(2)} TWD.`;

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-accent" />
            Asset Insights
          </h1>
          <p className="text-muted-foreground mt-1">追蹤全球資產組合與歷史變動。</p>
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
        <div className="xl:col-span-1 space-y-8">
          <Card>
            <CardHeader><CardTitle className="text-lg">新增資產</CardTitle></CardHeader>
            <CardContent><AssetForm onAdd={addAsset} /></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                歷史快照清單
              </CardTitle>
              <CardDescription>管理您過去儲存的資產記錄。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshots.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">尚未有任何快照。</div>
              ) : (
                snapshots.slice().reverse().map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="text-sm font-medium">{new Date(s.date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSnapshot(s)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>快照詳情 - {new Date(s.date).toLocaleString()}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="p-4 bg-muted/30">
                                <div className="text-xs text-muted-foreground uppercase">當時總資產 ({displayCurrency})</div>
                                <div className="text-xl font-bold">
                                  {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                                </div>
                              </Card>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>資產</TableHead>
                                  <TableHead>當時數量</TableHead>
                                  <TableHead className="text-right">當時估值 ({displayCurrency})</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {s.assets?.map((a, idx) => {
                                  // 使用儲存時的台幣價值進行當前幣別換算，確保與總額一致
                                  const displayValue = convertTWDToDisplay(a.valueInTWD || 0);
                                  return (
                                    <TableRow key={idx}>
                                      <TableCell>
                                        <div className="text-sm font-medium">{a.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{a.symbol}</div>
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {a.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })} 
                                        <span className="ml-1 text-[10px] text-muted-foreground">
                                          {a.category === 'Stock' ? '股' : a.category === 'Crypto' ? a.symbol : a.currency}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right font-medium text-primary">
                                        {getCurrencySymbol(displayCurrency)} {displayValue.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSnapshot(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="xl:col-span-2">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>資產名稱</TableHead>
                  <TableHead>市場單價</TableHead>
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
                      <div className="text-sm font-mono text-muted-foreground">
                        {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                          asset.calculatedPrice > 0 ? (
                            <>
                              {getCurrencySymbol(asset.category === 'Stock' && /^\d+$/.test(asset.symbol) ? 'TWD' : 'USD')}
                              {asset.calculatedPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </>
                          ) : (
                            '抓取中...'
                          )
                        ) : (
                          '--'
                        )}
                      </div>
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
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingId(null)}>
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
