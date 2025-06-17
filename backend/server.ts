import SocketManager from "./src/sockets/socketManager";
import { handleSocketConnection } from "./src/sockets/handleSocketConnection";
const PORT = parseInt(process.env.PORT || "3000", 10);

const socketManager = SocketManager.getInstance();
socketManager.onConnection((socket) => {
  console.log(`🔌 Connected: ${socket.id}`);
  handleSocketConnection(socketManager.getIO(), socket);
});

socketManager.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
