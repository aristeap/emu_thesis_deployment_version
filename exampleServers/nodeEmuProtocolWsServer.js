/**
 * small demo node server that implements the EMU-webApp-websocket-protocol
 *
 * NOTE: on save no actions are performed (functions are just stubs)
 *
 * to run:
 *  > node nodeEmuProtocolWsServer.js
 *
 * author: Raphael Winkelmann
 */

'use strict';


// load deps
const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');
const http = require('http');
const filewalker = require('filewalker');
const url = require('url');

const { MongoClient, ObjectId, GridFSBucket } = require('mongodb');

const mongoUrl = 'mongodb://127.0.0.1:27017';  // Adjust if necessary
const dbName = 'metadata_db';                  // Use the appropriate database name

let bucket;  // This will hold your GridFSBucket instance
MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, client) => {
  console.log("inside the MongoClient.connect()");
  if (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
  const db = client.db(dbName);
  bucket = new GridFSBucket(db, { bucketName: 'uploads' });
  console.log("Connected to MongoDB, GridFSBucket 'uploads' initialized----------------------------.");
});

// allow users to set vars from command line
var host = 'localhost';
if (process.argv.length === 2) {

  var portNr = 17890;
  // var pathToDbRoot = '/Users/raphaelwinkelmann/Desktop/gersC/';
  // var configName = 'gersC_DBconfig.json';
  var pathToDbRoot = '../src/testData/newFormat/ae/';
  var configName = 'ae_DBconfig.json';
  console.log(' usage: node nodeEmuProtocolServer.js [port] [path] [config]');
  console.log(' where:');
  console.log('    [port]: The port number to listen on (optional, default: 17890)');
  console.log('    [path]: The path to the directory where the config is stored (optional, default: ../app/testData/newFormat/ae/)');
  console.log('    [config]: The name of the configuration file (optional, default: ae_DBconfig.json)');
  console.log(' example:');
  console.log('    node nodeEmuProtocolServer.js 1025 /path/to/db/ myDB_DBconfig.json');
  console.log(' ');

} else if (process.argv.length === 3) {
  var portNr = process.argv[2];
  var pathToDbRoot = '../src/testData/newFormat/ae/';
  var configName = 'ae_DBconfig.json';

} else if (process.argv.length === 5) {

  var portNr = process.argv[2];
  var pathToDbRoot = process.argv[3];
  var configName = process.argv[4];

}



var dbConfig = {};
var ssffFilesMap = {};

// demo of user management
var doUserManagement = 'NO';
var userName = 'user1';
var userPwd = '1234'; // high security plain text password! This is for demo purposes only! Please store your passwords properly...

// create ws server
const wss = new WebSocket.Server({
  noServer: true
});

const server = http.createServer(function (request, response) {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('This server is only used for WebSocket upgrades.');
});


server.on('upgrade', function upgrade(request, socket, head) {
  console.log('in upgrade function');
  wss.handleUpgrade(request, socket, head, function done(ws) {
    console.log('deligated update to wss');
    wss.emit('connection', ws, request);
  });
})

server.listen(portNr)

console.log("before the local server now running");  
console.log('########################################################');
console.log('local server now running @: ws://' + host + ':' + portNr);
console.log('########################################################');

wss.on('connection', function (ws) {

  console.log('INFO: client connected');

  ws.on('message', function (message) {


    // console.log('received: %s', message);
    var mJSO = JSON.parse(message);
    console.log("mJSO.type: ",mJSO.type);

    switch (mJSO.type) {
      // GETPROTOCOL method
    case 'GETPROTOCOL':
      ws.send(JSON.stringify({
        'callbackID': mJSO.callbackID,
        'data': {
          'protocol': 'EMU-webApp-websocket-protocol',
          'version': '0.0.2'
        },
        'status': {
          'type': 'SUCCESS',
          'message': ''
        }
      }), undefined, 0);
      break;

      // GETDOUSERMANAGEMENT method
    case 'GETDOUSERMANAGEMENT':
      ws.send(JSON.stringify({
        'callbackID': mJSO.callbackID,
        'data': doUserManagement,
        'status': {
          'type': 'SUCCESS',
          'message': ''
        }
      }), undefined, 0);
      break;

      // LOGONUSER method
    case 'LOGONUSER':

      if (mJSO.userName !== userName) {
        // handle wrong user name
        ws.send(JSON.stringify({
          'callbackID': mJSO.callbackID,
          'data': 'BADUSERNAME',
          'status': {
            'type': 'SUCCESS',
            'message': ''
          }
        }), undefined, 0);
      } else if (mJSO.pwd !== userPwd) {
        // handle wrong password
        ws.send(JSON.stringify({
          'callbackID': mJSO.callbackID,
          'data': 'BADPASSWORD',
          'status': {
            'type': 'SUCCESS',
            'message': ''
          }
        }), undefined, 0);
      } else {
        ws.send(JSON.stringify({
          'callbackID': mJSO.callbackID,
          'data': 'LOGGEDON',
          'status': {
            'type': 'SUCCESS',
            'message': ''
          }
        }), undefined, 0);
      }


      break;

      // GETGLOBALDBCONFIG method
    case 'GETGLOBALDBCONFIG':
      console.log('############## GETGLOBALDBCONFIG ####################')
      fs.readFile(pathToDbRoot + configName, 'utf8', function (err, data) {
        if (err) {
          console.log('Error: ' + err);
          ws.send(JSON.stringify({
            'callbackID': mJSO.callbackID,
            'status': {
              'type': 'ERROR',
              'message': err
            }
          }), undefined, 0);
          return;
        } else {
          dbConfig = JSON.parse(data);

          // figure out which SSFF files should be sent with each bundle 
          // (could further reduce the files being sent by looking at the perspectives)
          for (var i = 0; i < dbConfig.ssffTrackDefinitions.length; i++) {
            if (ssffFilesMap[dbConfig.ssffTrackDefinitions[i].fileExtension] !== undefined) {
              ssffFilesMap[dbConfig.ssffTrackDefinitions[i].fileExtension] += 1;
            } else {
              ssffFilesMap[dbConfig.ssffTrackDefinitions[i].fileExtension] = 1;
            }
          }
          console.log(ssffFilesMap);

          // curUttList = dbConfig;
          // curStrippedUttList = stripUttList(dbConfig);

          ws.send(JSON.stringify({
            'callbackID': mJSO.callbackID,
            'data': dbConfig,
            'status': {
              'type': 'SUCCESS',
              'message': ''
            }
          }), undefined, 0);
          // ws.send(labelData);
        }
      });
      break;

      // GETBUNDLELIST method
      // file walks through DB to get all the bundles
    case 'GETBUNDLELIST':
      console.log('############## GETBUNDLELIST ####################')
      var bundleList = [];
      filewalker(pathToDbRoot)
        .on('dir', function (p) {

          var patt = new RegExp('^.+_ses+/.+_bndl$');
          // var patt = new RegExp('^SES[^/]+/[^/]+$');

          if (patt.test(p)) {
            var arr = p.split('/');
            var nArr = arr[arr.length - 1].split('_');
            var sArr = arr[0].split('_');
            sArr.pop();
            nArr.pop();
            bundleList.push({
              'name': nArr.join('_'),
              'session': sArr.join('_')
              // 'timeAnchors': [{sample_start: 100, sample_end: 500}, {sample_start: 5000, sample_end: 5500}]
            });
          }
        }).on('error', function (err) {
          ws.send(JSON.stringify({
            'callbackID': mJSO.callbackID,
            'status': {
              'type': 'ERROR',
              'message': 'Error creating bundleList! Request type was: ' + mJSO.type + ' Error is: ' + err
            }
          }), undefined, 0);
        }).on('done', function () {
          ws.send(JSON.stringify({
            'callbackID': mJSO.callbackID,
            'data': bundleList,
            'status': {
              'type': 'SUCCESS',
              'message': ''
            }
          }), undefined, 0);
        }).walk();
      break;

      // GETBUNDLE method
      //Auto einai pou ginetai executed!
      case 'GETBUNDLE':
        console.log("Received GETBUNDLE for:", mJSO.name);
        
        // Check if gridFSRef is provided in the request
        if (!mJSO.gridFSRef) {
          ws.send(JSON.stringify({
            'callbackID': mJSO.callbackID,
            'status': { 'type': 'ERROR', 'message': 'Missing gridFSRef in request' }
          }));
          break;
        }
        
        try {
          // Use the GridFSBucket to open a download stream.
          let downloadStream = bucket.openDownloadStream(new ObjectId(mJSO.gridFSRef));
          let chunks = [];
          downloadStream.on('data', (chunk) => {
            chunks.push(chunk);
          });
          downloadStream.on('end', () => {
            let buffer = Buffer.concat(chunks);
            let base64Data = buffer.toString('base64');
            
            // Build the bundle object to return. 
            // We’re assuming that for now we don’t need an annotation (or it can be empty)
            let bundle = {
              mediaFile: {
                encoding: 'BASE64',
                data: base64Data,
                type: mJSO.fileType || 'audio'
              },
              annotation: { levels: [], links: [] },
              ssffFiles: [] // If not used, leave empty
            };
            console.log("Returning bundle from GridFS:", bundle);
            ws.send(JSON.stringify({
              'callbackID': mJSO.callbackID,
              'data': bundle,
              'status': { 'type': 'SUCCESS', 'message': '' }
            }), undefined, 0);
          });
          downloadStream.on('error', (err) => {
            console.error("Error reading file from GridFS:", err);
            ws.send(JSON.stringify({
              'callbackID': mJSO.callbackID,
              'status': { 'type': 'ERROR', 'message': 'Error reading file from GridFS: ' + err }
            }), undefined, 0);
          });
        } catch (e) {
          console.error("Exception in GETBUNDLE:", e);
          ws.send(JSON.stringify({
            'callbackID': mJSO.callbackID,
            'status': { 'type': 'ERROR', 'message': 'Exception: ' + e }
          }), undefined, 0);
        }
        break;
      
      // SAVEBUNDLE method
    case 'SAVEBUNDLE':
      console.log('### Pretending to save bundle:');
      console.log('\tname:', mJSO.data.annotation.name);
      console.log('\tsession:', mJSO.data.session);
      console.log('\tssffFiles:', mJSO.data.ssffFiles);
      // console.log(mJSO.data.annotation);
      ws.send(JSON.stringify({
        'callbackID': mJSO.callbackID,
        'status': {
          'type': 'SUCCESS',
          'message': 'Pst... I did not really do anything. Please do not tell anyone...'
        }
      }), undefined, 0);
      break;

      // SAVEDBCONFIG method
    case 'SAVEDBCONFIG':
      console.log('### Pretending to save the following configuration:');
      fs.readFile(pathToDbRoot + configName, 'utf8', function (err, data) {
        if (err) {
      		ws.send(JSON.stringify({
      			'callbackID': mJSO.callbackID,
      			'status': {
      				'type': 'ERROR',
      				'message': 'Error reading configuration file.'
      			}
      		}), undefined, 0);
        }
        else {
        	var config = JSON.parse(data);
        	config.EMUwebAppConfig = JSON.parse(mJSO.data);
        	fs.writeFile(pathToDbRoot + configName, JSON.stringify(config, undefined, 4), function(err) {
        		if(err) {
        			return console.log(err);
        		} else {
        			console.log("The configuration was saved!");
        			ws.send(JSON.stringify({
        				'callbackID': mJSO.callbackID,
        				'status': {
        					'type': 'SUCCESS',
        					'message': 'Configuration successfully saved.'
        				}
        			}), undefined, 0);
        		}
        	});
        }
      });      
      break;
      
      // DISCONNECTING method
    case 'DISCONNECTWARNING':
      console.log('preparing to disconnect...');
      // console.log(mJSO.data.annotation);
      ws.send(JSON.stringify({
        'callbackID': mJSO.callbackID,
        'status': {
          'type': 'SUCCESS',
          'message': ''
        }
      }), undefined, 0);
      break;
      
    default:
      ws.send(JSON.stringify({
        'callbackID': mJSO.callbackID,
        'status': {
          'type': 'ERROR',
          'message': 'Sent request type that is unknown to server! Request type was: ' + mJSO.type
        }
      }), undefined, 0);
    }

  });

  // display that client has disconnected
  ws.on('close', function () {
    console.log('INFO: client disconnected');
  });
});

/**
 *
 */
function sendBundle(ws, bundle) {
  console.log(bundle);
}