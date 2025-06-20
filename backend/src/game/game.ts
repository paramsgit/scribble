// src/game/core/Game.ts
import { Player } from "./roomManager";
import DrawingState from "./states/drawingState";
import FinishedState from "./states/finishedState";
import GameState from "./states/gameState";
import WaitingState from "./states/waitingState";

class Game {
  public roomId: string;
  public players: Player[];
  public wordList: string[] = [];
  public currentWordIndex = -1;
  public drawerId: string = "";
  public guessedPlayerIds: Set<string> = new Set();
  public timer: NodeJS.Timeout | null = null;
  private state!: GameState;

  constructor(roomId: string, players: Player[]) {
    this.roomId = roomId;
    this.players = players;
    this.setState(new WaitingState());
  }

  public setState(state: GameState) {
    this.state = state;
    this.state.onEnter(this);
  }
  public getState(): GameState {
    return this.state;
  }

  public addPlayer(player: Player): boolean {
    if (
      this.players.some((existingPlayer) => existingPlayer.id === player.id)
    ) {
      return false;
    }

    this.players.push(player);
    return true;
  }
  public removePlayer(playerId: string): boolean {
    const playerIndex = this.players.findIndex(
      (existingPlayer) => existingPlayer.id === playerId
    );

    if (playerIndex === -1) {
      return false;
    }

    this.players.splice(playerIndex, 1);

    if (this.players.length <= 1) this.setState(new FinishedState());

    if (this.drawerId === playerId) {
      if (this.timer) clearTimeout(this.timer);
      this.setState(new DrawingState());
    }

    return true;
  }

  public onTick() {
    this.state.onTick(this);
  }

  public onGuess(playerId: string, guess: string): boolean {
    return this.state.onGuess(this, playerId, guess);
  }
}

export default Game;
