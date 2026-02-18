'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Asset } from '@/app/lib/types';
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
import { Loader2, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const AUTOCOMPLETE_API = 'https://script.google.com/macros/s/AKfycbyQ12dBnspvRGwcNRZmZw3sXon8tnmPTttJ2b5LDw_3G1Zw7aaM6OPe9dSLhPPv-xRL/exec?q=';

const t = {
  en: {
    name: 'Asset Name',
    namePlaceholder: 'e.g., Apple Inc.',
    symbol: 'Ticker / Symbol',
    symbolPlaceholder: 'BTC, AAPL, 2330...',
    category: 'Category',
    customCategory: 'Custom Category',
    currency: 'Currency',
    amount: 'Holdings',
    date: 'Starting Holding Date',
    endDate: 'Closed Date',
    submit: 'Add Position',
    categories: { Stock: 'Equity', Crypto: 'Crypto', Savings: 'Deposit', Bank: 'Other', ETF: 'ETF', Option: 'Option', Fund: 'Fund', Index: 'Index', Future: 'Future', Forex: 'Forex', Custom: 'Custom...' },
    errors: { 
      nameTooShort: 'Min 2 characters', 
      invalidAmount: 'Invalid amount', 
      required: 'Required', 
      tickerRequired: 'Symbol required for market assets',
      invalidTicker: 'Invalid symbol or not found'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台積電、美金存款',
    symbol: '資產代碼',
    symbolPlaceholder: '搜尋 BTC, AAPL, 2330...',
    category: '資產類別',
    customCategory: '自定義類別名稱',
    currency: '持有幣別',
    amount: '持有數量',
    date: '起始持有日期',
    endDate: '結清日期',
    submit: '新增部位',
    categories: { Stock: '股票', Crypto: '加密貨幣', Savings: '存款', Bank: '其他資產', ETF: 'ETF', Option: '選擇權', Fund: '基金', Index: '指數', Future: '期貨', Forex: '外匯', Custom: '自定義...' },
    errors: { 
      nameTooShort: '至少 2 個字', 
      invalidAmount: '請輸入有效的正數', 
      required: '必填', 
      tickerRequired: '此類別必須填寫代號',
      invalidTicker: '無效的資產代碼或查無此代號'
    }
  }
};

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  language: 'en' | 'zh';
  hideSubmit?: boolean;
}

interface Suggestion {
  symbol: string;
  name: string;
  exchDisp: string;
  typeDisp: string;
}

const PREDEFINED_CATEGORIES = ['Stock', 'ETF', 'Crypto', 'Forex', 'Fund', 'Index', 'Future', 'Option', 'Savings', 'Bank'];

export function AssetForm({ onAdd, language, hideSubmit = false }: AssetFormProps) {
  const lang = t[language];
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tickerFound, setTickerFound] = useState<boolean | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const isManualTyping = useRef(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const startOfYear = `${new Date().getFullYear()}-01-01`;

  const formSchema = useMemo(() => z.object({
    name: z.string().min(2, { message: lang.errors.nameTooShort }),
    symbol: z.string().optional(),
    category: z.string().min(1, { message: lang.errors.required }),
    amount: z.number({ invalid_type_error: lang.errors.invalidAmount }).min(0, { message: lang.errors.invalidAmount }),
    currency: z.enum(['TWD', 'USD', 'CNY', 'SGD']),
    acquisitionDate: z.string().min(1, { message: lang.errors.required }),
    endDate: z.string().optional(),
  }).refine((data) => {
    const skipValidation = ['Savings', 'Bank', 'Custom'].includes(data.category) || isCustomCategory;
    if (skipValidation) return true;
    if (!data.symbol || data.symbol.trim() === '') return false;
    if (tickerFound === false) return false;
    return true;
  }, { message: lang.errors.tickerRequired, path: ['symbol'] }), [lang, isCustomCategory, tickerFound]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: '', 
      symbol: '', 
      category: 'Stock', 
      amount: 0, 
      currency: 'TWD',
      acquisitionDate: startOfYear,
      endDate: ''
    },
  });

  const symbolValue = form.watch('symbol');
  const showCurrencyField = !symbolValue || symbolValue.trim() === '';
  
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
        setTickerFound(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [symbolValue]);

  const selectSuggestion = (s: Suggestion) => {
    isManualTyping.current = false;
    form.setValue('symbol', s.symbol);
    form.setValue('name', s.name);
    
    const rawType = (s.typeDisp || '').trim().toUpperCase();
    let candidateCat = '';
    if (rawType.includes('ETF')) candidateCat = 'ETF';
    else if (rawType.includes('CRYPTO')) candidateCat = 'Crypto';
    else if (rawType.includes('CURRENCY') || rawType.includes('FOREX')) candidateCat = 'Forex';
    else if (rawType.includes('FUND')) candidateCat = 'Fund';
    else if (rawType.includes('INDEX')) candidateCat = 'Index';
    else if (rawType.includes('FUTURE')) candidateCat = 'Future';
    else if (rawType.includes('OPTION')) candidateCat = 'Option';
    else if (rawType.includes('EQUITY') || rawType.includes('STOCK')) candidateCat = 'Stock';
    else candidateCat = s.typeDisp || '';

    if (PREDEFINED_CATEGORIES.includes(candidateCat)) {
      setIsCustomCategory(false);
      form.setValue('category', candidateCat);
    } else {
      setIsCustomCategory(true);
      form.setValue('category', candidateCat || 'Custom');
    }
    
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
    setIsCustomCategory(false);
    isManualTyping.current = false;
  };

  return (
    <Form {...form}>
      <form id="add-asset-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-[10px] opacity-60">{lang.category}</FormLabel>
            {!isCustomCategory ? (
              <Select onValueChange={(val) => { 
                if (val === 'CUSTOM_ENTRY') {
                  setIsCustomCategory(true);
                  field.onChange('');
                } else {
                  field.onChange(val); 
                }
              }} value={field.value || "Stock"}>
                <FormControl>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[13px] font-bold rounded-lg focus:border-black">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-[13px] font-bold">
                      {lang.categories[c as keyof typeof lang.categories] || c}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM_ENTRY" className="text-[13px] font-black text-blue-600 border-t border-slate-100">
                    <div className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> {lang.categories.Custom}</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <FormControl>
                  <Input 
                    placeholder={lang.customCategory} 
                    autoFocus 
                    value={field.value} 
                    onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }}
                    onChange={(e) => field.onChange(e.target.value)} 
                    className="bg-slate-50 border-slate-200 h-9 text-[13px] font-bold rounded-lg" 
                  />
                </FormControl>
                <Button variant="ghost" type="button" className="h-9 px-3 font-black text-slate-400" onClick={() => { setIsCustomCategory(false); field.onChange('Stock'); }}>X</Button>
              </div>
            )}
            <FormMessage className="text-[10px] font-bold text-rose-500" />
          </FormItem>
        )} />

        <FormField control={form.control} name="symbol" render={({ field }) => (
          <FormItem className="relative">
            <FormLabel className="pro-label text-[10px] opacity-60">{lang.symbol}</FormLabel>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> : <Search className="w-3.5 h-3.5 text-slate-400" />}
              </div>
              <FormControl>
                <Input 
                  placeholder={lang.symbolPlaceholder} 
                  {...field} 
                  autoComplete="off"
                  onChange={(e) => { isManualTyping.current = true; field.onChange(e); }}
                  onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }}
                  className={cn("bg-slate-50 border-slate-200 h-9 text-[13px] font-bold uppercase focus:border-black rounded-lg pl-9", tickerFound === false && !isCustomCategory && "border-rose-300")} 
                />
              </FormControl>
              {showSuggestions && suggestions.length > 0 && (
                <div ref={suggestionRef} className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] bg-white border border-slate-200 rounded-lg shadow-xl max-h-[200px] overflow-auto no-scrollbar">
                  {suggestions.map((s, idx) => (
                    <div key={idx} onClick={() => selectSuggestion(s)} className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                      <div className="font-black text-xs text-slate-900 leading-tight">{s.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-black text-blue-600 uppercase">{s.symbol}</span>
                        <span className="text-[10px] font-bold text-slate-400">{s.typeDisp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <FormMessage className="text-[10px] font-bold text-rose-500" />
          </FormItem>
        )} />

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-[10px] opacity-60">{lang.name}</FormLabel>
            <FormControl>
              <Input 
                placeholder={lang.namePlaceholder} 
                {...field} 
                onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }} 
                className="bg-slate-50 border-slate-200 h-9 text-[13px] font-bold rounded-lg" 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
          {showCurrencyField ? (
            <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem>
                <FormLabel className="pro-label text-[10px] opacity-60">{lang.currency}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[13px] font-bold rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>{['TWD', 'USD', 'CNY', 'SGD'].map(c => <SelectItem key={c} value={c} className="text-[13px] font-bold">{c}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
          ) : null}
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem className={cn(showCurrencyField ? "" : "col-span-2")}>
              <FormLabel className="pro-label text-[10px] opacity-60">{lang.amount}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="any" 
                  {...field} 
                  onFocus={(e) => {
                    const target = e.currentTarget;
                    setTimeout(() => target.select(), 50);
                  }}
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                  className="h-9 font-bold bg-slate-50 border-slate-200 text-[13px] rounded-lg" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="acquisitionDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-[10px] opacity-60">{lang.date}</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="h-9 font-bold bg-slate-50 border-slate-200 text-[13px] rounded-lg" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-[10px] opacity-60">{lang.endDate}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} className="h-9 font-bold bg-slate-50 border-slate-200 text-[13px] rounded-lg" />
              </FormControl>
            </FormItem>
          )} />
        </div>
        
        {!hideSubmit && (
          <Button type="submit" className="w-full h-10 bg-slate-900 hover:bg-black text-white font-black rounded-lg text-[13px] uppercase tracking-widest shadow-md transition-all active:scale-[0.98] mt-2">
            {lang.submit}
          </Button>
        )}
      </form>
    </Form>
  );
}
