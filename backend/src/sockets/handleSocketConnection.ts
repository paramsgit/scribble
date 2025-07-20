import { Server, Socket } from "socket.io";
import RoomManager, { Player } from "../game/roomManager";
import SocketManager from "./socketManager";
import GameManager from "../game/gameManager";
import DrawingState from "../game/states/drawingState";
import Game from "../game/game";
import config from "../../config";
export function handleSocketConnection(io: Server, socket: Socket) {
  const roomManager = RoomManager.getInstance();

  socket.on("join-room", ({ roomId, name = "", avatarVariant = "" }) => {
    if (!roomId) {
      roomId = findAvailableRoomId();
    }
    roomManager.addPlayer({ id: socket.id, name, avatarVariant }, roomId);
    socket.join(roomId);
    console.log("Plyer joined room ", roomId);
    const players = roomManager.getRoomPlayers(roomId);
    // io.to(roomId).emit("room-update", players);

    SocketManager.getInstance().emitToRoom(roomId, "room-update", {
      players: players,
      roomId,
    });
    addPlayerToGame(roomId, { id: socket.id, name, avatarVariant }, players);
  });

  socket.on("guess", ({ message }) => {
    const roomId = roomManager.getRoomOfPlayer(socket.id);
    if (roomId) {
      const game = GameManager.getInstance().getGame(roomId);
      if (game) {
        const isCorrect = game.onGuess(socket.id, message);
        if (isCorrect) {
          SocketManager.getInstance().emitToPlayer(socket.id, "correct-guess", {
            word: message,
          });
        }
        message = isCorrect ? "Guessed right" : message;
        SocketManager.getInstance().emitToRoom(roomId, "message", {
          message,
          player: socket.id,
          isCorrect,
        });
      }
    }
  });

  socket.on("draw-command", ({ commands }) => {
    const roomId = roomManager.getRoomOfPlayer(socket.id);
    if (roomId) {
      const drawerId = GameManager.getInstance().getDrawerId(roomId);
      if (drawerId === socket.id) {
        SocketManager.getInstance().emitToRoom(roomId, "draw-command", {
          commands,
          drawer: socket.id,
        });
      }
    }
  });

  socket.on("request-game-details", ({ roomId }: { roomId: string }) => {
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
  console.log("added player to game");
  if (players.length >= 2) {
    console.log(game.getState() instanceof DrawingState);
    if (!(game.getState() instanceof DrawingState)) {
      setTimeout(() => {
        console.log("this is called");
        game.setState(new DrawingState());
      }, 5000);
      SocketManager.getInstance().emitToRoom(roomId, "game-start", game);
    }
  }
  return game;
}
