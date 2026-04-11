import { ClientMessage, ServerMessage } from "./protocol";

type MessageListener = (message: ServerMessage) => void;
type ConnectionListener = () => void;

export class MultiplayerSession {
  private socket: WebSocket | null = null;
  private messageListeners = new Set<MessageListener>();
  private closeListeners = new Set<ConnectionListener>();

  async connect(serverUrl: string): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(serverUrl);
      let settled = false;

      socket.addEventListener("open", () => {
        settled = true;
        this.socket = socket;
        resolve();
      });

      socket.addEventListener("message", (event) => {
        const payload = JSON.parse(event.data) as ServerMessage;
        this.messageListeners.forEach((listener) => listener(payload));
      });

      socket.addEventListener("close", () => {
        this.socket = null;
        this.closeListeners.forEach((listener) => listener());
        if (!settled) {
          reject(new Error("Unable to reach the co-op relay."));
        }
      });

      socket.addEventListener("error", () => {
        if (!settled) {
          reject(new Error("Unable to reach the co-op relay."));
        }
      });
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  send(message: ClientMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  onClose(listener: ConnectionListener): () => void {
    this.closeListeners.add(listener);
    return () => {
      this.closeListeners.delete(listener);
    };
  }
}
