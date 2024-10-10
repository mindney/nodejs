import { io, Socket } from "socket.io-client";
import { logger } from "./logger";

/**
 * Represents the configuration settings necessary to initialize and authenticate with the MindneySDK.
 *
 * Configuration object for MindneySDK.
 */
export interface MindneyConfig {
  readonly clientId: string;
  readonly apiKey: string;
  readonly secretToken: string;
  readonly debug?: boolean;
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
  readonly body?: T;
}

/**
 * Interface representing an AI error exception.
 */
export interface AIErrorException {
  readonly code: number;
  readonly message: string;
}

/**
 * Class representing the MindneySDK.
 */
export class MindneySDK {
  private readonly socket: Socket;

  private readonly debug: boolean = false;
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
   * Logs a message with a specified log type if debugging is enabled.
   *
   * This method checks if debugging is enabled (`this.debug`). If not, it returns immediately without logging.
   * If debugging is enabled, it logs the message using the appropriate log level based on the `type` parameter.
   *
   * @param {string} text - The message text to log.
   * @param {"error" | "info" | "warning"} type - The type of log message. Defaults to "info".
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
   * Initializes the Socket.IO connection and sets up event handlers for various Socket.IO events.
   *
   * @private
   */
  private initializeSocket(): void {
    this.socket.on("connect", () => {
      this.log("info", "Successfully connected to Sidney.");
    });

    this.socket.on("connect_error", (error) => {
      this.log(
        "error",
        "An error occurred while establishing a connection with Sidney.",
      );
      this.log("error", JSON.stringify(error));
    });

    this.socket.on("disconnect", (reason) => {
      this.log("info", `Disconnected from Sidney, reason: ${reason}`);
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
        this.log("error", "An error occurred while performing an prompt");
        this.log("error", JSON.stringify(error));
        reject(error);
      });
    });
  }
}
