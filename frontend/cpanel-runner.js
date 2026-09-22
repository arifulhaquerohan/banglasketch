// Universal cPanel / Namecheap Phusion Passenger Startup Wrapper
process.env.NODE_ENV = "production";

process.chdir(__dirname);

// Delegate to production server
require("./server.js");
