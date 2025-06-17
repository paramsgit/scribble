// src/game/core/states/DrawingState.ts
import SocketManager from "../../sockets/socketManager";
import Game from "../game";
import GameState from "./gameState";

class DrawingState extends GameState {
  private timeLimit = 5 * 1000; // 60 sec

  onEnter(game: Game): void {
    game.currentWordIndex++;
    if (game.currentWordIndex >= 12) {
      console.log(`[Game:${game.roomId}] Game finished.`);
      return;
    }

    const word = this.pickWord();
    game.wordList.push(word);
    game.drawerId = this.pickDrawer(game);
    game.guessedPlayerIds.clear();

    console.log(
      `[Game:${game.roomId}] New word started ${word}. Drawer: ${game.drawerId}`
    );

    game.timer = setTimeout(() => {
      game.setState(new DrawingState()); // move to next word
    }, this.timeLimit);
  }

  onTick(game: Game): void {
    // future timer-based updates
  }

  onGuess(game: Game, playerId: string, guess: string): void {
    if (game.guessedPlayerIds.has(playerId)) return;
    const currentWord = game.wordList[game.currentWordIndex];
    if (guess.toLowerCase() === currentWord.toLowerCase()) {
      console.log(`[Game:${game.roomId}] ${playerId} guessed correctly!`);
      game.guessedPlayerIds.add(playerId);

      SocketManager.getInstance().emitToRoom(
        game.roomId,
        "player-guessed-correctly",
        {
          playerId,
          word: currentWord,
        }
      );

      const nonDrawers = game.players.filter((p) => p.id !== game.drawerId);
      const allGuessed = nonDrawers.every((p) =>
        game.guessedPlayerIds.has(p.id)
      );
      if (allGuessed) {
        if (game.timer) clearTimeout(game.timer);
        setTimeout(() => {
          game.setState(new DrawingState());
        }, 2000);
      }
    }
  }

  private pickWord(): string {
    const pool = [
      "apple",
      "car",
      "house",
      "cat",
      "dog",
      "ball",
      "tree",
      "star",
      "book",
      "phone",
      "chair",
      "pizza",
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private pickDrawer(game: Game): string {
    const index = game.currentWordIndex % game.players.length;
    return game.players[index].id;
  }
}

export default DrawingState;
