// src/game/core/states/WaitingState.ts
import Game from "../game";
import GameState from "./gameState";
import DrawingState from "./drawingState";

class WaitingState extends GameState {
  onEnter(game: Game): void {
    console.log(`[Game:${game.roomId}] Waiting for players...`);
    // setTimeout(() => {
    //   game.setState(new DrawingState());
    // }, 2000); // 2 second wait
  }

  onTick(game: Game): void {
    // No-op while waiting
  }

  onGuess(game: Game, playerId: string, guess: string): void {
    // No-op while waiting
  }
}

export default WaitingState;
