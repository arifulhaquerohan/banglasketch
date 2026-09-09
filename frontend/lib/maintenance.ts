import fs from "fs";
import path from "path";
import { MaintenanceConfig, DEFAULT_MAINTENANCE_CONFIG } from "./maintenance.types";

export * from "./maintenance.types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "maintenance.json");

export function getMaintenanceConfigSync(): MaintenanceConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_MAINTENANCE_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error("Error reading maintenance config:", err);
  }
  return DEFAULT_MAINTENANCE_CONFIG;
}

export function saveMaintenanceConfigSync(config: Partial<MaintenanceConfig>): MaintenanceConfig {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const current = getMaintenanceConfigSync();
    const updated: MaintenanceConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("Error saving maintenance config:", err);
    throw err;
  }
}
