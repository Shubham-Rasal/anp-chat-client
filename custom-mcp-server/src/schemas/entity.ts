import { z } from "zod";

export const EntitySchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  observations: z.array(z.string()).default([]),
});

export type Entity = z.infer<typeof EntitySchema> & {
  id: string;
  createdAt: number;
  updatedAt: number;
};
