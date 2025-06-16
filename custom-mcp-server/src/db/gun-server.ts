import Gun from "gun";
import express from "express";
import { config, logger } from "../config/index.js";

// Initialize Express app specifically for GUN
const gunApp = express();
gunApp.use((Gun as any).serve);

// Initialize peer list
const peerList = new Set<string>([...config.defaultPeers, ...config.gunPeers]);

// Create GUN server
const gunServer = gunApp.listen(config.gunPort || 8765, () => {
  logger.info(`GUN server listening on port ${config.gunPort || 8765}`);
});

// Initialize GUN with peer discovery
export const gun = Gun({
  web: gunServer,
  file: "data",
  peers: Array.from(peerList),
  radisk: true,
  localStorage: false,
});

// Enhanced peer connection logging
gun.on("hi", (peer) => {
  const peerUrl = peer?.url || "unknown";
  logger.info(`Peer connected: ${peerUrl}`);
});

gun.on("bye", (peer) => {
  const peerUrl = peer?.url || "unknown";
  logger.info(`Peer disconnected: ${peerUrl}`);
});

// Export peer management functions
export const getPeers = () => ({
  connected: Object.keys((gun as any)._.opt.peers || {}),
  known: Array.from(peerList),
});

export const addPeer = (peer: string) => {
  peerList.add(peer);
  gun.opt({ peers: Array.from(peerList) });
  return Array.from(peerList);
};
