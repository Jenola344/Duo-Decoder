'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Dices } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const createGame = () => {
    const roomId = crypto.randomUUID().split('-')[0];
    router.push(`/game/${roomId}`);
  };

  return (
    <div className="min-h-screen w-full bg-background font-body">
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <header className="text-center">
          <div className="inline-block rounded-full bg-primary p-4 text-primary-foreground shadow-lg animate-in fade-in zoom-in-50 duration-500">
            <BrainCircuit size={64} />
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tighter text-primary sm:text-6xl font-headline animate-in fade-in slide-in-from-bottom-2 duration-500">
            Duo Decoder
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
            A fast-paced collaborative word game. Put your minds together to crack the code before time runs out!
          </p>
        </header>

        <main className="mt-8 w-full max-w-sm">
          <Card className="shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-headline">New Game</CardTitle>
              <CardDescription className="text-center">
                Create a room and invite your partner.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={createGame} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
                <Dices className="mr-2 h-5 w-5" />
                Create Game Room
              </Button>
            </CardContent>
          </Card>
        </main>
        <footer className="mt-12 text-center text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-8 duration-900">
          <p>Roles switch every round. Good luck, decoders!</p>
        </footer>
      </div>
    </div>
  );
}
