// src/game/core/states/WaitingState.ts
import Game from "../game";
import GameState from "./gameState";
import DrawingState from "./drawingState";
import SocketManager from "../../sockets/socketManager";
import config from "../../../config";

class WaitingState extends GameState {
  onEnter(game: Game): void {
    console.log(`[Game:${game.roomId}] Waiting for players...`);

    if (game.players?.length >= 2) {
      SocketManager.getInstance().emitToRoom(game.roomId, "wait-update", {
        waitTime: config.waitTime,
        previousWord: game.currentWord.word,
        players: game.players,
      });
      setTimeout(() => {
        game.setState(new DrawingState());
      }, config.waitTime * 1000);
    } else {
      SocketManager.getInstance().emitToRoom(game.roomId, "wait-update", {});
    }
  }

  onTick(game: Game): void {
    // No-op while waiting
  }

  onGuess(game: Game, playerId: string, guess: string): boolean {
    // No-op while waiting
    return false;
  }
}

export default WaitingState;
