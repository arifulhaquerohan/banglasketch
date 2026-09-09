// Production startup file for cPanel Phusion Passenger & custom Node.js servers
const { createServer } = require("http");
const next = require("next");

const dev = process.env.NODE_ENV === "development";
// In cPanel Passenger, PORT can be a port number or a socket path
const port = process.env.PORT
  ? isNaN(Number(process.env.PORT))
    ? process.env.PORT
    : parseInt(process.env.PORT, 10)
  : 3000;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Next.js production server ready on ${port}`);
    });
});

