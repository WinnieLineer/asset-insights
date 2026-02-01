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
  language: z.enum(['en', 'zh']).default('zh').describe('The language to provide the report in.'),
});
export type FinancialTipInput = z.infer<typeof FinancialTipInputSchema>;

const FinancialTipOutputSchema = z.object({
  analysis: z.string().describe('A brief professional analysis of the current portfolio state.'),
  riskLevel: z.string().describe('The overall risk level of the portfolio (e.g., Low, Medium, High).'),
  diversificationScore: z.number().min(0).max(100).describe('A score from 0-100 indicating how well the portfolio is diversified.'),
  recommendations: z.array(z.string()).describe('A list of 3-4 actionable financial recommendations.'),
});
export type FinancialTipOutput = z.infer<typeof FinancialTipOutputSchema>;

export async function getFinancialTip(input: FinancialTipInput): Promise<FinancialTipOutput> {
  return financialTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialTipPrompt',
  input: {
    schema: FinancialTipInputSchema.extend({
      languageName: z.string(),
    }),
  },
  output: {schema: FinancialTipOutputSchema},
  prompt: `You are a professional senior financial advisor. Provide a deep and specific analysis based on the user's portfolio and market conditions.

  Portfolio Summary: {{{portfolioSummary}}}
  Market Conditions: {{{marketConditions}}}
  Output Language: {{{languageName}}}

  Please provide the following structure:
  1. A brief professional analysis of the current state.
  2. Risk level assessment.
  3. Diversification score (0-100).
  4. At least 3 specific, actionable investment recommendations.

  Ensure the entire output is in the requested language.`,
});

const financialTipFlow = ai.defineFlow(
  {
    name: 'financialTipFlow',
    inputSchema: FinancialTipInputSchema,
    outputSchema: FinancialTipOutputSchema,
  },
  async input => {
    const languageName = input.language === 'en' ? 'English' : 'Traditional Chinese (Taiwan)';
    const {output} = await prompt({
      ...input,
      languageName,
    });
    return output!;
  }
);
