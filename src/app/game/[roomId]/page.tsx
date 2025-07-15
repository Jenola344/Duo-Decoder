import GameClient from '@/components/game-client';

export default function GamePage({ params }: { params: { roomId: string } }) {
  return (
    <div className="bg-background min-h-screen">
      <GameClient roomId={params.roomId} />
    </div>
  );
}
