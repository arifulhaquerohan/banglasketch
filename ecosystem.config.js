// PM2 Process Manager Configuration for Bangla Sketch Production Deployment
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup

module.exports = {
  apps: [
    {
      name: "banglasketch-backend",
      cwd: "./backend",
      script: "server.js",
      instances: Number(process.env.BACKEND_INSTANCES || 1),
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
    {
      name: "banglasketch-frontend",
      cwd: "./frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        TRUST_INGRESS_IP: "true",
      },
    },
  ],
};
