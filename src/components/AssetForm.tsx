'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Asset, AssetCategory, Currency } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const AUTOCOMPLETE_API = 'https://script.google.com/macros/s/AKfycbyQ12dBnspvRGwcNRZmZw3sXon8tnmPTttJ2b5LDw_3G1Zw7aaM6OPe9dSLhPPv-xRL/exec?q=';

const t = {
  en: {
    name: 'Asset Name',
    namePlaceholder: 'e.g., Apple Inc.',
    symbol: 'Ticker / Symbol',
    symbolPlaceholder: 'Search BTC, AAPL, 2330...',
    category: 'Category',
    currency: 'Base Currency',
    amount: 'Holdings',
    date: 'Acquisition Date',
    endDate: 'Closure Date',
    submit: 'Add to Portfolio',
    categories: { Stock: 'Equity', Crypto: 'Crypto', Savings: 'Deposit', Bank: 'Other', ETF: 'ETF', Option: 'Option' },
    errors: { 
      nameTooShort: 'Min 2 characters', 
      invalidAmount: 'Positive number required', 
      required: 'Required', 
      tickerRequired: 'Ticker symbol is required',
      invalidTicker: 'Ticker not found, please check symbol'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台積電、美金存款',
    symbol: '資產代碼',
    symbolPlaceholder: '搜尋 BTC, AAPL, 2330...',
    category: '資產類別',
    currency: '持有幣別',
    amount: '持有數量',
    date: '持有日期',
    endDate: '結清日期 (選填)',
    submit: '新增部位',
    categories: { Stock: '股票', Crypto: '加密貨幣', Savings: '存款', Bank: '其他資產', ETF: 'ETF', Option: '選擇權' },
    errors: { 
      nameTooShort: '至少 2 個字', 
      invalidAmount: '請輸入有效的正數', 
      required: '必填', 
      tickerRequired: '此類別必須填寫代號',
      invalidTicker: '查無此資產代碼，請重新輸入'
    }
  }
};

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  language: 'en' | 'zh';
}

interface Suggestion {
  symbol: string;
  name: string;
  exchDisp: string;
  typeDisp: string;
}

const PREDEFINED_CATEGORIES = ['Stock', 'ETF', 'Crypto', 'Option', 'Savings', 'Bank'];

export function AssetForm({ onAdd, language }: AssetFormProps) {
  const lang = t[language];
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tickerFound, setTickerFound] = useState<boolean | null>(null);
  const isManualTyping = useRef(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const formSchema = useMemo(() => z.object({
    name: z.string().min(2, { message: lang.errors.nameTooShort }),
    symbol: z.string().optional(),
    category: z.string().min(1, { message: lang.errors.required }),
    amount: z.number({ invalid_type_error: lang.errors.invalidAmount }).min(0, { message: lang.errors.invalidAmount }),
    currency: z.enum(['TWD', 'USD', 'CNY', 'SGD']),
    acquisitionDate: z.string().min(1, { message: lang.errors.required }),
    endDate: z.string().optional(),
  }).refine((data) => {
    const marketCats = ['Stock', 'Crypto', 'ETF', 'Option'];
    if (marketCats.includes(data.category) && (!data.symbol || data.symbol.trim() === '')) return false;
    return true;
  }, { message: lang.errors.tickerRequired, path: ['symbol'] })
    .refine((data) => {
      if (data.symbol && data.symbol.trim() !== '' && tickerFound === false) return false;
      return true;
    }, { message: lang.errors.invalidTicker, path: ['symbol'] }), [lang, tickerFound]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: '', 
      symbol: '', 
      category: 'Stock', 
      amount: 0, 
      currency: 'TWD',
      acquisitionDate: new Date().toISOString().split('T')[0],
      endDate: ''
    },
  });

  const category = form.watch('category');
  const symbolValue = form.watch('symbol');
  
  useEffect(() => {
    if (!isManualTyping.current || !symbolValue || symbolValue.length < 1) {
      if (!symbolValue) {
        setSuggestions([]);
        setTickerFound(null);
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`${AUTOCOMPLETE_API}${encodeURIComponent(symbolValue)}`);
        if (response.ok) {
          const data = await response.json();
          const results = data.ResultSet?.Result || [];
          setSuggestions(results.map((r: any) => ({
            symbol: r.symbol,
            name: r.name,
            exchDisp: r.exchDisp,
            typeDisp: r.typeDisp
          })));
          setTickerFound(results.length > 0);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        setTickerFound(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [symbolValue]);

  useEffect(() => {
    const marketCats = ['Stock', 'Crypto', 'ETF', 'Option'];
    if (marketCats.includes(category)) {
      const sym = (symbolValue || '').toUpperCase();
      if (/^\d+$/.test(sym) || sym.endsWith('.TW')) form.setValue('currency', 'TWD');
      else if (sym.endsWith('.SI')) form.setValue('currency', 'SGD');
      else if (sym) form.setValue('currency', 'USD');
    }
  }, [category, symbolValue, form]);

  const selectSuggestion = (s: Suggestion) => {
    isManualTyping.current = false;
    form.setValue('symbol', s.symbol);
    form.setValue('name', s.name);
    
    const typeDispRaw = (s.typeDisp || '').trim();
    const typeDisp = typeDispRaw.toUpperCase();
    
    let targetCat = 'Stock';
    
    if (typeDisp.includes('ETF') || typeDisp.includes('交易所買賣基金')) {
      targetCat = 'ETF';
    } else if (typeDisp.includes('CRYPTOCURRENCY') || typeDisp.includes('加密貨幣')) {
      targetCat = 'Crypto';
    } else if (typeDisp.includes('OPTION') || typeDisp.includes('選擇權')) {
      targetCat = 'Option';
    } else if (typeDisp.includes('EQUITY') || typeDisp.includes('股票')) {
      targetCat = 'Stock';
    } else if (typeDispRaw !== '') {
      targetCat = typeDispRaw;
    }

    form.setValue('category', targetCat);
    setTickerFound(true);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const onSubmit = (v: z.infer<typeof formSchema>) => {
    onAdd(v as Omit<Asset, 'id'>);
    form.reset({
      ...v,
      name: '',
      symbol: '',
      amount: 0,
      endDate: ''
    });
    setTickerFound(null);
    isManualTyping.current = false;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-slate-500">{lang.category}</FormLabel>
            <Select onValueChange={(val) => { field.onChange(val); setTickerFound(null); }} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-11 bg-slate-50 border-2 border-slate-200 text-sm font-bold rounded-lg transition-all focus:border-black">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PREDEFINED_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="text-sm font-bold">
                    {lang.categories[c as keyof typeof lang.categories] || c}
                  </SelectItem>
                ))}
                {field.value && !PREDEFINED_CATEGORIES.includes(field.value) && (
                  <SelectItem value={field.value} className="text-sm font-bold">{field.value}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </FormItem>
        )} />

        <FormField control={form.control} name="symbol" render={({ field }) => (
          <FormItem className="relative">
            <FormLabel className="pro-label text-slate-500">{lang.symbol}</FormLabel>
            <FormControl>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
                </div>
                <Input 
                  placeholder={lang.symbolPlaceholder} 
                  {...field} 
                  autoComplete="off"
                  onChange={(e) => {
                    isManualTyping.current = true;
                    field.onChange(e);
                  }}
                  className={cn(
                    "bg-slate-50 border-2 h-11 text-sm font-bold uppercase tracking-widest focus:ring-black focus:border-black rounded-lg pl-10 pr-4 transition-colors",
                    tickerFound === false ? "border-rose-300" : "border-slate-200"
                  )} 
                />
              </div>
            </FormControl>
            
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionRef} className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] bg-white border-2 border-slate-200 rounded-xl shadow-2xl max-h-[280px] overflow-auto no-scrollbar animate-fade-in">
                {suggestions.map((s, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => selectSuggestion(s)}
                    className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <div className="font-black text-sm text-slate-900 leading-tight">{s.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[12px] font-black text-blue-600 tracking-wider uppercase">{s.symbol}</span>
                      <span className="text-[11px] font-bold text-slate-400">{s.typeDisp}-{s.exchDisp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <FormMessage className="text-xs font-bold text-rose-500" />
          </FormItem>
        )} />

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-slate-500">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-slate-50 border-2 border-slate-200 h-11 text-sm font-bold focus:ring-black focus:border-black rounded-lg" />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.currency}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="h-11 bg-slate-50 border-2 border-slate-200 text-sm font-bold rounded-lg"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{['TWD', 'USD', 'CNY', 'SGD'].map(c => <SelectItem key={c} value={c} className="text-sm font-bold">{c}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-slate-500">{lang.amount}</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="any" 
                {...field} 
                onFocus={(e) => e.target.select()}
                onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                className="h-11 font-bold bg-slate-50 border-2 border-slate-200 text-sm rounded-lg" 
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="acquisitionDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.date}</FormLabel>
              <FormControl><Input type="date" {...field} className="h-11 font-bold bg-slate-50 border-2 border-slate-200 text-sm rounded-lg" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.endDate}</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value || ''} className="h-11 font-bold bg-slate-50 border-2 border-slate-200 text-sm rounded-lg" /></FormControl>
            </FormItem>
          )} />
        </div>
        
        <Button 
          type="submit" 
          disabled={tickerFound === false || isSearching}
          className="w-full h-11 bg-black hover:bg-slate-800 text-white font-bold rounded-lg text-sm uppercase tracking-widest shadow-md transition-all active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {lang.submit}
        </Button>
      </form>
    </Form>
  );
}
