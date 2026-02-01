'use server';
/**
 * @fileOverview An AI agent that generates a detailed financial analysis report based on the user's portfolio and market conditions.
 *
 * - getFinancialTip - A function that generates a comprehensive financial insight report.
 * - FinancialTipInput - The input type for the getFinancialTip function.
 * - FinancialTipOutput - The return type for the getFinancialTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialTipInputSchema = z.object({
  portfolioSummary: z
    .string()
    .describe('A summary of the user portfolio, including asset types and allocation percentages.'),
  marketConditions: z
    .string()
    .describe('A summary of current market conditions and trends.'),
});
export type FinancialTipInput = z.infer<typeof FinancialTipInputSchema>;

const FinancialTipOutputSchema = z.object({
  analysis: z.string().describe('A brief professional analysis of the current portfolio state.'),
  riskLevel: z.enum(['低', '中', '高']).describe('The overall risk level of the portfolio.'),
  diversificationScore: z.number().min(0).max(100).describe('A score from 0-100 indicating how well the portfolio is diversified.'),
  recommendations: z.array(z.string()).describe('A list of 3-4 actionable financial recommendations.'),
});
export type FinancialTipOutput = z.infer<typeof FinancialTipOutputSchema>;

export async function getFinancialTip(input: FinancialTipInput): Promise<FinancialTipOutput> {
  return financialTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialTipPrompt',
  input: {schema: FinancialTipInputSchema},
  output: {schema: FinancialTipOutputSchema},
  prompt: `你是一位資深的專業財務顧問。請根據使用者的資產配置與當前市場狀況，提供深入且具體的分析。

  使用者資產摘要：{{{portfolioSummary}}}
  當前市場狀況：{{{marketConditions}}}

  請提供以下結構的建議：
  1. 針對現狀的簡短專業分析。
  2. 風險等級評估（低、中、高）。
  3. 分散投資評分（0-100 分）。
  4. 至少 3 點具體、可執行的投資建議。

  請確保使用繁體中文回答。`,
});

const financialTipFlow = ai.defineFlow(
  {
    name: 'financialTipFlow',
    inputSchema: FinancialTipInputSchema,
    outputSchema: FinancialTipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
