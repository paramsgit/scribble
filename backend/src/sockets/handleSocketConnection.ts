import { Server, Socket } from "socket.io";
import RoomManager, { Player } from "../game/roomManager";
import SocketManager from "./socketManager";
import GameManager from "../game/gameManager";
import DrawingState from "../game/states/drawingState";
import Game from "../game/game";
import config from "../../config";

export function handleSocketConnection(io: Server, socket: Socket) {
  const roomManager = RoomManager.getInstance();

  socket.on("join-room", async ({ roomId, name = "", avatarVariant = "" }) => {
    try {
      if (!roomId) {
        roomId = await findAvailableRoomId();
      }

      await roomManager.addPlayer(
        { id: socket.id, name, avatarVariant },
        roomId
      );
      socket.join(roomId);
      console.log("Player joined room ", roomId);

      const players = await roomManager.getRoomPlayers(roomId);

      SocketManager.getInstance().emitToRoom(roomId, "room-update", {
        players: players,
        roomId,
      });

      await addPlayerToGame(
        roomId,
        { id: socket.id, name, avatarVariant },
        players
      );
    } catch (error: any) {
      console.error("Error in join-room:", error);
      socket.emit("join-error", { message: error.message });
    }
  });

  socket.on("guess", async ({ message }) => {
    try {
      const roomId = await roomManager.getRoomOfPlayer(socket.id);
      if (roomId) {
        const game = GameManager.getInstance().getGame(roomId);
        if (game) {
          const isCorrect = await game.onGuess(socket.id, message);
          if (isCorrect) {
            SocketManager.getInstance().emitToPlayer(
              socket.id,
              "correct-guess",
              {
                word: message,
              }
            );
          }
          message = isCorrect ? "Guessed right" : message;
          SocketManager.getInstance().emitToRoom(roomId, "message", {
            message,
            player: socket.id,
            isCorrect,
          });
        }
      }
    } catch (error: any) {
      console.error("Error in guess:", error);
      socket.emit("guess-error", { message: error.message });
    }
  });

  socket.on("draw-command", async ({ commands }) => {
    try {
      const roomId = await roomManager.getRoomOfPlayer(socket.id);
      if (roomId) {
        const drawerId = GameManager.getInstance().getDrawerId(roomId);
        if (drawerId === socket.id) {
          SocketManager.getInstance().emitToRoom(roomId, "draw-command", {
            commands,
            drawer: socket.id,
          });
        }
      }
    } catch (error) {
      console.error("Error in draw-command:", error);
    }
  });

  socket.on("request-game-details", async ({ roomId }: { roomId: string }) => {
    try {
      console.log("get game: ", socket.id);
      // TODO: Create diff fxn for it
      const game = GameManager.getInstance().getGame(roomId);
      if (!game) {
        return;
      }
      const oldTime: Date = game.currentWord?.time;
      const currentTime = new Date();
      const diffInMs = currentTime.getTime() - oldTime.getTime();
      const diffInSeconds = config.gameTime - Math.floor(diffInMs / 1000);

      SocketManager.getInstance().emitToPlayer(socket.id, "game-details", {
        word_length: game.currentWord?.word?.length,
        drawer: game.drawerId,
        time: diffInSeconds - 1,
      });
    } catch (error) {
      console.error("Error in request-game-details:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      console.log("Disconnected: ", socket.id);
      const roomId = await roomManager.removePlayer(socket.id);
      if (roomId) {
        const players = await roomManager.getRoomPlayers(roomId);
        SocketManager.getInstance().emitToRoom(roomId, "room-update", {
          players,
        });
      }
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
}

async function findAvailableRoomId(): Promise<string> {
  try {
    const roomManager = RoomManager.getInstance();

    // Get all active rooms from Redis
    const activeRoomIds = await roomManager.getAllActiveRooms();

    // Check each room for availability
    for (const roomId of activeRoomIds) {
      const isFull = await roomManager.isRoomFull(roomId);
      if (!isFull) {
        return roomId;
      }
    }

    // If no available room found, create a new one
    return "room-" + Math.random().toString(36).substring(2, 8);
  } catch (error) {
    console.error("Error finding available room:", error);
    // Fallback to creating a new room
    return "room-" + Math.random().toString(36).substring(2, 8);
  }
}

async function addPlayerToGame(
  roomId: string,
  player: Player,
  players: Player[]
): Promise<Game> {
  try {
    const game = GameManager.getInstance().addPlayerToGame(roomId, player);
    console.log("added player to game");

    if (players.length >= 2) {
      console.log(game.getState() instanceof DrawingState);
      if (!(game.getState() instanceof DrawingState)) {
        setTimeout(async () => {
          try {
            console.log("this is called");
            await game.setState(new DrawingState());
          } catch (error) {
            console.error("Error setting game state:", error);
          }
        }, 5000);
        SocketManager.getInstance().emitToRoom(roomId, "game-start", game);
      }
    }
    return game;
  } catch (error) {
    console.error("Error adding player to game:", error);
    throw error;
  }
}

// Additional utility functions for better room management

export async function getRoomStats(): Promise<{
  totalRooms: number;
  totalPlayers: number;
  rooms: Record<string, Player[]>;
}> {
  try {
    const roomManager = RoomManager.getInstance();
    const activeRooms = await roomManager.getAllActiveRooms();
    const roomCount = await roomManager.getRoomCount();

    // Get detailed stats for all rooms
    const roomsData = await roomManager.getMultipleRoomPlayers(activeRooms);

    const totalPlayers = Object.values(roomsData).reduce(
      (sum, players) => sum + players.length,
      0
    );

    return {
      totalRooms: roomCount,
      totalPlayers,
      rooms: roomsData,
    };
  } catch (error) {
    console.error("Error getting room stats:", error);
    return {
      totalRooms: 0,
      totalPlayers: 0,
      rooms: {},
    };
  }
}

export async function cleanupExpiredRooms(): Promise<number> {
  try {
    const roomManager = RoomManager.getInstance();
    return await roomManager.cleanup();
  } catch (error) {
    console.error("Error during cleanup:", error);
    return 0;
  }
}

// Enhanced error handling for socket events
export function setupErrorHandling(socket: Socket) {
  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });

  socket.conn.on("error", (error) => {
    console.error(`Connection error for ${socket.id}:`, error);
  });
}

// Room management utilities
export async function forceCleanRoom(roomId: string): Promise<boolean> {
  try {
    const roomManager = RoomManager.getInstance();
    await roomManager.clearRoom(roomId);
    return true;
  } catch (error) {
    console.error(`Error force cleaning room ${roomId}:`, error);
    return false;
  }
}

export async function extendRoomActivity(roomId: string): Promise<boolean> {
  try {
    const roomManager = RoomManager.getInstance();
    await roomManager.extendRoomTTL(roomId);
    return true;
  } catch (error) {
    console.error(`Error extending room TTL for ${roomId}:`, error);
    return false;
  }
}
