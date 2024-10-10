import { io, Socket } from "socket.io-client";

/**
 * Configuration object for MindneySDK.
 */
export interface MindneyConfig {
  readonly clientId: string;
  readonly apiKey: string;
  readonly secretToken: string;
}

/**
 * Interface representing an AI message.
 *
 * @template T - The type of the data contained in the message.
 */
export interface AIMessage<T> {
  readonly operation: string;
  readonly data: T;
}

/**
 * Interface representing a human message.
 *
 * @template T - The type of the data contained in the message.
 */
export interface HumanMessage<T> {
  readonly prompt: string;
  readonly data: T;
}

/**
 * Interface representing an AI error exception.
 */
export interface AIErrorException {
  readonly code: number;
  readonly message: string;
}

/**
 * Type representing possible commands.
 */
export type Commands = "request";

/**
 * Class representing the MindneySDK.
 */
export class MindneySDK {
  private readonly endpoint: string = "https://ai.mindney.com";
  private socket: Socket;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly secretToken: string;

  /**
   * Creates an instance of MindneySDK.
   *
   * @param {MindneyConfig} config - The configuration object containing clientId, apiKey, and secretToken.
   */
  constructor(config: MindneyConfig) {
    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
    this.secretToken = config.secretToken;

    this.validateCredentials();
    this.socket = io(this.endpoint, {
      auth: {
        clientId: this.clientId,
        apiKey: this.apiKey,
        secretToken: this.secretToken,
      },
    });
    this.initializeSocket();
  }

  /**
   * Validates the credentials provided in the configuration.
   *
   * @throws {Error} Throws an error if the clientId, apiKey, or secretToken is missing.
   */
  private validateCredentials(): void {
    if (!this.clientId || !this.apiKey || !this.secretToken) {
      throw new Error("Client ID, API key, and secret token are required");
    }
  }

  /**
   * Initializes the Socket.IO connection and sets up event handlers for various Socket.IO events.
   *
   * @private
   */
  private initializeSocket(): void {
    this.socket.on("connect", () => {
      console.log("Connection established");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Connection closed:", reason);
    });
  }

  /**
   * Sends a command and prompt to the Socket.IO server and returns the response.
   *
   * @template T - The type of the response message.
   * @param {Commands} cmd - The command to be sent.
   * @param {HumanMessage<K>} prompt - The user prompt to be sent.
   * @returns {Promise<AIMessage<T> | AIErrorException>} - A promise that resolves with the response message or an error.
   * @private
   */
  private async execute<T, K>(
    cmd: Commands,
    prompt: HumanMessage<K>,
  ): Promise<AIMessage<T> | AIErrorException> {
    return new Promise((resolve, reject) => {
      this.socket.emit(
        cmd,
        prompt,
        (response: AIMessage<T> | AIErrorException) => {
          if ("code" in response) {
            reject(response);
          } else {
            resolve(response);
          }
        },
      );

      this.socket.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * Sends a request to the Socket.IO server with the given user prompt and returns the response.
   *
   * @template T - The type of the response message.
   * @param {HumanMessage<K>} payload - The user prompt to be sent to the Socket.IO server.
   * @returns {Promise<AIMessage<T> | AIErrorException>} - A promise that resolves with the response message or an error.
   */
  public async request<T, K = unknown>(
    payload: HumanMessage<K>,
  ): Promise<AIMessage<T> | AIErrorException> {
    return this.execute<T, K>("request", payload);
  }
}
