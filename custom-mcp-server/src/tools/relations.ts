import { z } from "zod";
import { gun } from "../db/gun.js";
import { logger } from "../config/index.js";
import { RelationSchema, type Relation } from "../schemas/relation.js";
import type { Entity } from "../schemas/entity.js";

export const createRelations = {
  name: "create_relations",
  description: "Create new relations between entities in the knowledge graph",
  parameters: {
    relations: z.array(RelationSchema),
  },
  handler: async ({
    relations,
  }: { relations: z.infer<typeof RelationSchema>[] }) => {
    try {
      const results = await Promise.all(
        relations.map(async (relation) => {
          // Check if source entity exists
          const sourceEntity = await new Promise<Entity | undefined>(
            (resolve) => {
              gun
                .get("entities")
                .get(relation.sourceId)
                .once((existing: Entity | undefined) => {
                  resolve(existing);
                });
            },
          );

          if (!sourceEntity) {
            return {
              success: false,
              error: `Source entity ${relation.sourceId} not found`,
              relation,
            };
          }

          // Check if target entity exists
          const targetEntity = await new Promise<Entity | undefined>(
            (resolve) => {
              gun
                .get("entities")
                .get(relation.targetId)
                .once((existing: Entity | undefined) => {
                  resolve(existing);
                });
            },
          );

          if (!targetEntity) {
            return {
              success: false,
              error: `Target entity ${relation.targetId} not found`,
              relation,
            };
          }

          // Check for circular reference if source and target are the same
          if (relation.sourceId === relation.targetId) {
            return {
              success: false,
              error:
                "Circular reference: source and target entities cannot be the same",
              relation,
            };
          }

          // Check if relation already exists
          const existingRelation = await new Promise<boolean>((resolve) => {
            gun
              .get("relations")
              .get(`${relation.sourceId}_${relation.targetId}_${relation.type}`)
              .once((existing: Relation | undefined) => {
                resolve(!!existing);
              });
          });

          if (existingRelation) {
            return {
              success: false,
              error:
                "Relation already exists between these entities with this type",
              relation,
            };
          }

          // Create new relation
          const newRelation: Relation = {
            ...relation,
            id: `${relation.sourceId}_${relation.targetId}_${relation.type}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Store in GUN
          gun.get("relations").get(newRelation.id).put(newRelation);

          // If bidirectional, create reverse relation
          if (relation.bidirectional) {
            const reverseRelation: Relation = {
              ...relation,
              sourceId: relation.targetId,
              targetId: relation.sourceId,
              id: `${relation.targetId}_${relation.sourceId}_${relation.type}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            gun.get("relations").get(reverseRelation.id).put(reverseRelation);
          }

          logger.info(
            `Created relation: ${newRelation.type} from ${sourceEntity.name} to ${targetEntity.name}`,
          );

          return {
            success: true,
            relation: newRelation,
            sourceEntityName: sourceEntity.name,
            targetEntityName: targetEntity.name,
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
            text: `Created ${successCount} relations. ${failureCount} failed.\n\n${results
              .map((r) =>
                r.success
                  ? `✓ Created ${(r as any).relation.type} relation:\n  ${(r as any).sourceEntityName} -> ${(r as any).targetEntityName}${
                      (r as any).relation.bidirectional
                        ? " (bidirectional)"
                        : ""
                    }`
                  : `✗ Failed: ${r.error}\n  Source: ${r.relation.sourceId}\n  Target: ${r.relation.targetId}\n  Type: ${r.relation.type}`,
              )
              .join("\n\n")}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Error creating relations:", error);
      throw new Error("Failed to create relations");
    }
  },
};

export const deleteRelations = {
  name: "delete_relations",
  description: "Delete relations from the knowledge graph",
  parameters: {
    relationIds: z.array(z.string().min(1)),
  },
  handler: async ({ relationIds }: { relationIds: string[] }) => {
    try {
      const results = await Promise.all(
        relationIds.map(async (relationId) => {
          // Check if relation exists
          const relation = await new Promise<Relation | undefined>(
            (resolve) => {
              gun
                .get("relations")
                .get(relationId)
                .once((existing: Relation | undefined) => {
                  resolve(existing);
                });
            },
          );

          if (!relation) {
            return {
              success: false,
              id: relationId,
              error: "Relation not found",
            };
          }

          // Get source and target entity names for better reporting
          const [sourceEntity, targetEntity] = await Promise.all([
            new Promise<Entity | undefined>((resolve) => {
              gun
                .get("entities")
                .get(relation.sourceId)
                .once((existing: Entity | undefined) => {
                  resolve(existing);
                });
            }),
            new Promise<Entity | undefined>((resolve) => {
              gun
                .get("entities")
                .get(relation.targetId)
                .once((existing: Entity | undefined) => {
                  resolve(existing);
                });
            }),
          ]);

          // Delete the relation by setting it to null
          gun.get("relations").get(relationId).put(null);

          // If it's bidirectional, also delete the reverse relation
          if (relation.bidirectional) {
            const reverseRelationId = `${relation.targetId}_${relation.sourceId}_${relation.type}`;
            gun.get("relations").get(reverseRelationId).put(null);
          }

          logger.info(
            `Deleted relation: ${relation.type} from ${sourceEntity?.name || relation.sourceId} to ${targetEntity?.name || relation.targetId}`,
          );

          return {
            success: true,
            relation,
            sourceEntityName: sourceEntity?.name || relation.sourceId,
            targetEntityName: targetEntity?.name || relation.targetId,
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
            text: `Deleted ${successCount} relations. ${failureCount} failed.\n\n${results
              .map((r) =>
                r.success
                  ? `✓ Deleted ${(r as any).relation.type} relation:\n  ${(r as any).sourceEntityName} -> ${(r as any).targetEntityName}${
                      (r as any).relation.bidirectional
                        ? " (and its reverse)"
                        : ""
                    }`
                  : `✗ Failed: ${r.error}\n  ID: ${r.id}`,
              )
              .join("\n\n")}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Error deleting relations:", error);
      throw new Error("Failed to delete relations");
    }
  },
};
