var botRuntime = require('./botRuntime');
const createHandler = require("azure-function-express").createHandler;

var server = botRuntime.setUpServerEnvironment();

module.exports = createHandler(server);
