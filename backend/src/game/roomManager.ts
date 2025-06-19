import GameManager from "./gameManager";
import FinishedState from "./states/finishedState";

export interface Player {
  name: string;
  id: string;
  score?: number;
}

class RoomManager {
  private static instance: RoomManager;
  private rooms: Record<string, Player[]> = {};
  private playerRoomMap: Record<string, string> = {};

  public constructor() {}

  public static getInstance() {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }
  public addPlayer(player: Player, roomId: string) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = [];
    }
    if (this.rooms[roomId].length >= 6) {
      throw new Error("Room is full");
    }
    player.score = 0;
    this.rooms[roomId].push(player);
    this.playerRoomMap[player.id] = roomId;
  }

  public removePlayer(socketId: string) {
    const roomId = this.playerRoomMap[socketId];
    if (!roomId) return null;

    const players = this.rooms[roomId];
    if (!players) {
      this.clearRoom(roomId);
      return null;
    }
    GameManager.getInstance().removePlayerFromGame(roomId, socketId);

    this.rooms[roomId] = players.filter((p) => p.id !== socketId);
    delete this.playerRoomMap[socketId];
    if (this.rooms[roomId].length === 0) {
      this.clearRoom(roomId);
    }
    return roomId;
  }

  public clearRoom(roomId: string) {
    const players = this.rooms[roomId];
    // if (!players) return;
    console.log("deleting room", roomId);
    players?.forEach((p) => delete this.playerRoomMap[p.id]);
    const game = GameManager.getInstance().getGame(roomId);
    if (game) {
      game.setState(new FinishedState());
    }
    delete this.rooms[roomId];

    // deleting same game
  }

  public getRoomPlayers(roomId: string): Player[] {
    return this.rooms[roomId] || [];
  }

  public getRoomOfPlayer(socketId: string): string | null {
    return this.playerRoomMap[socketId] || null;
  }
}

export default RoomManager;
