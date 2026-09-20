// Production startup file for Namecheap / cPanel Phusion Passenger & custom Node.js servers
process.env.NODE_ENV = "production";

const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error("Error occurred handling", req.url, err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      }
    });

    server.once("error", (err) => {
      console.error("Server startup error:", err);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`> Next.js server ready on ${port}`);
    });
  })
  .catch((err) => {
    console.error("Next.js prepare error:", err);
    process.exit(1);
  });
