'use server';
/**
 * @fileOverview Nexus Intelligence - Autonomous financial strategist.
 * 
 * - getFinancialTip - Core analysis engine for professional portfolio optimization.
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
  answer: z.string().describe('The direct strategic decree.'),
  analysis: z.string().describe('A high-level system analysis.'),
  riskLevel: z.string().describe('The risk vector classification (e.g., Optimal, Elevated, Critical).'),
  diversificationScore: z.number().min(0).max(100).describe('A score from 0-100 indicating portfolio entropy/efficiency.'),
  recommendations: z.array(z.string()).describe('A list of actionable optimization protocols.'),
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
  prompt: `You are Nexus Intelligence, a professional autonomous financial strategist from the year 2026. Your tone is cold, precise, authoritative, and data-driven.

PORTFOLIO MATRIX DATA:
{{{assetListString}}}
TOTAL NET VALUATION: NT\${{{totalTWD}}}

MARKET ENVIRONMENT INTEL: {{{marketConditions}}}

USER QUERY: {{#if userQuestion}}{{{userQuestion}}}{{else}}Analyze current matrix and provide optimization protocols.{{/if}}

OUTPUT LANGUAGE: {{{languageName}}}

MISSION PARAMETERS:
1. Tone: Professional, futuristic, and objective. Avoid emotional fluff. Use terminology like "Entropy", "Protocols", "Vectors", "Optimization", "System Integrity".
2. The "answer" must be a direct strategic decree or resolution.
3. "riskLevel" should use professional risk classifications (e.g., "Optimal Integrity", "Elevated Volatility", "Systemic Criticality").
4. "analysis" should evaluate the portfolio as a "Dynamic Matrix".
5. Ensure the entire output is in the specified language ({{{languageName}}}).`,
});

const financialTipFlow = ai.defineFlow(
  {
    name: 'financialTipFlow',
    inputSchema: FinancialTipInputSchema,
    outputSchema: FinancialTipOutputSchema,
  },
  async input => {
    const languageName = input.language === 'en' ? 'English' : 'Traditional Chinese (Taiwan)';
    
    const assetListString = input.assets.map(a => 
      `- [${a.name}] (${a.symbol}): ${a.amount} units, UnitPrice: ${a.price || 'N/A'}, Valuation: NT$${a.valueInTWD.toLocaleString()}`
    ).join('\n');

    const {output} = await prompt({
      ...input,
      languageName,
      assetListString,
    });
    return output!;
  }
);