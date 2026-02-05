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
    namePlaceholder: 'e.g., My Stocks Account',
    symbol: 'Symbol',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: 'Category',
    currency: 'Currency',
    amount: 'Amount',
    submit: 'Add to Portfolio',
    categories: {
      Stock: 'Equity',
      Crypto: 'Crypto',
      Savings: 'Savings',
      FixedDeposit: 'Fixed Deposit',
      Bank: 'Others'
    },
    errors: {
      nameTooShort: 'Min 2 characters',
      invalidAmount: 'Positive number required',
      required: 'Required'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台股證券帳戶',
    symbol: '代號 (如: BTC, 2330)',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: '資產類別',
    currency: '持有幣別',
    amount: '持有數量',
    submit: '新增部位',
    categories: {
      Stock: '股票',
      Crypto: '加密貨幣',
      Savings: '活期存款',
      FixedDeposit: '定期存款',
      Bank: '其他資產'
    },
    errors: {
      nameTooShort: '至少 2 個字',
      invalidAmount: '請輸入有效的正數',
      required: '必填'
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
    category: z.enum(['Stock', 'Crypto', 'Bank', 'Fixed Deposit', 'Savings']),
    amount: z.number({ invalid_type_error: lang.errors.invalidAmount }).min(0, { message: lang.errors.invalidAmount }),
    currency: z.enum(['TWD', 'USD', 'CNY']),
  }), [lang]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', symbol: '', category: 'Stock', amount: 0, currency: 'TWD' },
  });

  const category = form.watch('category');
  const symbol = form.watch('symbol');
  
  useEffect(() => {
    if (category === 'Stock') {
      if (/^\d+$/.test(symbol || '')) form.setValue('currency', 'TWD');
      else if (symbol) form.setValue('currency', 'USD');
    } else if (category === 'Crypto') form.setValue('currency', 'USD');
  }, [category, symbol, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => { onAdd(v as Omit<Asset, 'id'>); form.reset(); })} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-slate-50 border-slate-200 rounded h-9 text-xs" />
            </FormControl>
            <FormMessage className="text-[10px] text-rose-500" />
          </FormItem>
        )} />
        
        {category !== 'Savings' && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.symbol}</FormLabel>
              <FormControl>
                <Input placeholder={lang.symbolPlaceholder} {...field} className="bg-slate-50 border-slate-200 rounded h-9 text-xs font-bold uppercase" />
              </FormControl>
              <FormMessage className="text-[10px] text-rose-500" />
            </FormItem>
          )} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.category}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 rounded text-xs">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded">
                  <SelectItem value="Stock" className="text-xs">{lang.categories.Stock}</SelectItem>
                  <SelectItem value="Crypto" className="text-xs">{lang.categories.Crypto}</SelectItem>
                  <SelectItem value="Savings" className="text-xs">{lang.categories.Savings}</SelectItem>
                  <SelectItem value="Fixed Deposit" className="text-xs">{lang.categories.FixedDeposit}</SelectItem>
                  <SelectItem value="Bank" className="text-xs">{lang.categories.Bank}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.currency}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={category === 'Crypto'}>
                <FormControl>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 rounded text-xs">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded">
                  <SelectItem value="TWD" className="text-xs">TWD</SelectItem>
                  <SelectItem value="USD" className="text-xs">USD</SelectItem>
                  <SelectItem value="CNY" className="text-xs">CNY</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang.amount}</FormLabel>
            <FormControl>
              <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-9 font-bold bg-slate-50 border-slate-200 rounded text-xs" />
            </FormControl>
            <FormMessage className="text-[10px] text-rose-500" />
          </FormItem>
        )} />
        
        <Button type="submit" className="w-full h-10 bg-black hover:bg-slate-800 text-white font-bold rounded text-[10px] uppercase tracking-widest shadow-sm transition-all">
          {lang.submit}
        </Button>
      </form>
    </Form>
  );
}
