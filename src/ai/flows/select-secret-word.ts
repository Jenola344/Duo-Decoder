// The AI selects a secret word for the Clue Master.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SelectSecretWordInputSchema = z.void();
export type SelectSecretWordInput = z.infer<typeof SelectSecretWordInputSchema>;

const SelectSecretWordOutputSchema = z.object({
  secretWord: z.string().describe('The randomly selected secret word for the game.'),
});
export type SelectSecretWordOutput = z.infer<typeof SelectSecretWordOutputSchema>;

export async function selectSecretWord(): Promise<SelectSecretWordOutput> {
  return selectSecretWordFlow();
}

const selectSecretWordPrompt = ai.definePrompt({
  name: 'selectSecretWordPrompt',
  prompt: `You are the game master for a word guessing game. Your job is to select a single random secret word for the game.  This word should be common and well known. It should not be obscure or difficult to spell.

Respond only with the secret word, do not include any other text.`,
});

const selectSecretWordFlow = ai.defineFlow(
  {
    name: 'selectSecretWordFlow',
    inputSchema: SelectSecretWordInputSchema,
    outputSchema: SelectSecretWordOutputSchema,
  },
  async () => {
    const {text} = await ai.generate({
      prompt: selectSecretWordPrompt,
    });

    return {
      secretWord: text!,
    };
  }
);
