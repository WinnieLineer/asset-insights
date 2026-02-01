'use client';

import React, { useEffect } from 'react';
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
    namePlaceholder: 'e.g., Salary Account',
    symbol: 'Symbol (Ticker or Stock Code)',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: 'Category',
    currency: 'Currency',
    amount: 'Holdings / Amount',
    submit: 'Add Asset',
    categories: {
      Stock: 'Stock',
      Crypto: 'Crypto',
      Savings: 'Savings',
      FixedDeposit: 'Fixed Deposit',
      Bank: 'Other Bank Asset'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：薪資戶',
    symbol: '代號 (台股數字, 美股代碼)',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: '分類',
    currency: '幣別',
    amount: '持有數量 / 金額',
    submit: '新增資產',
    categories: {
      Stock: '股票',
      Crypto: '加密貨幣',
      Savings: '活期存款',
      FixedDeposit: '定期存款',
      Bank: '其他銀行資產'
    }
  }
};

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  language: 'en' | 'zh';
}

const formSchema = z.object({
  name: z.string().min(2),
  symbol: z.string().optional(),
  category: z.enum(['Stock', 'Crypto', 'Bank', 'Fixed Deposit', 'Savings']),
  amount: z.number().min(0),
  currency: z.enum(['TWD', 'USD', 'CNY']),
});

export function AssetForm({ onAdd, language }: AssetFormProps) {
  const lang = t[language];
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
          <FormItem><FormLabel>{lang.name}</FormLabel><FormControl><Input placeholder={lang.namePlaceholder} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        {category !== 'Savings' && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem><FormLabel>{lang.symbol}</FormLabel><FormControl><Input placeholder={lang.symbolPlaceholder} {...field} /></FormControl></FormItem>
          )} />
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem><FormLabel>{lang.category}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
              <SelectItem value="Stock">{lang.categories.Stock}</SelectItem>
              <SelectItem value="Crypto">{lang.categories.Crypto}</SelectItem>
              <SelectItem value="Savings">{lang.categories.Savings}</SelectItem>
              <SelectItem value="Fixed Deposit">{lang.categories.FixedDeposit}</SelectItem>
              <SelectItem value="Bank">{lang.categories.Bank}</SelectItem>
            </SelectContent></Select></FormItem>
          )} />
          {category !== 'Stock' && category !== 'Crypto' && (
            <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem><FormLabel>{lang.currency}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="TWD">TWD</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="CNY">CNY</SelectItem></SelectContent></Select></FormItem>
            )} />
          )}
        </div>
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem><FormLabel>{lang.amount}</FormLabel><FormControl><Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl></FormItem>
        )} />
        <Button type="submit" className="w-full">{lang.submit}</Button>
      </form>
    </Form>
  );
}
