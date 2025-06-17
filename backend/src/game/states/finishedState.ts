import GameState from "./gameState";
import Game from "../game";
import SocketManager from "../../sockets/socketManager";
import GameManager from "../gameManager";
class FinishedState extends GameState {
  onEnter(game: Game): void {
    console.log(`[Game:${game.roomId}] Game finished.`);

    // Send final scores
    const scores = game.players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
    }));

    if (game.timer) clearTimeout(game.timer);
    SocketManager.getInstance().emitToRoom(game.roomId, "game-finished", {
      scores,
    });
    GameManager.getInstance().removeGame(game.roomId);
  }

  onTick(game: Game): void {}
  onGuess(game: Game, playerId: string, guess: string): void {}
}

export default FinishedState;
