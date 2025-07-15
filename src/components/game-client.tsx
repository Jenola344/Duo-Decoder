'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Game, Player, GameStatus, GameRound } from '@/types';
import { getNewRoundData } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Copy, Users, Clapperboard, Gamepad2, Brain, CheckCircle, XCircle, Trophy, RefreshCw, Eye, Lightbulb, Puzzle } from 'lucide-react';

const MAX_ROUNDS = 5;
const ROUND_TIME_LIMIT = 60; // seconds

export default function GameClient({ roomId }: { roomId: string }) {
  const [gameState, setGameState] = useState<Game | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getPlayerId = useCallback(() => {
    let id = localStorage.getItem('duo-decoder-playerId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('duo-decoder-playerId', id);
    }
    setPlayerId(id);

    const name = localStorage.getItem('duo-decoder-playerName');
    if (name) {
      setPlayerName(name);
    } else {
      setIsNameModalOpen(true);
    }
  }, []);

  const handleNameSubmit = () => {
    if (playerName.trim()) {
      localStorage.setItem('duo-decoder-playerName', playerName.trim());
      setIsNameModalOpen(false);
    }
  };

  useEffect(() => {
    getPlayerId();
  }, [getPlayerId]);

  useEffect(() => {
    if (!roomId || !playerId || !playerName) return;

    const gameRef = doc(db, 'games', roomId);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const gameData = docSnap.data() as Game;
        setGameState(gameData);

        const playerInGame = gameData.players.some(p => p.id === playerId);
        if (!playerInGame && gameData.players.length < 2) {
          const newPlayer: Player = { id: playerId, name: playerName };
          updateDoc(gameRef, { players: [...gameData.players, newPlayer] })
            .then(() => {
              if (gameData.players.length === 1) { // This means we are the second player
                  startGame(roomId);
              }
            });
        } else if (!playerInGame && gameData.players.length >= 2) {
          setError("This game room is full.");
        }
      } else {
        const newPlayer: Player = { id: playerId, name: playerName };
        const newGame: Game = {
          id: roomId,
          players: [newPlayer],
          status: 'waiting',
          currentRound: 0,
          maxRounds: MAX_ROUNDS,
          score: 0,
        };
        setDoc(gameRef, newGame);
      }
    });

    return () => unsubscribe();
  }, [roomId, playerId, playerName]);

  const startGame = async (currentRoomId: string) => {
    const gameRef = doc(db, 'games', currentRoomId);
    await updateDoc(gameRef, { status: 'starting' });
    await startNewRound(currentRoomId, 1);
  };
  
  const startNewRound = async (currentRoomId: string, roundNumber: number) => {
    const gameRef = doc(db, 'games', currentRoomId);
    try {
        const gameDoc = await getDoc(gameRef);
        if (!gameDoc.exists()) return;
        const gameData = gameDoc.data() as Game;
        const roundData = await getNewRoundData();
        const clueMasterId = gameData.players[(roundNumber - 1) % 2].id;

        const newRound: GameRound = {
            roundNumber,
            clueMasterId,
            ...roundData,
            selectedClues: [],
            guess: null,
            isCorrect: null,
            startTime: Date.now(),
            timeLimit: ROUND_TIME_LIMIT
        };

        await updateDoc(gameRef, {
            status: 'clue_master_turn',
            currentRound: roundNumber,
            roundData: newRound
        });
    } catch(e) {
        console.error("Failed to start new round:", e);
        // Handle error, maybe set game status to error
    }
  };
  
  const handleTimeOut = useCallback(async () => {
    if (!gameState || !gameState.roundData) return;
    
    toast({
        title: "Time's Up!",
        description: "The round has ended.",
        variant: "destructive",
    });

    const gameRef = doc(db, 'games', roomId);
    await updateDoc(gameRef, {
        status: 'round_over',
        'roundData.isCorrect': false,
    });
  }, [gameState, roomId, toast]);

  if (error) return <div className="flex items-center justify-center min-h-screen"><Alert variant="destructive" className="max-w-md"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>;
  if (!gameState || !playerId) return <div className="flex items-center justify-center min-h-screen text-primary"><Loader2 className="h-12 w-12 animate-spin" /></div>;

  const playerRole = gameState.roundData?.clueMasterId === playerId ? 'Clue Master' : 'Code Breaker';

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Dialog open={isNameModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>What should we call you?</DialogTitle><DialogDescription>Enter your player name to join the game.</DialogDescription></DialogHeader>
          <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player Name" />
          <DialogFooter><Button onClick={handleNameSubmit}>Save Name</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <GameUI gameState={gameState} playerId={playerId} playerRole={playerRole} onTimeout={handleTimeOut} />
    </div>
  );
}

const GameUI = ({ gameState, playerId, playerRole, onTimeout }: { gameState: Game, playerId: string, playerRole: string, onTimeout: () => void }) => {
  switch (gameState.status) {
    case 'waiting': return <WaitingRoom roomId={gameState.id} />;
    case 'starting': return <div className="flex flex-col items-center justify-center min-h-[80vh] text-primary"><Loader2 className="h-12 w-12 animate-spin" /><p className="mt-4 text-xl font-semibold">Starting game...</p></div>;
    case 'clue_master_turn':
      return playerRole === 'Clue Master' ? 
        <ClueMasterView gameState={gameState} onTimeout={onTimeout} /> : 
        <CodeBreakerWaitView gameState={gameState} onTimeout={onTimeout} role={playerRole} />;
    case 'code_breaker_turn':
      return playerRole === 'Code Breaker' ? 
        <CodeBreakerView gameState={gameState} onTimeout={onTimeout} /> : 
        <ClueMasterWaitView gameState={gameState} onTimeout={onTimeout} role={playerRole} />;
    case 'round_over': return <RoundOverView gameState={gameState} />;
    case 'finished': return <GameOverView gameState={gameState} />;
    default: return <div>Unknown game state.</div>;
  }
};

const WaitingRoom = ({ roomId }: { roomId: string }) => {
  const { toast } = useToast();
  const inviteLink = `${window.location.origin}/game/${roomId}`;
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: "Copied!", description: "Invite link copied to clipboard." });
  };
  return (
    <div className="flex items-center justify-center min-h-[80vh] animate-in fade-in">
        <Card className="w-full max-w-md text-center shadow-xl">
            <CardHeader><CardTitle className="text-2xl font-headline flex items-center justify-center gap-2"><Users /> Waiting for Player 2</CardTitle><CardDescription>Share this link with a friend to start.</CardDescription></CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <Input value={inviteLink} readOnly className="bg-muted" />
                    <Button variant="outline" size="icon" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

const ClueMasterView = ({ gameState, onTimeout }: { gameState: Game, onTimeout: () => void }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const { toast } = useToast();
  
    const handleSelect = (clue: string) => {
      setSelected(prev => 
        prev.includes(clue) ? prev.filter(c => c !== clue) : 
        prev.length < 3 ? [...prev, clue] : prev
      );
    };

    const submitClues = async () => {
        if (selected.length < 2) {
            toast({ title: "Not enough clues", description: "Please select at least 2 clues.", variant: "destructive" });
            return;
        }
        const gameRef = doc(db, 'games', gameState.id);
        await updateDoc(gameRef, {
            'roundData.selectedClues': selected,
            'roundData.startTime': Date.now(), // Reset timer for code breaker
            status: 'code_breaker_turn'
        });
    };

    return (
        <GameScreenLayout gameState={gameState} role="Clue Master" onTimeout={onTimeout}>
            <div className="text-center mb-6">
                <p className="text-muted-foreground">The secret word is:</p>
                <h2 className="text-4xl font-bold text-primary font-headline">{gameState.roundData?.secretWord}</h2>
            </div>
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lightbulb /> Select 2-3 Clues</CardTitle>
                    <CardDescription>Choose the best clues to help your partner guess the word.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {gameState.roundData?.clues.map((clue, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 rounded-md border has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                            <Checkbox id={`clue-${i}`} onCheckedChange={() => handleSelect(clue)} checked={selected.includes(clue)} disabled={!selected.includes(clue) && selected.length >= 3} />
                            <Label htmlFor={`clue-${i}`} className="text-base flex-1 cursor-pointer">{clue}</Label>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <div className="text-center mt-6">
                <Button size="lg" onClick={submitClues}>Submit Clues</Button>
            </div>
        </GameScreenLayout>
    );
};

const CodeBreakerView = ({ gameState, onTimeout }: { gameState: Game, onTimeout: () => void }) => {
    const [guess, setGuess] = useState<string | null>(null);

    const submitGuess = async () => {
        if (!guess) return;
        const gameRef = doc(db, 'games', gameState.id);
        const isCorrect = guess === gameState.roundData?.secretWord;
        
        await runTransaction(db, async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists()) throw "Document does not exist!";

            const currentScore = gameDoc.data().score;
            const newScore = isCorrect ? currentScore + 1 : currentScore;

            transaction.update(gameRef, {
                status: 'round_over',
                'roundData.guess': guess,
                'roundData.isCorrect': isCorrect,
                score: newScore,
            });
        });
    };

    return (
        <GameScreenLayout gameState={gameState} role="Code Breaker" onTimeout={onTimeout}>
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-primary font-headline">Decode the Clues!</h2>
                <p className="text-muted-foreground">Your partner has sent these clues. What's the secret word?</p>
            </div>
            <Card className="w-full max-w-lg mx-auto mb-6 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Eye/> Submitted Clues</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {gameState.roundData?.selectedClues.map((clue, i) => (
                        <p key={i} className="text-lg font-medium p-3 bg-background rounded-md shadow-sm">{clue}</p>
                    ))}
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                {gameState.roundData?.options.map((option, i) => (
                    <Button key={i} variant={guess === option ? "default" : "outline"} size="lg" className="h-16 text-lg" onClick={() => setGuess(option)}>{option}</Button>
                ))}
            </div>
            <div className="text-center mt-6">
                <Button size="lg" onClick={submitGuess} disabled={!guess}>Submit Guess</Button>
            </div>
        </GameScreenLayout>
    );
};

const WaitingView = ({ role, onTimeout, children, gameState }: {role:string, onTimeout:()=>void, children: React.ReactNode, gameState: Game}) => (
    <GameScreenLayout gameState={gameState} role={role} onTimeout={onTimeout} showTimer={false}>
         <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            {children}
        </div>
    </GameScreenLayout>
)

const CodeBreakerWaitView = (props: any) => (
    <WaitingView {...props}>
        <h2 className="text-2xl font-bold font-headline">You are the Code Breaker</h2>
        <p className="text-muted-foreground mt-2">Waiting for the Clue Master to select clues...</p>
    </WaitingView>
);

const ClueMasterWaitView = (props: any) => (
    <WaitingView {...props}>
        <h2 className="text-2xl font-bold font-headline">You are the Clue Master</h2>
        <p className="text-muted-foreground mt-2">Waiting for the Code Breaker to guess the word...</p>
    </WaitingView>
);


const RoundOverView = ({ gameState }: { gameState: Game }) => {
    const isCorrect = gameState.roundData?.isCorrect;
    const title = isCorrect ? "Correct!" : "Incorrect!";
    const Icon = isCorrect ? CheckCircle : XCircle;
    const color = isCorrect ? "text-accent" : "text-destructive";

    const goToNextRound = async () => {
        const gameRef = doc(db, 'games', gameState.id);
        if (gameState.currentRound >= gameState.maxRounds) {
            await updateDoc(gameRef, { status: 'finished' });
        } else {
            await updateDoc(gameRef, { status: 'starting' });
            await startNewRound(gameState.id, gameState.currentRound + 1);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] animate-in fade-in zoom-in-95">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <Icon className={`mx-auto h-16 w-16 ${color}`} />
                    <CardTitle className={`text-4xl font-headline ${color}`}>{title}</CardTitle>
                    <CardDescription>The secret word was: <strong className="text-primary">{gameState.roundData?.secretWord}</strong></CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-xl">Current Score: <strong className="text-primary">{gameState.score}</strong></p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={goToNextRound}>
                        {gameState.currentRound >= gameState.maxRounds ? 'Finish Game' : 'Next Round'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

const GameOverView = ({ gameState }: { gameState: Game }) => {
    return (
        <div className="flex items-center justify-center min-h-[80vh] animate-in fade-in zoom-in-95">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <Trophy className="mx-auto h-16 w-16 text-amber-400" />
                    <CardTitle className="text-4xl font-headline text-primary">Game Over!</CardTitle>
                    <CardDescription>Well played, duo!</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl">Final Score</p>
                    <p className="text-6xl font-bold text-primary my-2">{gameState.score}</p>
                    <p className="text-muted-foreground">out of {gameState.maxRounds} rounds</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => window.location.href = '/'}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Play Again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

const GameHeader = ({ gameState, role }: { gameState: Game, role: string }) => {
    const RoleIcon = role === 'Clue Master' ? Lightbulb : Puzzle;
    return (
        <header className="mb-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <RoleIcon className="h-6 w-6"/>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Your Role</p>
                        <p className="font-bold text-lg">{role}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="font-bold text-lg">{gameState.score}</p>
                </div>
            </div>
            <p className="text-center mt-4 text-sm text-muted-foreground">Round {gameState.currentRound} of {gameState.maxRounds}</p>
        </header>
    );
}

const Timer = ({ startTime, timeLimit, onTimeout }: { startTime: number, timeLimit: number, onTimeout: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(timeLimit);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const remaining = Math.max(0, timeLimit - elapsed);
            setTimeLeft(remaining);

            if (remaining === 0) {
                clearInterval(interval);
                onTimeout();
            }
        }, 500);

        return () => clearInterval(interval);
    }, [startTime, timeLimit, onTimeout]);

    const progress = (timeLeft / timeLimit) * 100;

    return (
        <div className="w-full max-w-lg mx-auto my-4">
            <div className="flex justify-between text-sm font-mono mb-1 text-muted-foreground">
                <span>Timer</span>
                <span>{Math.ceil(timeLeft)}s</span>
            </div>
            <Progress value={progress} className={progress < 20 ? "[&>div]:bg-destructive" : ""} />
        </div>
    )
}

const GameScreenLayout = ({
    children, gameState, role, onTimeout, showTimer = true
}:{
    children: React.ReactNode, gameState: Game, role: string, onTimeout: () => void, showTimer?: boolean
}) => {
    return (
        <div className="max-w-4xl mx-auto">
            <GameHeader gameState={gameState} role={role} />
            <main>
                {showTimer && gameState.roundData && <Timer startTime={gameState.roundData.startTime} timeLimit={gameState.roundData.timeLimit} onTimeout={onTimeout} />}
                <div className="mt-4 animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
