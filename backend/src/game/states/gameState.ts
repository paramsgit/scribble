import Game from "../game";

abstract class GameState {
  abstract onEnter(game: Game): void;
  abstract onTick(game: Game): void;
  abstract onGuess(game: Game, playerId: string, guess: string): boolean;
}

export default GameState;
