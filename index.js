var nconf = require('nconf');
var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var config = nconf.env().argv().file({file: 'localConfig.json'});
var temporaryToken = require('./temporaryToken.json').temporaryToken;

function createDeakoApplication(temporaryToken) {
  return new Promise(function (resolve, reject) {
    var requestBodyObject = {
      name: 'DeakoMicrosoftHack',
      callback_urls: ['https://localhost:5000/callback']
    }  
    
    var options = {
      uri: 'https://api.deako.com/api/v2s/developer/apps',
      method: 'POST',
      body: JSON.stringify(requestBodyObject),
      headers: {
        Authorization: `Bearer ${temporaryToken}`,
        'content-type': 'application/json'
      }
    };

    request(options, (err, response, body) => {
      console.log(`err: ${err}`);
      console.log(`response: ${response}`);
      console.log(`body: ${body}`);
      if (response.statusCode !== 200) {
        return reject(new Error('Response code error'));
      }
      return resolve(JSON.parse(body).uuid)
    });
  });
}

function getUserProfileUuid(temporaryToken) {
  return new Promise(function (resolve, reject) {
    var options = {
      uri: 'https://api.deako.com/api/v2s/profiles',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${temporaryToken}`
      }
    }

    request(options, (err, response, body) => {
      console.log(`err: ${err}`);
      console.log(`response: ${response}`);
      console.log(`body: ${body}`);
      if (response.statusCode !== 200) {
        return reject(new Error('status code failure!'));
      }
      return resolve(JSON.parse(body)[0].uuid);
    });
  });
}

function linkAppToUUID(temporaryToken, userUuid, appUuid) {
  return new Promise(function (resolve, reject) {
    var requestBodyObject = {
      profile_id: userUuid,
      app_id: appUuid
    }  
    
    var options = {
      uri: 'https://api.deako.com/api/v2s/integration/thirdparty',
      method: 'POST',
      body: JSON.stringify(requestBodyObject),
      headers: {
        Authorization: `Bearer ${temporaryToken}`,
        'content-type': 'application/json'
      }
    };

    request(options, (err, response, body) => {
      console.log(`err: ${err}`);
      console.log(`response: ${response}`);
      console.log(`body: ${body}`);
      if (response.statusCode !== 200) {
        return reject(new Error('Bad status code!'));
      }
      return resolve();
    });
  });
}

function deviceStateDiscovery(temporaryToken, appUuid) {
    return new Promise(function (resolve, reject) {
    var options = {
      uri: `https://api.deako.com/api/v2s/integration/thirdparty/${appUuid}/query`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${temporaryToken}`
      }
    }

    request(options, (err, response, body) => {
      console.log(`err: ${err}`);
      console.log(`response: ${response}`);
      console.log(`body: ${body}`);
      if (response.statusCode !== 200) {
        return reject(new Error('status code failure!'));
      }
      return resolve(JSON.parse(body).loads[0].uuid);
    });
  });
}

var appUuid;
var userUuid; 
createDeakoApplication(temporaryToken)
.then(function (uuid) {
  appUuid = uuid;
  return getUserProfileUuid(temporaryToken);
})
.then(function (uuid) {
  userUuid = uuid;
  return linkAppToUUID(temporaryToken, userUuid, appUuid);
})
.then(function () {
  deviceStateDiscovery(temporaryToken, appUuid);
})
.catch(function (err) {
  throw err;
});

function main() {

    // Setup Restify Server
    var server = restify.createServer();
    server.listen(process.env.port || process.env.PORT || 3978, '0.0.0.0', function () {
      console.log('%s listening to %s', server.name, server.url); 
    });
      
    // Create chat bot
    var connector = new builder.ChatConnector({
      appId: config.get('MICROSOFT_APP_ID'),
      appPassword: config.get('MICROSOFT_APP_PASSWORD')
    });

    var bot = new builder.UniversalBot(connector);
    server.post('/api/messages', connector.listen());

    //=========================================================
    // Bots Dialogs
    //=========================================================

    bot.dialog('/', function (session) {
        session.send("Bork");
    });
}

main();
