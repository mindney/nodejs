# MindneyJS SDK

Welcome to the official NodeJS SDK for Mindney, a platform designed to enhance your development experience with a suite of powerful tools and services.

## Features

- **Easy Integration**: Quickly integrate with Mindney services using this SDK.
- **Socket.IO Support**: Real-time communication with the Mindney platform through Socket.IO.
- **Error Handling**: Robust error handling to ensure your application runs smoothly.

## Installation

To install the MindneyJS SDK, navigate to your project directory and execute one of the following commands:

Add Dependencies:
``npm install --save mindneyjs``
or
``yarn add mindneyjs``

## Getting Started

To get started with the MindneyJS SDK, follow these steps:

1. **Initialize the SDK**: Import and configure the SDK in your NodeJS application. You need to provide configuration details such as `clientId`, `apiKey`, and `secretToken`.

   ```javascript
   import { MindneySDK, MindneyConfig } from 'mindneyjs';

   // Configuration for the SDK
   const config = {
     clientId: 'your-client-id',
     apiKey: 'your-api-key',
     secretToken: 'your-secret-token'
   };

   // Initialize the SDK
   const sdk = new MindneySDK(config);
   ```

2. **Connect to the Platform**: The SDK automatically handles the connection to the Mindney platform upon initialization. Listen for connection events to confirm the connection status.

   ```javascript
   sdk.socket.on('connect', () => {
     console.log('Successfully connected to Mindney platform!');
   });

   sdk.socket.on('connect_error', (error) => {
     console.error('Connection failed:', error);
   });
   ```

3. **Send Requests**: Use the SDK to send requests and receive responses from the platform. Ensure to handle both successful responses and errors.

   ```javascript
   const requestData = { prompt: 'Hello, Mindney!', data: {} };
   sdk.request(requestData).then(response => {
     console.log('Response from Mindney:', response);
   }).catch(error => {
     console.error('Request failed:', error);
   });
   ```

For more detailed examples and API documentation, refer to the [MindneyJS SDK Documentation](https://github.com/mindney/nodejs#readme).
