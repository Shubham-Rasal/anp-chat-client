import { z } from "zod";
import { gun } from "../db/gun.js";
import { logger } from "../config/index.js";
import type { Entity } from "../schemas/entity.js";
import type { Relation } from "../schemas/relation.js";

// Define filter schema for graph reading
const GraphFilterSchema = z.object({
  entityTypes: z.array(z.string()).optional(),
  relationTypes: z.array(z.string()).optional(),
  startDate: z.number().optional(),
  endDate: z.number().optional(),
  entityIds: z.array(z.string()).optional(),
});

type GraphNode = {
  id: string;
  type: "entity";
  data: Entity;
};

type GraphEdge = {
  id: string;
  type: "relation";
  data: Relation;
};

type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export const readGraph = {
  name: "read_graph",
  description: "Read and filter the knowledge graph",
  parameters: {
    filter: GraphFilterSchema.optional(),
    page: z.number().min(1).optional().default(1),
    pageSize: z.number().min(1).max(100).optional().default(50),
  },
  handler: async ({
    filter,
    page = 1,
    pageSize = 50,
  }: {
    filter?: z.infer<typeof GraphFilterSchema>;
    page?: number;
    pageSize?: number;
  }) => {
    try {
      // Calculate pagination offsets
      const skip = (page - 1) * pageSize;

      // Fetch all entities and relations with filtering
      const [entities, relations] = await Promise.all([
        // Fetch entities
        new Promise<Entity[]>((resolve) => {
          const entities: Entity[] = [];
          gun
            .get("entities")
            .map()
            .once((entity: Entity | null, id: string) => {
              if (entity) {
                // Apply entity filters
                const matchesType =
                  !filter?.entityTypes?.length ||
                  filter.entityTypes.includes(entity.type);
                const matchesDate =
                  (!filter?.startDate ||
                    entity.createdAt >= filter.startDate) &&
                  (!filter?.endDate || entity.createdAt <= filter.endDate);
                const matchesId =
                  !filter?.entityIds?.length || filter.entityIds.includes(id);

                if (matchesType && matchesDate && matchesId) {
                  entities.push({ ...entity, id });
                }
              }
            });
          // Give some time for GUN to retrieve data
          setTimeout(() => resolve(entities), 100);
        }),

        // Fetch relations
        new Promise<Relation[]>((resolve) => {
          const relations: Relation[] = [];
          gun
            .get("relations")
            .map()
            .once((relation: Relation | null, id: string) => {
              if (relation) {
                // Apply relation filters
                const matchesType =
                  !filter?.relationTypes?.length ||
                  filter.relationTypes.includes(relation.type);
                const matchesDate =
                  (!filter?.startDate ||
                    relation.createdAt >= filter.startDate) &&
                  (!filter?.endDate || relation.createdAt <= filter.endDate);
                const matchesEntityIds =
                  !filter?.entityIds?.length ||
                  filter.entityIds.includes(relation.sourceId) ||
                  filter.entityIds.includes(relation.targetId);

                if (matchesType && matchesDate && matchesEntityIds) {
                  relations.push({ ...relation, id });
                }
              }
            });
          // Give some time for GUN to retrieve data
          setTimeout(() => resolve(relations), 100);
        }),
      ]);

      // Sort by most recently updated
      const sortedEntities = entities.sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
      );
      const sortedRelations = relations.sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
      );

      // Apply pagination
      const paginatedEntities = sortedEntities.slice(skip, skip + pageSize);
      const paginatedRelations = sortedRelations.slice(skip, skip + pageSize);

      // Format graph data
      const graphData: GraphData = {
        nodes: paginatedEntities.map((entity) => ({
          id: entity.id,
          type: "entity",
          data: entity,
        })),
        edges: paginatedRelations.map((relation) => ({
          id: relation.id,
          type: "relation",
          data: relation,
        })),
      };

      // Calculate total pages
      const totalEntities = sortedEntities.length;
      const totalRelations = sortedRelations.length;
      const totalPages = Math.ceil(
        Math.max(totalEntities, totalRelations) / pageSize,
      );

      // Generate summary statistics
      const stats = {
        totalEntities,
        totalRelations,
        filteredEntities: graphData.nodes.length,
        filteredRelations: graphData.edges.length,
        entityTypes: [...new Set(entities.map((e) => e.type))],
        relationTypes: [...new Set(relations.map((r) => r.type))],
      };

      return {
        content: [
          {
            type: "text" as const,
            text:
              `Graph snapshot (Page ${page}/${totalPages}):\n\n` +
              `Statistics:\n` +
              `- Total Entities: ${stats.totalEntities} (${stats.filteredEntities} in current page)\n` +
              `- Total Relations: ${stats.totalRelations} (${stats.filteredRelations} in current page)\n` +
              `- Entity Types: ${stats.entityTypes.join(", ")}\n` +
              `- Relation Types: ${stats.relationTypes.join(", ")}\n\n` +
              `Entities:\n${graphData.nodes
                .map(
                  (node) =>
                    `✓ ${node.data.name} (${node.id})\n  Type: ${node.data.type}\n  Observations: ${node.data.observations.length}`,
                )
                .join("\n\n")}\n\n` +
              `Relations:\n${graphData.edges
                .map(
                  (edge) =>
                    `→ ${edge.data.type}: ${edge.data.sourceId} → ${edge.data.targetId}${
                      edge.data.bidirectional ? " (bidirectional)" : ""
                    }`,
                )
                .join("\n")}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Error reading graph:", error);
      throw new Error("Failed to read graph");
    }
  },
};
