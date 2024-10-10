import { io, Socket } from "socket.io-client";

/**
 * Represents the configuration settings necessary to initialize and authenticate with the MindneySDK.
 *
 * Configuration object for MindneySDK.
 */
export interface MindneyConfig {
  readonly clientId: string;
  readonly apiKey: string;
  readonly secretToken: string;
  readonly endpoint?: string;
}

/**
 * Represents a message from an AI system.
 *
 * This interface defines the structure of a message that is used to communicate between
 * the AI system and clients. It encapsulates an operation type and associated data.
 *
 * @template T - The type of the data contained in the message. This allows the message
 * to be strongly typed and ensures that the data adheres to a specific structure.
 */
export interface AIMessage<T> {
  /**
   * The type of operation that the AI is performing or has performed. This is a string
   * identifier that can be used to determine the appropriate response or handling procedure.
   */
  readonly operation: string;

  /**
   * The data associated with the operation. This is generic, allowing for flexibility in
   * the type of data that can be transmitted, depending on the operation.
   */
  readonly data: T;
}

/**
 * Interface representing a human message.
 *
 * @template T - The type of the data contained in the message.
 */
export interface HumanMessage<T> {
  readonly prompt: string;
  readonly context: T;
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
  private readonly socket: Socket;

  private readonly endpoint: string;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly secretToken: string;

  /**
   * Creates an instance of MindneySDK.
   *
   * @param {MindneyConfig} config - The configuration object containing clientId, apiKey, and secretToken.
   */
  constructor(config: MindneyConfig) {
    this.endpoint = config.endpoint ?? "https://ai.mindney.com";
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
    message: HumanMessage<K>,
  ): Promise<AIMessage<T> | AIErrorException> {
    return new Promise((resolve, reject) => {
      this.socket.emit(
        cmd,
        message,
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
