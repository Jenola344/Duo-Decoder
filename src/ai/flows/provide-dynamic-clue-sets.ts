// 'use server'
'use server';

/**
 * @fileOverview Provides dynamic clue sets for the Clue Master in the Duo Decoder game.
 *
 * This file defines a Genkit flow that takes a secret word as input and returns a set of predefined clues using AI.
 * These clues are designed to help the Code Breaker guess the word without making it too easy.
 *
 * - provideDynamicClueSets - The function to generate the clue sets.
 * - ProvideDynamicClueSetsInput - The input type for the function.
 * - ProvideDynamicClueSetsOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProvideDynamicClueSetsInputSchema = z.object({
  secretWord: z.string().describe('The secret word for which clues are needed.'),
});
export type ProvideDynamicClueSetsInput = z.infer<
  typeof ProvideDynamicClueSetsInputSchema
>;

const ProvideDynamicClueSetsOutputSchema = z.object({
  clues: z
    .array(z.string())
    .describe('An array of clues for the secret word.'),
});
export type ProvideDynamicClueSetsOutput = z.infer<
  typeof ProvideDynamicClueSetsOutputSchema
>;

export async function provideDynamicClueSets(
  input: ProvideDynamicClueSetsInput
): Promise<ProvideDynamicClueSetsOutput> {
  return provideDynamicClueSetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideDynamicClueSetsPrompt',
  input: {schema: ProvideDynamicClueSetsInputSchema},
  output: {schema: ProvideDynamicClueSetsOutputSchema},
  prompt: `You are a clue generator for a word guessing game. Your task is to provide a set of 2-3 clues for a given secret word.

  Secret Word: {{{secretWord}}}

  Provide clues that are helpful but not too obvious, enabling a code breaker to guess the word with some thought.
  The clues should be short and easy to understand.
  Return the clues as a JSON array of strings.
  `,
});

const provideDynamicClueSetsFlow = ai.defineFlow(
  {
    name: 'provideDynamicClueSetsFlow',
    inputSchema: ProvideDynamicClueSetsInputSchema,
    outputSchema: ProvideDynamicClueSetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
