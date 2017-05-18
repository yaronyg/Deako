const botRuntime = require('./botRuntime');
const createAzureFunctionHandler = require("azure-function-express").createAzureFunctionHandler;
const deakoAdaptor = require("./deakoAdaptor");

const server = botRuntime.setUpServerEnvironment();

server.get("/api/", (req, res) => {
  req.context.log("I am in api!");
  res.json({ im: "here"});
});
server.get("/api/deviceState", (req, res) => {
  req.context.log("In deviceState call");
  deakoAdaptor.deviceStateDiscovery(req.context)
  .then(response => {
    req.context.log("response is " + response);
    res.json(response);
  })
  .catch(error => {
    req.context.log(`error is ${error}`)
    res.json({ error: error});
  });
  req.context.log("Fell off the end as expected");
});
server.get("/api/deviceDesc", (req, res) => { 
  deakoAdaptor.deviceCapabilityDiscovery()
  .then(response => {
    res.json(response);
  })
  .catch(error => {
    req.context.log(`error is ${error}`);
    res.json({ error: error})
  });
});

module.exports = createAzureFunctionHandler(server);

