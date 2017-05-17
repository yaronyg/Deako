var nconf = require('nconf');
var request = require('request');
var restify = require('restify');
var builder = require('botbuilder');
var config = nconf.env().argv().file({file: 'localConfig.json'});
var deakoAdaptor = require('./deakoAdaptor');

deakoAdaptor.setUpAppInfrastructure()
.then(function () {
  return deakoAdaptor.deviceCapabilityDiscovery();
})
.then(function (deviceCapabilities) {
  return deakoAdaptor.deviceStateDiscovery();
})
.then(function (deviceState) {
  var deviceUUID = deviceState.loads[0].uuid;
  return deakoAdaptor.setDeviceState('off', deviceUUID);
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
