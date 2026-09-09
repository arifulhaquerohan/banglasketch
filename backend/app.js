// Universal cPanel Phusion Passenger Startup Wrapper
// This guarantees Node.js finds server.js regardless of working directory quirks
const path = require('path');
process.chdir(__dirname);
require('./server.js');
