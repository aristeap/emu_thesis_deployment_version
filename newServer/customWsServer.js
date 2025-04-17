/**
 * customWsServer.js
 * A simple WebSocket server to fetch files (wav, pdf, img, video) from MongoDB's GridFS.
 */

'use strict';

// Load dependencies
const http = require('http');
const WebSocket = require('ws');
const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');
const url = require('url');

// MongoDB connection settings
const mongoUrl = 'mongodb://127.0.0.1:27017'; // adjust if needed
const dbName = 'metadata_db';                 // use your actual database name

// Global variable to hold the GridFSBucket instance
let bucket;

// Host and port for the WebSocket server
const host = 'localhost';
const port = 17890;

// Create a minimal HTTP server (used only for WebSocket upgrades)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('This server is only used for WebSocket upgrades.');
});

// Create a WebSocket server with noServer: true
const wss = new WebSocket.Server({ noServer: true });

// Handle HTTP upgrade requests to WebSocket
server.on('upgrade', (request, socket, head) => {
  console.log("Upgrade request received");
  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log("WebSocket connection established");
    wss.emit('connection', ws, request);
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log("Client connected via WebSocket");

  ws.on('message', (message) => {
    console.log("Received message:", message);
    let mJSO;
    try {
      mJSO = JSON.parse(message);
    } catch (e) {
      ws.send(JSON.stringify({
        callbackID: "",
        status: { type: 'ERROR', message: 'Invalid JSON' }
      }));
      return;
    }
    
    // Handle GETBUNDLE request
    if (mJSO.type === 'GETBUNDLE') {
      console.log("Processing GETBUNDLE for file:", mJSO.name);
      
      // Ensure gridFSRef is provided
      if (!mJSO.gridFSRef) {
        ws.send(JSON.stringify({
          callbackID: mJSO.callbackID,
          status: { type: 'ERROR', message: 'Missing gridFSRef in request' }
        }));
        return;
      }
      
      // Ensure our bucket is initialized
      if (!bucket) {
        ws.send(JSON.stringify({
          callbackID: mJSO.callbackID,
          status: { type: 'ERROR', message: 'GridFSBucket not initialized' }
        }));
        return;
      }
      
      try {
        // Open a download stream from GridFS using the provided gridFSRef
        let downloadStream = bucket.openDownloadStream(new ObjectId(mJSO.gridFSRef));
        let chunks = [];
        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        downloadStream.on('end', () => {
          let buffer = Buffer.concat(chunks);
          let base64Data = buffer.toString('base64');
          
          // Build the bundle object to return
          let bundle = {
            mediaFile: {
              encoding: 'BASE64',
              data: base64Data,
              type: mJSO.fileType || 'audio'
            },
            // For this example, we return an empty annotation and no SSFF files.
            annotation: { levels: [], links: [] },
            ssffFiles: []
          };
          console.log("Returning bundle from GridFS:", bundle);
          ws.send(JSON.stringify({
            callbackID: mJSO.callbackID,
            data: bundle,
            status: { type: 'SUCCESS', message: '' }
          }));
        });
        downloadStream.on('error', (err) => {
          console.error("Error reading file from GridFS:", err);
          ws.send(JSON.stringify({
            callbackID: mJSO.callbackID,
            status: { type: 'ERROR', message: 'Error reading file from GridFS: ' + err }
          }));
        });
      } catch (e) {
        console.error("Exception in GETBUNDLE:", e);
        ws.send(JSON.stringify({
          callbackID: mJSO.callbackID,
          status: { type: 'ERROR', message: 'Exception: ' + e }
        }));
      }
    } else {
      // For any unknown request type, send an error response
      ws.send(JSON.stringify({
        callbackID: mJSO.callbackID || "",
        status: { type: 'ERROR', message: 'Unknown request type: ' + mJSO.type }
      }));
    }
  });
  
  ws.on('close', () => {
    console.log("Client disconnected");
  });
});

// Async function to connect to MongoDB and start the server
async function startServer() {
  try {
    console.log("Connecting to MongoDB at", mongoUrl);
    const client = await MongoClient.connect(mongoUrl, { useUnifiedTopology: true });
    const db = client.db(dbName);
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log("Connected to MongoDB and GridFSBucket 'uploads' is initialized.");
    
    // Start the HTTP/WebSocket server only after the connection is ready.
    server.listen(port, () => {
      console.log(`WebSocket server is running on ws://${host}:${port}`);
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
}

// Start the server
startServer();
