import { z } from "zod";

export const RelationSchema = z.object({
  type: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  properties: z.record(z.string(), z.any()).optional().default({}),
  bidirectional: z.boolean().optional().default(false),
});

export type Relation = z.infer<typeof RelationSchema> & {
  id: string;
  createdAt: number;
  updatedAt: number;
};
