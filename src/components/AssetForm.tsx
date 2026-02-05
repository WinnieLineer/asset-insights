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
    symbol: 'Ticker Symbol',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: 'Asset Category',
    currency: 'Base Currency',
    amount: 'Holding Amount',
    submit: 'Add to Portfolio',
    categories: {
      Stock: 'Equity (Stocks)',
      Crypto: 'Cryptocurrency',
      Savings: 'Savings Account',
      FixedDeposit: 'Fixed Deposit',
      Bank: 'Others'
    },
    errors: {
      nameTooShort: 'Asset name is too short (min 2 characters)',
      invalidAmount: 'Please enter a valid positive number',
      required: 'This field is required'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台股證券帳戶',
    symbol: '代號 (如: BTC, AAPL, 2330)',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: '資產類別',
    currency: '持有幣別',
    amount: '持有數量',
    submit: '新增至投資組合',
    categories: {
      Stock: '股票',
      Crypto: '加密貨幣',
      Savings: '活期存款',
      FixedDeposit: '定期存款',
      Bank: '其他資產'
    },
    errors: {
      nameTooShort: '資產名稱太短（至少 2 個字）',
      invalidAmount: '請輸入有效的正數',
      required: '此欄位為必填項'
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
      <form onSubmit={form.handleSubmit((v) => { onAdd(v as Omit<Asset, 'id'>); form.reset(); })} className="space-y-5">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-slate-50 border-slate-200 rounded-lg h-10 font-medium" />
            </FormControl>
            <FormMessage className="text-xs text-rose-500" />
          </FormItem>
        )} />
        
        {category !== 'Savings' && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lang.symbol}</FormLabel>
              <FormControl>
                <Input placeholder={lang.symbolPlaceholder} {...field} className="bg-slate-50 border-slate-200 rounded-lg h-10 font-bold uppercase" />
              </FormControl>
              <FormMessage className="text-xs text-rose-500" />
            </FormItem>
          )} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lang.category}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg font-medium">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-lg">
                  <SelectItem value="Stock">{lang.categories.Stock}</SelectItem>
                  <SelectItem value="Crypto">{lang.categories.Crypto}</SelectItem>
                  <SelectItem value="Savings">{lang.categories.Savings}</SelectItem>
                  <SelectItem value="Fixed Deposit">{lang.categories.FixedDeposit}</SelectItem>
                  <SelectItem value="Bank">{lang.categories.Bank}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lang.currency}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={category === 'Crypto'}>
                <FormControl>
                  <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg font-medium">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-lg">
                  <SelectItem value="TWD">TWD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider">{lang.amount}</FormLabel>
            <FormControl>
              <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-10 font-bold bg-slate-50 border-slate-200 rounded-lg" />
            </FormControl>
            <FormMessage className="text-xs text-rose-500" />
          </FormItem>
        )} />
        
        <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all">
          {lang.submit}
        </Button>
      </form>
    </Form>
  );
}