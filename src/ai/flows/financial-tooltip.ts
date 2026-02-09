'use server';
/**
 * Asset Insights AI - Professional portfolio analysis engine.
 * 
 * - analyzePortfolio - A function that calls Gemini to analyze the user's asset allocation.
 * - AnalyzePortfolioInput - Input schema for analysis.
 * - AnalyzePortfolioOutput - Output schema for analysis.
 */

import {ai} from '@/ai/genkit';
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
export type FinancialTipInput = z.infer<typeof FinancialTipInputSchema>;

export const FinancialTipOutputSchema = z.object({
  answer: z.string(),
  analysis: z.string(),
  riskLevel: z.string(),
  diversificationScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
});
export type FinancialTipOutput = z.infer<typeof FinancialTipOutputSchema>;

export async function analyzePortfolio(input: FinancialTipInput): Promise<FinancialTipOutput> {
  const prompt = ai.definePrompt({
    name: 'analyzePortfolioPrompt',
    input: {schema: FinancialTipInputSchema},
    output: {schema: FinancialTipOutputSchema},
    prompt: `You are a high-end institutional financial analyst. Provide a professional portfolio audit.
      
      PORTFOLIO DATA:
      Total Value (TWD): {{{totalTWD}}}
      Assets:
      {{#each assets}}
      - {{{name}}} ({{{symbol}}}): {{{amount}}} {{{currency}}}, Value: {{{valueInTWD}}} TWD
      {{/each}}
      
      Market Context: {{{marketConditions}}}
      User Inquiry: "{{{userQuestion}}}"
      
      Language: {{#if (eq language 'zh')}}Traditional Chinese{{else}}English{{/if}}.`,
  });

  const {output} = await prompt(input);
  return output!;
}
