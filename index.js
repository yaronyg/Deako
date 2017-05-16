var nconf = require('nconf');
var request = require('request');
var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var config = nconf.env().argv().file({file: 'localConfig.json'});
var temporaryTokenFileLocation = './temporaryToken.json';
var temporaryTokenFile = require(temporaryTokenFileLocation);
var temporaryToken = temporaryTokenFile.temporaryToken;
var appUuid = temporaryTokenFile.appUuid;
var jsonFile = require('jsonFile');

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

function deviceCapabilityDiscovery(temporaryToken, appUuid) {
  return new Promise(function (resolve, reject) {
    var options = {
      uri: `https://api.deako.com/api/v2s/integration/thirdparty/${appUuid}/discover`,
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
      return resolve(JSON.parse(body));
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
      return resolve(JSON.parse(body));
    });
  });
}

function setDeviceState(temporaryToken, appUuid, action, target_uuid, value) {
  return new Promise(function (resolve, reject) {
    var requestBodyObject = {
      action: action,
      target_uuid: target_uuid
    }  
    if (value) {
      requestBodyObject.value = value;
    }
    
    var options = {
      uri: `https://api.deako.com/api/v2s/integration/thirdparty/${appUuid}/action`,
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

function setUpAppInfrastructure(temporaryToken) {
  return new Promise(function (resolve, reject) {
    if (appUuid) {
      return resolve();
    }
    createDeakoApplication(temporaryToken)
    .then(function (uuid) {
      appUuid = uuid;
      temporaryTokenFile.appUuid = appUuid;
      jsonFile.writeFileSync(temporaryTokenFileLocation, temporaryTokenFile);
      return getUserProfileUuid(temporaryToken);
    })
    .then(function (uuid) {
      userUuid = uuid;
      linkAppToUUID(temporaryToken, userUuid, appUuid);
      resolve();
    })
    .catch(function (err) {
      reject(err);
    })
  })
}


var userUuid; 

setUpAppInfrastructure(temporaryToken)
.then(function () {
  return deviceCapabilityDiscovery(temporaryToken, appUuid);
})
.then(function (deviceCapabilities) {
  return deviceStateDiscovery(temporaryToken, appUuid);
})
.then(function (deviceState) {
  var deviceUUID = deviceState.loads[0].uuid;
  return setDeviceState(temporaryToken, appUuid, 'off', deviceUUID);
})
.catch(function (err) {
  throw err;
});

function _askLUIS(appId, subKey, q) {
    var uri = `https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/${appId}?subscription-key=${subKey}&verbose=true&q=${q}`;

    return new Promise((resolve, reject) => {
        var options = {
            uri: uri,
            method: 'GET'
        };
        request(options, (err, response, body) => {
            resolve(JSON.parse(body));
        })
    })
}

function askLUIS(q) {
    return _askLUIS(config.get("LUIS_APP_ID"), config.get("LUIS_SUBSCRIPTION_KEY"), q);
}

function turnOn(session, switchName) {
}

function turnOff(session, switchName) {
}

function queryState(session) {
}

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
        askLUIS(session.message.text)
        .then((response) => {
            switch (response.topScoringIntent.intent) {
                case "turnOn" : {
                    if (response.entities.length > 0) {
                        turnOn(session, response.entities[0].entity);
                    }
                    else {
                        turnOn(session);
                    }
                }
                break;

                case "turnOff" : {
                    if (response.entities.length > 0) {
                        turnOff(session, response.entities[0].entity);
                    }
                    else {
                        turnOff(session);
                    }
                }
                break;

                default : {
                    session.send("Come again?");
                }
            }
        });
    });
}

main();
