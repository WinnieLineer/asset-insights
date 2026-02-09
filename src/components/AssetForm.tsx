'use client';

import React, { useEffect, useMemo } from 'react';
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

const t = {
  en: {
    name: 'Asset Name',
    namePlaceholder: 'e.g., DBS Global Fund',
    symbol: 'Ticker / Symbol',
    symbolPlaceholder: 'BTC, AAPL, 2330, D05.SI',
    category: 'Category',
    currency: 'Base Currency',
    amount: 'Quantity / Balance',
    date: 'Acquisition Date',
    endDate: 'Closure Date',
    submit: 'Add to Portfolio',
    categories: {
      Stock: 'Equity',
      Crypto: 'Crypto',
      Savings: 'Deposit',
      Bank: 'Other'
    },
    errors: {
      nameTooShort: 'Min 2 characters',
      invalidAmount: 'Positive number required',
      required: 'Required',
      tickerRequired: 'Ticker symbol is required'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台積電、美金存款',
    symbol: '資產代碼',
    symbolPlaceholder: 'BTC, AAPL, 2330, D05.SI',
    category: '資產類別',
    currency: '持有幣別',
    amount: '持有數量 / 金額',
    date: '買入日期',
    endDate: '結清日期 (選填)',
    submit: '新增部位',
    categories: {
      Stock: '股票',
      Crypto: '加密貨幣',
      Savings: '存款',
      Bank: '其他資產'
    },
    errors: {
      nameTooShort: '至少 2 個字',
      invalidAmount: '請輸入有效的正數',
      required: '必填',
      tickerRequired: '此類別必須填寫代號'
    }
  }
};

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  language: 'en' | 'zh';
}

export function AssetForm({ onAdd, language }: AssetFormProps) {
  const lang = t[language];

  const formSchema = useMemo(() => z.object({
    name: z.string().min(2, { message: lang.errors.nameTooShort }),
    symbol: z.string().optional(),
    category: z.enum(['Stock', 'Crypto', 'Bank', 'Savings']),
    amount: z.number({ invalid_type_error: lang.errors.invalidAmount }).min(0, { message: lang.errors.invalidAmount }),
    currency: z.enum(['TWD', 'USD', 'CNY', 'SGD']),
    acquisitionDate: z.string().min(1, { message: lang.errors.required }),
    endDate: z.string().optional(),
  }).refine((data) => {
    if ((data.category === 'Stock' || data.category === 'Crypto') && (!data.symbol || data.symbol.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: lang.errors.tickerRequired,
    path: ['symbol'],
  }), [lang]);

  const today = new Date().toISOString().split('T')[0];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: '', 
      symbol: '', 
      category: 'Stock', 
      amount: 0, 
      currency: 'TWD',
      acquisitionDate: today,
      endDate: ''
    },
  });

  const category = form.watch('category');
  const symbol = form.watch('symbol');
  const hasTicker = category === 'Stock' || category === 'Crypto';

  useEffect(() => {
    if (category === 'Stock') {
      const sym = (symbol || '').toUpperCase();
      if (/^\d+$/.test(sym)) form.setValue('currency', 'TWD');
      else if (sym.endsWith('.SI')) form.setValue('currency', 'SGD');
      else if (sym) form.setValue('currency', 'USD');
    } else if (category === 'Crypto') {
      form.setValue('currency', 'USD');
    }
  }, [category, symbol, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => { onAdd(v as Omit<Asset, 'id'>); form.reset({ ...form.getValues(), name: '', symbol: '', amount: 0 }); })} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-slate-50 border-2 border-slate-200 h-10 text-sm font-bold focus:ring-black focus:border-black rounded-lg" />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )} />
        
        {hasTicker && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.symbol}</FormLabel>
              <FormControl>
                <Input placeholder={lang.symbolPlaceholder} {...field} className="bg-slate-50 border-2 border-slate-200 h-10 text-sm font-bold uppercase tracking-widest focus:ring-black focus:border-black rounded-lg" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.category}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10 bg-slate-50 border-2 border-slate-200 text-sm font-bold focus:ring-black focus:border-black rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Stock" className="text-sm font-bold">{lang.categories.Stock}</SelectItem>
                  <SelectItem value="Crypto" className="text-sm font-bold">{lang.categories.Crypto}</SelectItem>
                  <SelectItem value="Savings" className="text-sm font-bold">{lang.categories.Savings}</SelectItem>
                  <SelectItem value="Bank" className="text-sm font-bold">{lang.categories.Bank}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.currency}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={category === 'Crypto'}>
                <FormControl>
                  <SelectTrigger className="h-10 bg-slate-50 border-2 border-slate-200 text-sm font-bold focus:ring-black focus:border-black rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="TWD" className="text-sm font-bold">TWD</SelectItem>
                  <SelectItem value="USD" className="text-sm font-bold">USD</SelectItem>
                  <SelectItem value="CNY" className="text-sm font-bold">CNY</SelectItem>
                  <SelectItem value="SGD" className="text-sm font-bold">SGD</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.amount}</FormLabel>
              <FormControl>
                <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-10 font-bold bg-slate-50 border-2 border-slate-200 text-sm focus:ring-black focus:border-black rounded-lg" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="acquisitionDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.date}</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="h-10 font-bold bg-slate-50 border-2 border-slate-200 text-sm focus:ring-black focus:border-black rounded-lg" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.endDate}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} className="h-10 font-bold bg-slate-50 border-2 border-slate-200 text-sm focus:ring-black focus:border-black rounded-lg" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
        </div>
        
        <Button type="submit" className="w-full h-11 bg-black hover:bg-slate-800 text-white font-bold rounded-lg text-sm uppercase tracking-widest shadow-md transition-all active:scale-[0.98] mt-2">
          {lang.submit}
        </Button>
      </form>
    </Form>
  );
}
