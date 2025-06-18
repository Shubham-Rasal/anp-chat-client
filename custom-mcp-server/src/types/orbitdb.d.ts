declare module '@orbitdb/core' {
    import type { OrbitDB, DocumentStore } from '@orbitdb/core-types'
  export interface OrbitDBInstance {
    open(name: string): Promise<any>;
    stop(): Promise<void>;
  }

  export interface OrbitDBOptions {
    ipfs: any;
  }

  export function createOrbitDB(options: OrbitDBOptions): Promise<OrbitDBInstance>;
}

declare module 'helia' {
  export function createHelia(options: { libp2p: any }): Promise<any>;
}

declare module 'libp2p' {
  export function createLibp2p(options: any): Promise<any>;
} 