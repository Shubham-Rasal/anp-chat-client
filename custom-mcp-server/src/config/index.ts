import dotenv from "dotenv";
import winston from "winston";

// Load environment variables
dotenv.config();

// Configure logger
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export const config = {
  port: process.env.PORT || 3000,
  gunPort: process.env.GUN_PORT || 8765,
  version: process.env.npm_package_version || "0.0.1",
  gunPeers: process.env.GUN_PEERS ? process.env.GUN_PEERS.split(",") : [],
  defaultPeers: [
    "http://gun-matrix.herokuapp.com/gun",
    "https://gun-us.herokuapp.com/gun",
    "https://gun-eu.herokuapp.com/gun",
  ],
};
