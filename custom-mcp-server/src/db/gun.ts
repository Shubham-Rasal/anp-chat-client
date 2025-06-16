import Gun from "gun";
import { config } from "../config/index.js";

// Initialize GUN as a client connecting to our local GUN server
const gunServerUrl = `http://localhost:${config.gunPort || 8765}/gun`;
export const gun = Gun(gunServerUrl);

// Export the gun instance for use in other parts of the application
export default gun;
