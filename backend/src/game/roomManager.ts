import redis from "../sockets/connectToRedis";
import GameManager from "./gameManager";
import FinishedState from "./states/finishedState";

export interface Player {
  name: string;
  avatarVariant: string;
  id: string;
  score?: number;
}

class RoomManager {
  private static instance: RoomManager;

  public constructor() {}

  public static getInstance() {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  // Redis key helpers
  private getRoomKey(roomId: string): string {
    return `room:${roomId}:players`;
  }

  private getPlayerRoomKey(playerId: string): string {
    return `player:${playerId}:room`;
  }

  private getAllRoomsKey(): string {
    return "rooms:active";
  }

  public async addPlayer(player: Player, roomId: string): Promise<void> {
    // Check current room size
    const currentPlayers = await this.getRoomPlayers(roomId);

    if (currentPlayers.length >= 6) {
      throw new Error("Room is full");
    }

    // Set default score
    player.score = 0;

    // Add player to room
    const updatedPlayers = [...currentPlayers, player];
    await redis.setex(
      this.getRoomKey(roomId),
      7200, // 2 hours TTL
      JSON.stringify(updatedPlayers)
    );

    // Map player to room
    await redis.setex(
      this.getPlayerRoomKey(player.id),
      7200, // 2 hours TTL
      roomId
    );

    // Add room to active rooms set
    await redis.sadd(this.getAllRoomsKey(), roomId);
  }

  public async removePlayer(socketId: string): Promise<string | null> {
    const roomId = await this.getRoomOfPlayer(socketId);
    if (!roomId) return null;

    const players = await this.getRoomPlayers(roomId);
    if (players.length === 0) {
      await this.clearRoom(roomId);
      return null;
    }

    // Remove player from game
    GameManager.getInstance().removePlayerFromGame(roomId, socketId);

    // Update room players
    const updatedPlayers = players.filter((p) => p.id !== socketId);

    if (updatedPlayers.length === 0) {
      await this.clearRoom(roomId);
    } else {
      await redis.setex(
        this.getRoomKey(roomId),
        7200, // 2 hours TTL
        JSON.stringify(updatedPlayers)
      );
    }

    // Remove player room mapping
    await redis.del(this.getPlayerRoomKey(socketId));

    return roomId;
  }

  public async clearRoom(roomId: string): Promise<void> {
    const players = await this.getRoomPlayers(roomId);

    console.log("deleting room", roomId);

    // Remove all player room mappings
    if (players.length > 0) {
      const pipeline = redis.pipeline();
      players.forEach((p) => {
        pipeline.del(this.getPlayerRoomKey(p.id));
      });
      await pipeline.exec();
    }

    // Set game to finished state
    const game = GameManager.getInstance().getGame(roomId);
    if (game) {
      game.setState(new FinishedState());
    }

    // Remove room data
    await redis.del(this.getRoomKey(roomId));

    // Remove from active rooms set
    await redis.srem(this.getAllRoomsKey(), roomId);
  }

  public async getRoomPlayers(roomId: string): Promise<Player[]> {
    const data = await redis.get(this.getRoomKey(roomId));

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error("Error parsing room players data:", error);
      return [];
    }
  }

  public async getRoomOfPlayer(socketId: string): Promise<string | null> {
    return await redis.get(this.getPlayerRoomKey(socketId));
  }

  // Additional utility methods for Redis-based room management

  public async getAllActiveRooms(): Promise<string[]> {
    return await redis.smembers(this.getAllRoomsKey());
  }

  public async getRoomCount(): Promise<number> {
    return await redis.scard(this.getAllRoomsKey());
  }

  public async updatePlayerScore(
    playerId: string,
    score: number
  ): Promise<boolean> {
    const roomId = await this.getRoomOfPlayer(playerId);
    if (!roomId) return false;

    const players = await this.getRoomPlayers(roomId);
    const playerIndex = players.findIndex((p) => p.id === playerId);

    if (playerIndex === -1) return false;

    players[playerIndex].score = score;

    await redis.setex(this.getRoomKey(roomId), 7200, JSON.stringify(players));

    return true;
  }

  public async getPlayerFromRoom(
    roomId: string,
    playerId: string
  ): Promise<Player | null> {
    const players = await this.getRoomPlayers(roomId);
    return players.find((p) => p.id === playerId) || null;
  }

  public async isRoomFull(roomId: string): Promise<boolean> {
    const players = await this.getRoomPlayers(roomId);
    return players.length >= 6;
  }

  public async extendRoomTTL(
    roomId: string,
    seconds: number = 7200
  ): Promise<void> {
    const pipeline = redis.pipeline();

    // Extend room players TTL
    pipeline.expire(this.getRoomKey(roomId), seconds);

    // Extend all player mappings TTL
    const players = await this.getRoomPlayers(roomId);
    players.forEach((player) => {
      pipeline.expire(this.getPlayerRoomKey(player.id), seconds);
    });

    await pipeline.exec();
  }

  // Cleanup expired rooms
  public async cleanup(): Promise<number> {
    const activeRooms = await this.getAllActiveRooms();
    const pipeline = redis.pipeline();
    let cleanedCount = 0;

    for (const roomId of activeRooms) {
      const exists = await redis.exists(this.getRoomKey(roomId));
      if (!exists) {
        // Room data expired but still in active set
        pipeline.srem(this.getAllRoomsKey(), roomId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      await pipeline.exec();
      console.log(`Cleaned up ${cleanedCount} expired rooms`);
    }

    return cleanedCount;
  }

  // Get room statistics
  public async getRoomStats(roomId: string): Promise<{
    playerCount: number;
    players: Player[];
    ttl: number;
  } | null> {
    const players = await this.getRoomPlayers(roomId);
    if (players.length === 0) return null;

    const ttl = await redis.ttl(this.getRoomKey(roomId));

    return {
      playerCount: players.length,
      players,
      ttl,
    };
  }

  // Batch operations for better performance
  public async getMultipleRoomPlayers(
    roomIds: string[]
  ): Promise<Record<string, Player[]>> {
    if (roomIds.length === 0) return {};

    const pipeline = redis.pipeline();
    roomIds.forEach((roomId) => {
      pipeline.get(this.getRoomKey(roomId));
    });

    const results = await pipeline.exec();
    const roomsData: Record<string, Player[]> = {};

    roomIds.forEach((roomId, index) => {
      const result = results?.[index];
      if (result && result[1]) {
        try {
          roomsData[roomId] = JSON.parse(result[1] as string);
        } catch (error) {
          console.error(`Error parsing data for room ${roomId}:`, error);
          roomsData[roomId] = [];
        }
      } else {
        roomsData[roomId] = [];
      }
    });

    return roomsData;
  }
}

export default RoomManager;
