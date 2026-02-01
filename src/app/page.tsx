
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
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedSnapshots) setSnapshots(JSON.parse(savedSnapshots));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('assets', JSON.stringify(assets));
    localStorage.setItem('snapshots', JSON.stringify(snapshots));
  }, [assets, snapshots]);

  // Fetch live data
  const updateMarketData = async () => {
    setLoading(true);
    const cryptos = assets.filter(a => a.category === 'Crypto').map(a => a.symbol);
    const stocks = assets.filter(a => a.category === 'Stock').map(a => a.symbol);
    
    try {
      const data = await fetchMarketData({ cryptos, stocks });
      setMarketData(data);
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
      let price = 1; // Default for TWD cash
      
      if (asset.category === 'Crypto') {
        price = marketData.cryptoPrices[asset.symbol.toUpperCase()] || 0;
      } else if (asset.category === 'Stock') {
        price = marketData.stockPrices[asset.symbol.toUpperCase()] || 0;
      }

      let valueInTWD = 0;
      if (asset.currency === 'USD') {
        // If it's a USD Stock/Crypto, price is in USD
        if (asset.category === 'Stock' || asset.category === 'Crypto') {
          valueInTWD = asset.amount * price * marketData.exchangeRate;
        } else {
          // If it's USD Cash/Deposit
          valueInTWD = asset.amount * marketData.exchangeRate;
        }
      } else {
        // Base is TWD
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
      title: "Snapshot saved",
      description: `Total assets of NT$${assetCalculations.totalTWD.toLocaleString()} recorded.`
    });
  };

  const portfolioSummary = `Current portfolio: Total NT$${assetCalculations.totalTWD.toLocaleString()}. Allocation: ${assetCalculations.allocationData.map(d => `${d.name}: ${((d.value/assetCalculations.totalTWD)*100).toFixed(1)}%`).join(', ')}.`;
  const marketConditions = `USD/TWD rate is ${marketData.exchangeRate}. Cryptocurrencies are experiencing varied volatility. Major tech stocks are currently used as benchmark pricing.`;

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-accent" />
            Asset Insights
          </h1>
          <p className="text-muted-foreground mt-1">Track and optimize your personal wealth journey.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={updateMarketData} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Update Rates
          </Button>
          <Button 
            onClick={takeSnapshot} 
            className="bg-accent hover:bg-accent/90 flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Save Snapshot
          </Button>
        </div>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets (TWD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">NT$ {assetCalculations.totalTWD.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Converted from USD/TWD @ {marketData.exchangeRate}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Diversification</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <div className="text-2xl font-bold font-headline">
              {assets.length} <span className="text-sm font-normal text-muted-foreground">Assets</span>
            </div>
            <div className="flex -space-x-2">
              <Badge className="bg-blue-500 rounded-full border-2 border-white w-6 h-6 p-0 flex items-center justify-center"><Briefcase className="w-3 h-3" /></Badge>
              <Badge className="bg-orange-500 rounded-full border-2 border-white w-6 h-6 p-0 flex items-center justify-center"><Coins className="w-3 h-3" /></Badge>
              <Badge className="bg-green-500 rounded-full border-2 border-white w-6 h-6 p-0 flex items-center justify-center"><Banknote className="w-3 h-3" /></Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Tip Integration */}
        <div className="md:col-span-2">
          <AITipCard 
            portfolioSummary={portfolioSummary} 
            marketConditions={marketConditions} 
          />
        </div>
      </div>

      {/* Charts Section */}
      <PortfolioCharts 
        allocationData={assetCalculations.allocationData} 
        historicalData={snapshots} 
      />

      {/* Management Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Plus className="h-5 w-5 text-primary" />
                Add New Asset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AssetForm onAdd={addAsset} />
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="xl:col-span-2">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2 font-headline">
                <Wallet className="h-5 w-5 text-primary" />
                Asset List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Holdings</TableHead>
                    <TableHead>Price (Base)</TableHead>
                    <TableHead className="text-right">Value (TWD)</TableHead>
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
                            ? `$${asset.calculatedPrice?.toLocaleString()}` 
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
                  {assets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No assets added yet. Start by adding your first investment above!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
