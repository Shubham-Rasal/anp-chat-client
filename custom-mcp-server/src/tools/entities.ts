import { EntitySchema, type Entity } from "../schemas/entity.js";
import { gun } from "../db/gun.js";
import { logger } from "../config/index.js";
import { z } from "zod";

export const createEntities = {
  name: "create_entities",
  description: "Create new entities in the knowledge graph",
  parameters: {
    entities: z.array(EntitySchema),
  },
  handler: async ({
    entities,
  }: { entities: z.infer<typeof EntitySchema>[] }) => {
    try {
      const results = await Promise.all(
        entities.map(async (entity) => {
          // Check for duplicates
          const existingNode = await new Promise<boolean>((resolve) => {
            gun
              .get("entities")
              .get(entity.name)
              .once((existing: Entity | undefined) => {
                resolve(!!existing);
              });
          });

          if (existingNode) {
            return {
              success: false,
              name: entity.name,
              error: "Entity already exists",
            };
          }

          // Create new entity
          const newEntity: Entity = {
            ...entity,
            id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Store in GUN
          gun.get("entities").get(newEntity.id).put(newEntity);

          logger.info(`Created entity: ${newEntity.name} (${newEntity.id})`);

          return {
            success: true,
            id: newEntity.id,
            name: newEntity.name,
          };
        }),
      );

      // Convert results to text for MCP response
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        content: [
          {
            type: "text" as const,
            text: `Created ${successCount} entities. ${failureCount} failed.\n\n${results
              .map((r) =>
                r.success
                  ? `✓ Created: ${r.name} (${r.id})`
                  : `✗ Failed: ${r.name} - ${r.error}`,
              )
              .join("\n")}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Error creating entities:", error);
      throw new Error("Failed to create entities");
    }
  },
};

export const deleteEntities = {
  name: "delete_entities",
  description: "Delete entities from the knowledge graph",
  parameters: {
    entityIds: z.array(z.string().min(1)),
  },
  handler: async ({ entityIds }: { entityIds: string[] }) => {
    try {
      const results = await Promise.all(
        entityIds.map(async (entityId) => {
          // Check if entity exists
          const entity = await new Promise<Entity | undefined>((resolve) => {
            gun
              .get("entities")
              .get(entityId)
              .once((existing: Entity | undefined) => {
                resolve(existing);
              });
          });

          if (!entity) {
            return {
              success: false,
              id: entityId,
              error: "Entity not found",
            };
          }

          // Delete the entity by setting it to null
          gun.get("entities").get(entityId).put(null);

          // TODO: Implement cascade deletion for relations in future PR
          // This will be handled when we implement the relations system

          logger.info(`Deleted entity: ${entity.name} (${entityId})`);

          return {
            success: true,
            id: entityId,
            name: entity.name,
          };
        }),
      );

      // Convert results to text for MCP response
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        content: [
          {
            type: "text" as const,
            text: `Deleted ${successCount} entities. ${failureCount} failed.\n\n${results
              .map((r) =>
                r.success
                  ? `✓ Deleted: ${r.name} (${r.id})`
                  : `✗ Failed: ${r.id} - ${r.error}`,
              )
              .join("\n")}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Error deleting entities:", error);
      throw new Error("Failed to delete entities");
    }
  },
};

export const getEntities = {
  name: "get_entities",
  description: "Retrieve entities from the knowledge graph",
  parameters: {
    entityIds: z.array(z.string().min(1)).optional(),
    type: z.string().min(1).optional(),
    limit: z.number().min(1).max(100).optional().default(50),
  },
  handler: async ({
    entityIds,
    type,
    limit = 50,
  }: {
    entityIds?: string[];
    type?: string;
    limit?: number;
  }) => {
    try {
      // If specific entity IDs are provided, fetch those entities
      if (entityIds?.length) {
        const results = await Promise.all(
          entityIds.map(async (entityId) => {
            const entity = await new Promise<Entity | undefined>((resolve) => {
              gun
                .get("entities")
                .get(entityId)
                .once((existing: Entity | undefined) => {
                  resolve(existing);
                });
            });

            if (!entity) {
              return {
                success: false,
                id: entityId,
                error: "Entity not found",
              };
            }

            return {
              success: true,
              entity,
            };
          }),
        );

        const foundEntities = results
          .filter((r) => r.success)
          .map((r) => (r as { success: true; entity: Entity }).entity);
        const notFound = results
          .filter((r) => !r.success)
          .map((r) => (r as { success: false; id: string; error: string }).id);

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${foundEntities.length} entities. ${notFound.length} not found.\n\n${foundEntities
                .map(
                  (e) =>
                    `✓ ${e.name} (${e.id})\n  Type: ${e.type}\n  Observations: ${e.observations.length}`,
                )
                .join(
                  "\n\n",
                )}${notFound.length ? `\n\nNot found: ${notFound.join(", ")}` : ""}`,
            },
          ],
        };
      }

      // If no specific IDs, fetch entities with optional type filter
      const entities: Entity[] = [];
      await new Promise<void>((resolve) => {
        gun
          .get("entities")
          .map()
          .once((entity: Entity | null, id: string) => {
            if (entity && (!type || entity.type === type)) {
              entities.push({ ...entity, id });
            }
          });
        // Give some time for GUN to retrieve data
        setTimeout(resolve, 100);
      });

      // Sort by most recently updated and apply limit
      const sortedEntities = entities
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, limit);

      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${sortedEntities.length} entities${type ? ` of type '${type}'` : ""}:\n\n${sortedEntities
              .map(
                (e) =>
                  `✓ ${e.name} (${e.id})\n  Type: ${e.type}\n  Observations: ${e.observations.length}`,
              )
              .join("\n\n")}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Error getting entities:", error);
      throw new Error("Failed to get entities");
    }
  },
};

export const addObservations = {
  name: "add_observations",
  description: "Add observations to existing entities in the knowledge graph",
  parameters: {
    observations: z.array(
      z.object({
        entityId: z.string().min(1),
        observation: z.string().min(1),
      }),
    ),
  },
  handler: async ({
    observations,
  }: {
    observations: Array<{ entityId: string; observation: string }>;
  }) => {
    try {
      const results = await Promise.all(
        observations.map(async ({ entityId, observation }) => {
          // Get the existing entity
          const entity = await new Promise<Entity | undefined>((resolve) => {
            gun
              .get("entities")
              .get(entityId)
              .once((existing: Entity | undefined) => {
                resolve(existing);
              });
          });

          if (!entity) {
            return {
              success: false,
              entityId,
              error: "Entity not found",
            };
          }

          // Check for duplicate observation
          if (entity.observations.includes(observation)) {
            return {
              success: false,
              entityId,
              error: "Observation already exists",
            };
          }

          // Add the new observation and update timestamp
          const updatedEntity: Entity = {
            ...entity,
            observations: [...entity.observations, observation],
            updatedAt: Date.now(),
          };

          // Update in GUN
          gun.get("entities").get(entityId).put(updatedEntity);

          logger.info(
            `Added observation to entity: ${entity.name} (${entityId})`,
          );

          return {
            success: true,
            entityId,
            entityName: entity.name,
            observation,
          };
        }),
      );

      // Convert results to text for MCP response
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        content: [
          {
            type: "text" as const,
            text: `Added ${successCount} observations. ${failureCount} failed.\n\n${results
              .map((r) =>
                r.success
                  ? `✓ Added to ${(r as { entityName: string }).entityName} (${r.entityId}):\n  "${(r as { observation: string }).observation}"`
                  : `✗ Failed for ${r.entityId}: ${r.error}`,
              )
              .join("\n\n")}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Error adding observations:", error);
      throw new Error("Failed to add observations");
    }
  },
};
