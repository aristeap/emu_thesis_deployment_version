// testGridFS.js
const { MongoClient, GridFSBucket } = require('mongodb');

const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'metadata_db';

async function testGridFSBucket() {
  try {
    console.log("Connecting to MongoDB at", mongoUrl);
    const client = await MongoClient.connect(mongoUrl, { useUnifiedTopology: true });
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log("Connected to MongoDB and GridFSBucket 'uploads' is initialized.");
    client.close();
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

testGridFSBucket();
