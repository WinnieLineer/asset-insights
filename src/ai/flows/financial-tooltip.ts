'use server';
/**
 * @fileOverview An AI agent that generates contextually relevant financial tips based on the user's portfolio and market conditions.
 *
 * - getFinancialTip - A function that generates a financial tip.
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
  tip: z.string().describe('A contextually relevant financial tip.'),
});
export type FinancialTipOutput = z.infer<typeof FinancialTipOutputSchema>;

export async function getFinancialTip(input: FinancialTipInput): Promise<FinancialTipOutput> {
  return financialTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialTipPrompt',
  input: {schema: FinancialTipInputSchema},
  output: {schema: FinancialTipOutputSchema},
  prompt: `You are a financial advisor providing helpful tips to users based on their portfolio and current market conditions.

  Portfolio Summary: {{{portfolioSummary}}}
  Market Conditions: {{{marketConditions}}}

  Provide a single, actionable financial tip.`,
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
