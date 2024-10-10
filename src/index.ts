import { io, Socket } from "socket.io-client";
import { logger } from "./logger";

/**
 * Configuration settings for initializing and authenticating with the MindneySDK.
 */
export interface MindneyConfig {
  readonly clientId: string;
  readonly apiKey: string;
  readonly secretToken: string;
  readonly debug?: boolean;
}

/**
 * Defines a message structure for communication between an AI system and clients.
 * @template T - The type of the data contained in the message.
 */
export interface AIMessage<T> {
  readonly action: string; // Identifies the operation performed by the AI.
  readonly message: string; // Descriptive message about the operation.
  readonly data: T; // Data related to the operation, allowing for flexible data types.
}

/**
 * Represents a message from a human user.
 * @template T - The type of the data contained in the message.
 */
export interface HumanMessage<T> {
  readonly prompt: string;
  readonly body?: T;
}

/**
 * Represents an error from the AI system.
 */
export interface AIErrorException {
  readonly code: number;
  readonly message: string;
}

/**
 * Manages interactions with the MindneySDK.
 */
export class MindneySDK {
  private readonly socket: Socket;
  private readonly debug: boolean = false;
  private readonly endpoint: string;
  private readonly clientId: string;
  private readonly apiKey: string;
  private readonly secretToken: string;

  /**
   * Initializes a new instance of the MindneySDK with specified configuration.
   * @param {MindneyConfig} config - Configuration including clientId, apiKey, and secretToken.
   */
  constructor(config: MindneyConfig) {
    this.debug = config.debug ?? false;
    this.endpoint = "https://ai.mindney.com";
    this.clientId = config.clientId;
    this.apiKey = config.apiKey;
    this.secretToken = config.secretToken;

    this.validateCredentials();
    this.socket = io(this.endpoint, {
      transportOptions: {
        polling: {
          extraHeaders: {
            "client-id": this.clientId,
            "api-key": this.apiKey,
            "secret-token": this.secretToken,
          },
        },
      },
    });
    this.initializeSocket();
  }

  /**
   * Ensures all required credentials are present.
   * @throws {Error} If any credentials are missing.
   */
  private validateCredentials(): void {
    if (!this.clientId || !this.apiKey || !this.secretToken) {
      throw new Error("Client ID, API key, and secret token are required");
    }
  }

  /**
   * Logs messages based on the debug setting and log type.
   * @param {string} text - The message text to log.
   * @param {"error" | "info" | "warning"} type - The type of log message.
   */
  private log(type: "error" | "info" | "warning", text: string): void {
    if (!this.debug) return;

    const logActions = {
      error: () => logger.error(text),
      info: () => logger.info(text),
      warning: () => logger.warn(text),
    };

    logActions[type]();
  }

  /**
   * Sets up the Socket.IO connection and event handlers.
   */
  private initializeSocket(): void {
    this.socket.on("connect", () => {
      this.log("info", "Successfully connected to Sidney.");
    });

    this.socket.on("connect_error", (error) => {
      this.log("error", "Connection error with Sidney.");
      this.log("error", JSON.stringify(error));
    });

    this.socket.on("disconnect", (reason) => {
      this.log("info", `Disconnected from Sidney, reason: ${reason}`);
    });
  }

  /**
   * Sends a user prompt to the server and handles the response.
   * @template T - The type of the response message.
   * @param {HumanMessage<K>} payload - The user prompt.
   * @returns {Promise<AIMessage<T> | AIErrorException>} The server response.
   */
  public async request<T, K = unknown>(
    payload: HumanMessage<K>,
  ): Promise<AIMessage<T> | AIErrorException> {
    return new Promise((resolve, reject) => {
      this.log(
        "info",
        `Executing prompt: "${payload.prompt}" | Context: ${JSON.stringify(payload.body)}`,
      );
      this.socket.emit(
        "request",
        payload,
        (response: AIMessage<T> | AIErrorException) => {
          if ("code" in response) {
            reject(response);
          } else {
            resolve(response);
          }
        },
      );

      this.socket.on("error", (error) => {
        this.log("error", "An error occurred during the prompt execution.");
        this.log("error", JSON.stringify(error));
        reject(error);
      });
    });
  }
}
