import { io, Socket } from "socket.io-client";

class SocketManager {
  private static instance: Socket;

  static getInstance(): Socket {
    if (!SocketManager.instance) {
      SocketManager.instance = io("http://54.90.128.223/:5000");
    }
    return SocketManager.instance;
  }
}

export default SocketManager;
