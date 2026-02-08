/**
 * Asset Insights AI - Professional portfolio analysis engine.
 * Disabled 'use server' to ensure compatibility with GitHub Pages static export.
 */

import {z} from 'genkit';

export const AssetDetailSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  category: z.string(),
  amount: z.number(),
  currency: z.string(),
  price: z.number().optional(),
  valueInTWD: z.number(),
});

export const FinancialTipInputSchema = z.object({
  assets: z.array(AssetDetailSchema),
  totalTWD: z.number(),
  marketConditions: z.string(),
  userQuestion: z.string().optional(),
  language: z.enum(['en', 'zh']).default('zh'),
});

export const FinancialTipOutputSchema = z.object({
  answer: z.string(),
  analysis: z.string(),
  riskLevel: z.string(),
  diversificationScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
});
