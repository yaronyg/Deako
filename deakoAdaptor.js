var request = require('request');
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

module.exports.deviceCapabilityDiscovery = function () {
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

module.exports.deviceStateDiscovery = function () {
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

module.exports.setDeviceState =function (action, target_uuid, value) {
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

module.exports.setUpAppInfrastructure = function () {
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
      var userUuid = uuid;
      linkAppToUUID(temporaryToken, userUuid, appUuid);
      resolve();
    })
    .catch(function (err) {
      reject(err);
    })
  })
}


