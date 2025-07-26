import SocketManager from "./sockets/socketManager";
import { handleSocketConnection } from "./sockets/handleSocketConnection";
const PORT = parseInt(process.env.PORT || "5000", 10);

const socketManager = SocketManager.getInstance();
socketManager.onConnection((socket) => {
  console.log(`🔌 Connected: ${socket.id}`);
  handleSocketConnection(socketManager.getIO(), socket);
});

socketManager.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
