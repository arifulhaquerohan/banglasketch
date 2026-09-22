// Universal cPanel Phusion Passenger Startup Wrapper
// This guarantees Node.js finds server.js regardless of working directory quirks
process.chdir(__dirname);
require('./server.js');
