// Local HTTP development: npx pm2 startOrRestart ecosystem.local.config.js --update-env
// Production HTTPS deployment uses ecosystem.config.js.
const path = require("node:path");
const production = require("./ecosystem.config.js");

module.exports = {
  apps: production.apps
    .filter((app) => ["banglasketch-backend", "banglasketch-frontend"].includes(app.name))
    .map((app) => {
      const frontend = app.name === "banglasketch-frontend";
      return {
        ...app,
        cwd: path.resolve(__dirname, frontend ? "frontend" : "django_backend"),
        ...(frontend ? { args: "dev -H 127.0.0.1 -p 3000" } : {}),
        env: {
          ...app.env,
          NODE_ENV: "development",
          ...(frontend
            ? { API_URL: "http://127.0.0.1:5000", TRUST_INGRESS_IP: "false" }
            : { DJANGO_SETTINGS_MODULE: "config.settings.development" }),
        },
      };
    }),
};
