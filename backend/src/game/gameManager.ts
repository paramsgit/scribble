// src/game/GameManager.ts
import Game from "./game";
import { Player } from "./roomManager";
import FinishedState from "./states/finishedState";

class GameManager {
  private static instance: GameManager;
  private games: Map<string, Game> = new Map();

  private constructor() {}

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public CreateGame(
    roomId: string,
    players: { id: string; name: string }[]
  ): Game {
    if (this.games.has(roomId)) {
      const existingGame = this.games.get(roomId);
      if (existingGame) {
        return existingGame;
      }
    }
    const game = new Game(roomId, players);
    this.games.set(roomId, game);
    return game;
  }

  public addPlayerToGame(roomId: string, player: Player): Game {
    let game = this.games.get(roomId);
    if (!game) {
      game = this.CreateGame(roomId, [player]);
    }
    game.addPlayer(player);
    return game;
  }
  public removePlayerFromGame(roomId: string, playerId: string): boolean {
    const game = this.games.get(roomId);
    if (!game) {
      console.error(`Game with roomId ${roomId} does not exist.`);
      return false;
    }
    const success = game.removePlayer(playerId);
    if (!success) {
      console.error(`Player with id ${playerId} could not be removed.`);
    }
    return success;
  }
  public getGame(roomId: string): Game | undefined {
    return this.games.get(roomId);
  }
  public getDrawerId(roomId: string): string | undefined {
    const game = this.games.get(roomId);
    return game?.drawerId;
  }

  public removeGame(roomId: string) {
    console.log("deleting game of room", roomId);
    this.games.delete(roomId);
  }
}

export default GameManager;
