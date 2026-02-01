'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Asset, AssetCategory, Currency } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const formSchema = z.object({
  name: z.string().min(2, '名稱太短'),
  symbol: z.string().optional(),
  category: z.enum(['Stock', 'Crypto', 'Bank', 'Fixed Deposit', 'Savings']),
  amount: z.number().min(0, '金額不能小於 0'),
  currency: z.enum(['TWD', 'USD']),
  interestRate: z.number().optional(),
});

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
}

export function AssetForm({ onAdd }: AssetFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      symbol: '',
      category: 'Stock',
      amount: 0,
      currency: 'TWD',
      interestRate: 0,
    },
  });

  const category = form.watch('category');
  const symbol = form.watch('symbol');
  
  // 邏輯判定
  const isTWStock = category === 'Stock' && /^\d+$/.test(symbol || '');
  const isUSStock = category === 'Stock' && symbol && !/^\d+$/.test(symbol);
  const isCrypto = category === 'Crypto';
  const isSavings = category === 'Savings';

  // 自動設定幣別與代號
  useEffect(() => {
    if (isTWStock) {
      form.setValue('currency', 'TWD');
    } else if (isUSStock || isCrypto) {
      form.setValue('currency', 'USD');
    }
  }, [isTWStock, isUSStock, isCrypto, form]);

  useEffect(() => {
    if (isSavings) {
      form.setValue('symbol', 'CASH');
    } else if (symbol === 'CASH') {
      form.setValue('symbol', '');
    }
  }, [isSavings, form]);

  // 是否應該隱藏幣別選擇器 (加密貨幣與股票已有明確市場規則)
  const shouldHideCurrency = category === 'Stock' || category === 'Crypto';

  function onSubmit(values: z.infer<typeof formSchema>) {
    const assetData = {
      ...values,
      symbol: values.symbol || (values.category === 'Savings' ? 'CASH' : 'N/A')
    };
    onAdd(assetData as Omit<Asset, 'id'>);
    form.reset({
      name: '',
      symbol: '',
      category: 'Stock',
      amount: 0,
      currency: 'TWD',
      interestRate: 0,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>資產名稱</FormLabel>
                <FormControl>
                  <Input placeholder="例如：台積電、薪資戶" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!isSavings && (
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>代號 (台股數字, 美股/加密代碼)</FormLabel>
                  <FormControl>
                    <Input placeholder="BTC, AAPL, 2330" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分類</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇分類" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Stock">股票</SelectItem>
                    <SelectItem value="Crypto">加密貨幣</SelectItem>
                    <SelectItem value="Savings">活期存款</SelectItem>
                    <SelectItem value="Fixed Deposit">定期存款</SelectItem>
                    <SelectItem value="Bank">其他銀行資產</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {!shouldHideCurrency && (
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>幣別</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇幣別" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TWD">TWD (台幣)</SelectItem>
                      <SelectItem value="USD">USD (美金)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className={shouldHideCurrency ? "md:col-span-2" : ""}>
                <FormLabel>持有數量 / 金額</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="any"
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {category === 'Fixed Deposit' && (
          <FormField
            control={form.control}
            name="interestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>年利率 (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full bg-primary font-headline">新增資產</Button>
      </form>
    </Form>
  );
}