import { Server, Socket } from "socket.io";
import RoomManager, { Player } from "../game/roomManager";
import SocketManager from "./socketManager";
import GameManager from "../game/gameManager";
import DrawingState from "../game/states/drawingState";
import Game from "../game/game";
export function handleSocketConnection(io: Server, socket: Socket) {
  const roomManager = RoomManager.getInstance();

  socket.on("join-room", ({ roomId, name }) => {
    if (!roomId) {
      roomId = findAvailableRoomId();
    }
    roomManager.addPlayer({ id: socket.id, name }, roomId);
    socket.join(roomId);
    console.log("Plyer joined room ", roomId);
    const players = roomManager.getRoomPlayers(roomId);
    // io.to(roomId).emit("room-update", players);

    SocketManager.getInstance().emitToRoom(roomId, "room-update", {
      players: players,
      roomId,
    });
    addPlayerToGame(roomId, { id: socket.id, name }, players);
  });

  socket.on("guess", ({ message }) => {
    const roomId = roomManager.getRoomOfPlayer(socket.id);
    if (roomId) {
      const game = GameManager.getInstance().getGame(roomId);
      if (game) {
        const isCorrect = game.onGuess(socket.id, message);
        message = isCorrect ? "Guessed right" : message;
        SocketManager.getInstance().emitToRoom(roomId, "message", {
          message,
          player: socket.id,
          isCorrect,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected: ", socket.id);
    const roomId = roomManager.removePlayer(socket.id);
    if (roomId) {
      const players = roomManager.getRoomPlayers(roomId);
      SocketManager.getInstance().emitToRoom(roomId, "room-update", {
        players,
      });
    }
  });
}

function findAvailableRoomId(): string {
  const roomManager = RoomManager.getInstance();
  const rooms = Object.keys((roomManager as any)["rooms"]);

  for (const id of rooms) {
    const players = roomManager.getRoomPlayers(id);
    if (players.length < 6) return id;
  }

  return "room-" + Math.random().toString(36).substring(2, 8);
}

function addPlayerToGame(
  roomId: string,
  player: Player,
  players: Player[]
): Game {
  const game = GameManager.getInstance().addPlayerToGame(roomId, player);
  if (players.length >= 2) {
    if (!(game.getState() instanceof DrawingState)) {
      game.setState(new DrawingState());
    }
  }
  // SocketManager.getInstance().emitToRoom(roomId, "game", game);
  return game;
}
