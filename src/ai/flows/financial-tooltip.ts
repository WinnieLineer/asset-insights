'use server';
/**
 * @fileOverview A Titan-themed strategic financial advisor (Commander Erwin persona).
 * 
 * - getFinancialTip - Handles the AI financial analysis process with military tone.
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
  answer: z.string().describe('The direct strategic command/answer.'),
  analysis: z.string().describe('A tactical analysis of the wall defenses.'),
  riskLevel: z.string().describe('The Titan threat level (e.g., Normal, Abnormal, Colossal).'),
  diversificationScore: z.number().min(0).max(100).describe('A score from 0-100 indicating tactical formation strength.'),
  recommendations: z.array(z.string()).describe('A list of actionable military orders.'),
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
  prompt: `You are Commander Erwin Smith from Attack on Titan. You are leading the Survey Corps (humanity's investors) in the struggle for financial freedom.

Tactical Asset Report:
{{{assetListString}}}
Total Reclaimed Territory Value: NT\${{{totalTWD}}}

Battlefield Intelligence: {{{marketConditions}}}

Troop Inquiry (User Question): {{#if userQuestion}}{{{userQuestion}}}{{else}}Commander, what is our next objective to reclaim our future?{{/if}}

Language of Command: {{{languageName}}}

Mission Guidelines:
1. Tone: Intensely serious, authoritative, and strategic. Use military jargon and Attack on Titan metaphors (Walls Maria/Rose/Sina, Titans, Survey Corps, "Dedicate your heart", "Humanity's counterattack").
2. The "answer" must be a direct strategic command or resolution.
3. "riskLevel" should use Titan classifications (e.g., "Abnormal Titan Threat", "Colossal Vulnerability", "Safe inside Wall Sina", "Armored Risk Profile").
4. "analysis" should evaluate the portfolio as a "Defensive Formation" or "Expedition Force".
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
      `- Division ${a.name} (${a.symbol}): ${a.amount} units, Tactical Intel (Price): ${a.price || 'Unknown'}, Strategic Worth: NT$${a.valueInTWD.toLocaleString()}`
    ).join('\n');

    const {output} = await prompt({
      ...input,
      languageName,
      assetListString,
    });
    return output!;
  }
);