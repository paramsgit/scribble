import { Socket, Server } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import app from "../app";

class SocketManager {
  private static instance: SocketManager;
  private io!: Server;
  private httpServer!: HTTPServer;

  private constructor() {
    this.httpServer = createServer(app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public getIO(): Server {
    return this.io;
  }

  public listen(port: number, cb?: () => void) {
    this.httpServer.listen(port, cb);
  }

  public onConnection(callback: (socket: Socket) => void) {
    this.io.on("connection", callback);
  }

  emitToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  emitToPlayer(socketId: string, event: string, data: any) {
    this.io.to(socketId).emit(event, data);
  }
}

export default SocketManager;
