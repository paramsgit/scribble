// src/game/core/Game.ts
import redis from "../sockets/connectToRedis";
import { Player } from "./roomManager";
import DrawingState from "./states/drawingState";
import FinishedState from "./states/finishedState";
import GameState from "./states/gameState";
import WaitingState from "./states/waitingState";

interface SerializedGame {
  roomId: string;
  players: Player[];
  wordList: string[];
  currentWordIndex: number;
  currentWord: { word: string; time: string; id: number };
  drawerId: string;
  guessedPlayerIds: string[];
  stateName: string;
}

class Game {
  public roomId: string;
  public players: Player[] = [];
  public wordList: string[] = [];
  public currentWordIndex = -1;
  public currentWord = { word: "", time: new Date(), id: 0 };
  public drawerId: string = "";
  public guessedPlayerIds: Set<string> = new Set();
  public timer: NodeJS.Timeout | null = null;
  private state!: GameState;

  constructor(roomId: string, players: Player[] = []) {
    this.roomId = roomId;
    this.players = players;
    this.setState(new WaitingState());
  }

  private getRedisKey(): string {
    return `game:${this.roomId}`;
  }

  private serialize(): SerializedGame {
    return {
      roomId: this.roomId,
      players: this.players,
      wordList: this.wordList,
      currentWordIndex: this.currentWordIndex,
      currentWord: {
        ...this.currentWord,
        time: this.currentWord.time.toISOString(),
      },
      drawerId: this.drawerId,
      guessedPlayerIds: Array.from(this.guessedPlayerIds),
      stateName: this.state.constructor.name,
    };
  }

  // Deserialize game state from Redis
  private deserialize(data: SerializedGame): void {
    this.players = data.players;
    this.wordList = data.wordList;
    this.currentWordIndex = data.currentWordIndex;
    this.currentWord = {
      ...data.currentWord,
      time: new Date(data.currentWord.time),
    };
    this.drawerId = data.drawerId;
    this.guessedPlayerIds = new Set(data.guessedPlayerIds);

    // Restore state based on state name
    switch (data.stateName) {
      case "WaitingState":
        this.state = new WaitingState();
        break;
      case "DrawingState":
        this.state = new DrawingState();
        break;
      case "FinishedState":
        this.state = new FinishedState();
        break;
      default:
        this.state = new WaitingState();
    }
  }

  // Save game state to Redis
  public async save(): Promise<void> {
    const serialized = this.serialize();
    await redis.setex(
      this.getRedisKey(),
      3600, // TTL: 1 hour
      JSON.stringify(serialized)
    );
  }

  // Load game state from Redis
  public static async load(roomId: string): Promise<Game | null> {
    const key = `game:${roomId}`;
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    try {
      const serialized: SerializedGame = JSON.parse(data);
      const game = new Game(roomId);
      game.deserialize(serialized);
      return game;
    } catch (error) {
      console.error("Error deserializing game data:", error);
      return null;
    }
  }

  // Create or load a game
  public static async createOrLoad(
    roomId: string,
    players: Player[] = []
  ): Promise<Game> {
    const existingGame = await Game.load(roomId);

    if (existingGame) {
      return existingGame;
    }

    const newGame = new Game(roomId, players);
    await newGame.save();
    return newGame;
  }

  // Delete game from Redis
  public async delete(): Promise<void> {
    await redis.del(this.getRedisKey());
  }

  public async setState(state: GameState): Promise<void> {
    this.state = state;
    this.state.onEnter(this);
    await this.save(); // Auto-save when state changes
  }

  public getState(): GameState {
    return this.state;
  }

  public async addPlayer(player: Player): Promise<boolean> {
    if (
      this.players.some((existingPlayer) => existingPlayer.id === player.id)
    ) {
      return false;
    }

    this.players.push(player);
    await this.save(); // Auto-save when players change
    return true;
  }

  public async removePlayer(playerId: string): Promise<boolean> {
    const playerIndex = this.players.findIndex(
      (existingPlayer) => existingPlayer.id === playerId
    );

    if (playerIndex === -1) {
      return false;
    }

    this.players.splice(playerIndex, 1);

    if (this.players.length <= 1) {
      await this.setState(new FinishedState());
    }

    if (this.drawerId === playerId) {
      if (this.timer) clearTimeout(this.timer);
      await this.setState(new DrawingState());
    }

    await this.save(); // Auto-save when players change
    return true;
  }

  public async onTick(): Promise<void> {
    this.state.onTick(this);
    await this.save(); // Auto-save on tick
  }

  public async onGuess(playerId: string, guess: string): Promise<boolean> {
    const result = this.state.onGuess(this, playerId, guess);
    await this.save(); // Auto-save after guess
    return result;
  }

  // // Utility method to extend TTL
  // public async extendTTL(seconds: number = 3600): Promise<void> {
  //   if (!Game.redisClient) {
  //     throw new Error('Redis client not initialized.');
  //   }

  //   await Game.redisClient.expire(this.getRedisKey(), seconds);
  // }

  // // Get all active games
  // public static async getAllActiveGames(): Promise<string[]> {
  //   if (!Game.redisClient) {
  //     throw new Error('Redis client not initialized.');
  //   }

  //   const keys = await Game.redisClient.keys('game:*');
  //   return keys.map(key => key.replace('game:', ''));
  // }

  // // Cleanup expired games (optional utility)
  // public static async cleanup(): Promise<number> {
  //   if (!Game.redisClient) {
  //     throw new Error('Redis client not initialized.');
  //   }

  //   const keys = await Game.redisClient.keys('game:*');
  //   const pipeline = Game.redisClient.multi();

  //   for (const key of keys) {
  //     const ttl = await Game.redisClient.ttl(key);
  //     if (ttl === -1) { // No TTL set
  //       pipeline.expire(key, 3600); // Set 1 hour TTL
  //     }
  //   }

  //   const results = await pipeline.exec();
  //   return results ? results.length : 0;
  // }
}

export default Game;
