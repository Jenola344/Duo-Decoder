'use server';

import { selectSecretWord } from '@/ai/flows/select-secret-word';
import { provideDynamicClueSets } from '@/ai/flows/provide-dynamic-clue-sets';

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function getNewRoundData(): Promise<{ secretWord: string; clues: string[]; options: string[] }> {
  try {
    const { secretWord } = await selectSecretWord();

    // Fetch clues for the secret word
    const cluesPromise = provideDynamicClueSets({ secretWord });
    
    // Fetch three other unique words to serve as distractors
    const distractorPromises = [
        selectSecretWord(),
        selectSecretWord(),
        selectSecretWord()
    ];

    const [{ clues }, ...distractorResults] = await Promise.all([cluesPromise, ...distractorPromises]);
    const distractors = distractorResults.map(r => r.secretWord);

    const options = shuffleArray([secretWord, ...distractors]);

    return { secretWord, clues, options };
  } catch (error) {
    console.error("Error generating new round data:", error);
    // Provide a fallback in case of AI service failure
    const fallbackWords = ["House", "River", "Mountain", "Chair"];
    return {
      secretWord: "Fallback",
      clues: ["This is a backup", "The AI service might be down", "Please try again later"],
      options: shuffleArray(fallbackWords),
    };
  }
}
