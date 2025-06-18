import type { OrbitDBInstance } from "@orbitdb/core";
import type { Entity, Relation } from "../types/graph.js";
import { validateEntity, validateRelation } from "../types/schema.js";

type DocumentStore = Awaited<ReturnType<OrbitDBInstance["open"]>>;

export class GraphDB {
  private entityStore: DocumentStore;
  private relationStore: DocumentStore;

  constructor(entityStore: DocumentStore, relationStore: DocumentStore) {
    this.entityStore = entityStore;
    this.relationStore = relationStore;
  }

  /**
   * Generate a unique ID for a document
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Add a new entity
   */
  async addEntity(entity: unknown): Promise<string | null> {
    const validation = validateEntity(entity);
    if (!validation.success) {
      throw new Error(`Invalid entity: ${validation.error.message}`);
    }

    const _id = this.generateId();
    const documentWithId = { _id, ...validation.data };
    await this.entityStore.put(documentWithId);
    return _id;
  }

  /**
   * Add a new relation
   */
  async addRelation(relation: unknown): Promise<string | null> {
    const validation = validateRelation(relation);
    if (!validation.success) {
      throw new Error(`Invalid relation: ${validation.error.message}`);
    }

    const _id = this.generateId();
    const documentWithId = { _id, ...validation.data };
    await this.relationStore.put(documentWithId);
    return _id;
  }

  async getEntityById(id: string): Promise<Entity | null> {
    const entity = await this.entityStore.get(id);
    return entity ? (entity as Entity) : null;
  }

  async getRelationById(id: string): Promise<Relation | null> {
    const relation = await this.relationStore.get(id);
    return relation ? (relation as Relation) : null;
  }
}
