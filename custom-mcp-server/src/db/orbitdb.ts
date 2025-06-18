import { createLibp2p } from "libp2p";
import { createHelia } from "helia";
import { createOrbitDB } from "@orbitdb/core";
import { Libp2pOptions } from "./config.js";

// Create an IPFS instance.
const libp2p = await createLibp2p(Libp2pOptions);
const ipfs = await createHelia({ libp2p });

const orbitdb = await createOrbitDB({ ipfs });
const db = await orbitdb.open("my-db");

export const addToOrbitDB = async (data: any) => {
  console.log("my-db address", db.address);
  await db.add(data);
};

export const getFromOrbitDB = async () => {
  return await db.all();
};
