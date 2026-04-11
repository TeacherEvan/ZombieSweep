import { WebSocket, WebSocketServer } from "ws";

const PORT = Number(process.env.PORT ?? 2567);
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const rooms = new Map();
const sockets = new WeakMap();

const server = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

function randomRoomCode() {
  let roomCode = "";
  for (let i = 0; i < 4; i++) {
    roomCode += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return roomCode;
}

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function getSocketState(socket) {
  return sockets.get(socket) ?? null;
}

function setSocketState(socket, state) {
  sockets.set(socket, state);
}

function removeRoom(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  if (room.guest) {
    send(room.guest, {
      type: "session-ended",
      reason: "Driver disconnected. Session closed.",
    });
  }
  rooms.delete(roomCode);
}

server.on("connection", (socket) => {
  socket.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(String(raw));
    } catch {
      send(socket, { type: "error", message: "Invalid relay payload." });
      return;
    }

    const socketState = getSocketState(socket);

    switch (message.type) {
      case "host-room": {
        let roomCode = randomRoomCode();
        while (rooms.has(roomCode)) {
          roomCode = randomRoomCode();
        }

        rooms.set(roomCode, { host: socket, guest: null, mode: message.mode ?? "coop" });
        setSocketState(socket, { role: "host", roomCode });
        send(socket, { type: "room-hosted", roomCode, mode: message.mode ?? "coop" });
        break;
      }

      case "join-room": {
        const room = rooms.get(message.roomCode);
        if (!room || room.guest) {
          send(socket, { type: "error", message: "Room unavailable." });
          return;
        }

        room.guest = socket;
        setSocketState(socket, { role: "guest", roomCode: message.roomCode });
        send(socket, {
          type: "room-joined",
          roomCode: message.roomCode,
          role: "gunner",
          mode: room.mode ?? "coop",
        });
        send(room.host, { type: "peer-status", connected: true });
        send(socket, { type: "peer-status", connected: true });
        break;
      }

      case "host-game-config": {
        if (socketState?.role !== "host") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.guest) return;
        send(room.guest, { type: "game-config", config: message.config });
        break;
      }

      case "host-start-game": {
        if (socketState?.role !== "host") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.guest) return;
        send(room.guest, { type: "start-game" });
        break;
      }

      case "driver-snapshot": {
        if (socketState?.role !== "host") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.guest) return;
        send(room.guest, { type: "snapshot", snapshot: message.snapshot });
        break;
      }

      case "host-finish-match": {
        if (socketState?.role !== "host") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.guest) return;
        send(room.guest, { type: "match-result", result: message.result });
        break;
      }

      case "gunner-action": {
        if (socketState?.role !== "guest") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.host) return;
        send(room.host, { type: "gunner-action", action: message.action });
        break;
      }

      default:
        send(socket, { type: "error", message: "Unsupported relay message." });
    }
  });

  socket.on("close", () => {
    const socketState = getSocketState(socket);
    if (!socketState) return;

    const room = rooms.get(socketState.roomCode);
    if (!room) return;

    if (socketState.role === "host") {
      removeRoom(socketState.roomCode);
      return;
    }

    room.guest = null;
    send(room.host, { type: "peer-status", connected: false });
  });
});

console.log(`ZombieSweep co-op relay listening on ws://0.0.0.0:${PORT}`);
