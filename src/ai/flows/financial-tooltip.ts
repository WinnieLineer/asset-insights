
'use server';
/**
 * @fileOverview An AI financial advisor that analyzes the user's full portfolio and answers specific questions.
 *
 * - getFinancialTip - A function that provides interactive financial analysis.
 * - FinancialTipInput - The input type for the getFinancialTip function.
 * - FinancialTipOutput - The return type for the getFinancialTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssetDetailSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  category: z.string(),
  amount: z.number(),
  currency: z.string(),
  price: z.number().optional(),
  valueInTWD: z.number(),
});

const FinancialTipInputSchema = z.object({
  assets: z.array(AssetDetailSchema).describe('The full list of assets in the user portfolio.'),
  totalTWD: z.number().describe('The total valuation of the portfolio in TWD.'),
  marketConditions: z.string().describe('A summary of current market conditions.'),
  userQuestion: z.string().optional().describe('A specific question from the user about their portfolio.'),
  language: z.enum(['en', 'zh']).default('zh').describe('The language to provide the report in.'),
});
export type FinancialTipInput = z.infer<typeof FinancialTipInputSchema>;

const FinancialTipOutputSchema = z.object({
  answer: z.string().describe('The direct answer to the user question or a general analysis if no question was provided.'),
  analysis: z.string().describe('A brief professional analysis of the current portfolio state.'),
  riskLevel: z.string().describe('The overall risk level of the portfolio (e.g., Low, Medium, High).'),
  diversificationScore: z.number().min(0).max(100).describe('A score from 0-100 indicating how well the portfolio is diversified.'),
  recommendations: z.array(z.string()).describe('A list of actionable financial recommendations.'),
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
      assetListString: z.string(),
    }),
  },
  output: {schema: FinancialTipOutputSchema},
  prompt: `You are a professional senior financial advisor. Analyze the user's FULL portfolio details and answer their specific question.

  Portfolio Details:
  {{{assetListString}}}
  Total Portfolio Value: NT\${{{totalTWD}}}
  
  Market Conditions: {{{marketConditions}}}
  
  User Question: {{#if userQuestion}}{{{userQuestion}}}{{else}}Please provide a general portfolio analysis and suggestions for improvement.{{/if}}

  Output Language: {{{languageName}}}

  Please provide the following structure:
  1. A direct "answer" to the user's question in a conversational but professional tone.
  2. A brief professional "analysis" of the current asset allocation.
  3. "riskLevel" assessment (e.g., "Conservative", "Moderate", "Aggressive").
  4. "diversificationScore" (0-100).
  5. "recommendations": At least 3 specific, actionable steps based on their current holdings.

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
    
    // Transform assets into a readable string for the prompt
    const assetListString = input.assets.map(a => 
      `- ${a.name} (${a.symbol}): ${a.amount} units, Price: ${a.price || 'N/A'}, Value: NT$${a.valueInTWD.toLocaleString()}`
    ).join('\n');

    const {output} = await prompt({
      ...input,
      languageName,
      assetListString,
    });
    return output!;
  }
);
