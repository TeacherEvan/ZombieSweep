import { WebSocket, WebSocketServer } from "ws";

const PORT = Number(process.env.PORT ?? 2567);
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const rooms = new Map();
const sockets = new WeakMap();
const connectionCounts = new Map();
const messageCounts = new Map();

const MAX_CONNECTIONS_PER_IP = 5;
const MAX_MESSAGES_PER_SECOND = 30;
const MAX_PAYLOAD_SIZE = 16384;
const ROOM_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

const server = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0",
  maxPayload: MAX_PAYLOAD_SIZE,
});

const metrics = {
  connectionsTotal: 0,
  connectionsActive: 0,
  messagesReceived: 0,
  messagesSent: 0,
  errorsTotal: 0,
  roomsCreated: 0,
  roomsActive: 0,
  latencySamples: [] as number[],
};

function recordLatency(start: number) {
  metrics.latencySamples.push(Date.now() - start);
  if (metrics.latencySamples.length > 1000) {
    metrics.latencySamples.shift();
  }
}

function log(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    service: "zombiesweep-relay",
    ...fields,
  };
  console[level === "error" ? "error" : level](JSON.stringify(entry));
}

function randomRoomCode() {
  let roomCode = "";
  for (let i = 0; i < 4; i++) {
    roomCode += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return roomCode;
}

function send(socket: WebSocket, message: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
    metrics.messagesSent++;
  }
}

function getSocketState(socket: WebSocket) {
  return sockets.get(socket) ?? null;
}

function setSocketState(socket: WebSocket, state: unknown) {
  sockets.set(socket, state);
}

function getClientIP(socket: WebSocket) {
  return socket._socket?.remoteAddress?.replace(/^::ffff:/, "") ?? "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const windowStart = now - 1000;

  const connections = connectionCounts.get(ip) ?? 0;
  if (connections >= MAX_CONNECTIONS_PER_IP) {
    return false;
  }

  const messages = (messageCounts.get(ip) ?? []).filter((t) => t > windowStart);
  if (messages.length >= MAX_MESSAGES_PER_SECOND) {
    return false;
  }

  messages.push(now);
  messageCounts.set(ip, messages);
  connectionCounts.set(ip, connections + 1);

  setTimeout(() => {
    const current = connectionCounts.get(ip) ?? 1;
    connectionCounts.set(ip, Math.max(0, current - 1));
  }, 60000);

  return true;
}

function validateRoomCode(code: unknown) {
  return typeof code === "string" && ROOM_CODE_REGEX.test(code);
}

function validateMode(mode: unknown) {
  return mode === "coop" || mode === "versus";
}

function sanitizeConfig(config: unknown) {
  if (!config || typeof config !== "object") return null;
  const allowedKeys = ["difficulty", "map", "vehicle", "day"];
  const sanitized: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (config[key] !== undefined) {
      sanitized[key] = config[key];
    }
  }
  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function removeRoom(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  if (room.guest) {
    send(room.guest, {
      type: "session-ended",
      reason: "Driver disconnected. Session closed.",
    });
  }
  rooms.delete(roomCode);
  metrics.roomsActive = rooms.size;
}

function getMetricsSnapshot() {
  const sorted = [...metrics.latencySamples].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;

  return {
    connectionsTotal: metrics.connectionsTotal,
    connectionsActive: metrics.connectionsActive,
    messagesReceived: metrics.messagesReceived,
    messagesSent: metrics.messagesSent,
    errorsTotal: metrics.errorsTotal,
    roomsCreated: metrics.roomsCreated,
    roomsActive: metrics.roomsActive,
    latencyMs: { p50, p95, p99, samples: metrics.latencySamples.length },
  };
}

setInterval(() => {
  log("info", "metrics_snapshot", getMetricsSnapshot());
}, 60000);

server.on("connection", (socket: WebSocket) => {
  const start = Date.now();
  const ip = getClientIP(socket);
  const requestId = crypto.randomUUID();

  if (!checkRateLimit(ip)) {
    log("warn", "rate_limit_exceeded", { ip, requestId });
    metrics.errorsTotal++;
    send(socket, { type: "error", message: "Rate limit exceeded. Try again later." });
    socket.close(1009, "Rate limit exceeded");
    return;
  }

  metrics.connectionsTotal++;
  metrics.connectionsActive++;
  log("info", "connection_accepted", { ip, requestId, active: metrics.connectionsActive });

  socket.on("message", (raw) => {
    const msgStart = Date.now();

    if (typeof raw !== "string" && !Buffer.isBuffer(raw)) {
      log("warn", "invalid_payload_type", { ip, requestId, type: typeof raw });
      metrics.errorsTotal++;
      send(socket, { type: "error", message: "Invalid payload type." });
      return;
    }

    const messageStr = String(raw);
    if (messageStr.length > MAX_PAYLOAD_SIZE) {
      log("warn", "payload_too_large", { ip, requestId, size: messageStr.length });
      metrics.errorsTotal++;
      send(socket, { type: "error", message: "Payload too large." });
      return;
    }

    let message;
    try {
      message = JSON.parse(messageStr);
    } catch {
      log("warn", "invalid_json", { ip, requestId });
      metrics.errorsTotal++;
      send(socket, { type: "error", message: "Invalid relay payload." });
      return;
    }

    if (!message || typeof message !== "object" || !message.type) {
      log("warn", "malformed_message", { ip, requestId });
      metrics.errorsTotal++;
      send(socket, { type: "error", message: "Malformed message." });
      return;
    }

    metrics.messagesReceived++;
    const socketState = getSocketState(socket);

    switch (message.type) {
      case "host-room": {
        const mode = validateMode(message.mode) ? message.mode : "coop";
        let roomCode = randomRoomCode();
        while (rooms.has(roomCode)) {
          roomCode = randomRoomCode();
        }

        rooms.set(roomCode, { host: socket, guest: null, mode });
        setSocketState(socket, { role: "host", roomCode, requestId });
        send(socket, { type: "room-hosted", roomCode, mode });
        metrics.roomsCreated++;
        metrics.roomsActive = rooms.size;
        log("info", "room_hosted", { roomCode, mode, requestId });
        break;
      }

      case "join-room": {
        if (!validateRoomCode(message.roomCode)) {
          log("warn", "invalid_room_code", { roomCode: message.roomCode, requestId });
          send(socket, { type: "error", message: "Invalid room code format." });
          return;
        }
        const room = rooms.get(message.roomCode);
        if (!room || room.guest) {
          log("warn", "room_unavailable", { roomCode: message.roomCode, requestId });
          send(socket, { type: "error", message: "Room unavailable." });
          return;
        }

        room.guest = socket;
        setSocketState(socket, { role: "guest", roomCode: message.roomCode, requestId });
        send(socket, {
          type: "room-joined",
          roomCode: message.roomCode,
          role: "gunner",
          mode: room.mode ?? "coop",
        });
        send(room.host, { type: "peer-status", connected: true });
        send(socket, { type: "peer-status", connected: true });
        log("info", "room_joined", { roomCode: message.roomCode, mode: room.mode, requestId });
        break;
      }

      case "host-game-config": {
        if (socketState?.role !== "host") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.guest) return;
        const config = sanitizeConfig(message.config);
        if (config) {
          send(room.guest, { type: "game-config", config });
          log("info", "game_config_sent", { roomCode: socketState.roomCode, config, requestId: socketState.requestId });
        }
        break;
      }

      case "host-start-game": {
        if (socketState?.role !== "host") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.guest) return;
        send(room.guest, { type: "start-game" });
        log("info", "game_started", { roomCode: socketState.roomCode, requestId: socketState.requestId });
        break;
      }

      case "driver-snapshot": {
        if (socketState?.role !== "host") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.guest) return;
        if (message.snapshot && typeof message.snapshot === "object") {
          send(room.guest, { type: "snapshot", snapshot: message.snapshot });
        }
        break;
      }

      case "host-finish-match": {
        if (socketState?.role !== "host") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.guest) return;
        if (message.result && typeof message.result === "object") {
          send(room.guest, { type: "match-result", result: message.result });
          log("info", "match_finished", { roomCode: socketState.roomCode, result: message.result, requestId: socketState.requestId });
        }
        break;
      }

      case "gunner-action": {
        if (socketState?.role !== "guest") return;
        const room = rooms.get(socketState.roomCode);
        if (!room?.host) return;
        if (message.action && typeof message.action === "object") {
          send(room.host, { type: "gunner-action", action: message.action });
        }
        break;
      }

      case "metrics": {
        send(socket, { type: "metrics", data: getMetricsSnapshot() });
        break;
      }

      default:
        log("warn", "unsupported_message", { type: message.type, requestId });
        send(socket, { type: "error", message: "Unsupported relay message." });
    }

    recordLatency(msgStart);
  });

  socket.on("close", (code, reason) => {
    const socketState = getSocketState(socket);
    if (!socketState) {
      metrics.connectionsActive = Math.max(0, metrics.connectionsActive - 1);
      return;
    }

    const room = rooms.get(socketState.roomCode);
    if (!room) {
      metrics.connectionsActive = Math.max(0, metrics.connectionsActive - 1);
      return;
    }

    if (socketState.role === "host") {
      removeRoom(socketState.roomCode);
      log("info", "host_disconnected", { roomCode: socketState.roomCode, closeCode: code, requestId: socketState.requestId });
    } else {
      room.guest = null;
      send(room.host, { type: "peer-status", connected: false });
      log("info", "guest_disconnected", { roomCode: socketState.roomCode, closeCode: code, requestId: socketState.requestId });
    }

    metrics.connectionsActive = Math.max(0, metrics.connectionsActive - 1);
  });

  socket.on("error", (err) => {
    const socketState = getSocketState(socket);
    log("error", "websocket_error", {
      ip,
      error: err.message,
      requestId: socketState?.requestId,
    });
    metrics.errorsTotal++;
  });
});

process.on("SIGTERM", () => {
  log("info", "shutdown_signal", { signal: "SIGTERM" });
  log("info", "final_metrics", getMetricsSnapshot());
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  log("info", "shutdown_signal", { signal: "SIGINT" });
  log("info", "final_metrics", getMetricsSnapshot());
  server.close(() => process.exit(0));
});

log("info", "server_started", { port: PORT, pid: process.pid });