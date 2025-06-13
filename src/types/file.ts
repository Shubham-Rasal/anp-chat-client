import { z } from "zod";

export type FileData = {
  name: string;
  type: string;
  content: string;
};

export const FileDataSchema = z.object({
  name: z.string(),
  type: z.string(),
  content: z.string(),
});

export type FileMessagePart = {
  type: "file";
  data: string;
  mimeType: string;
};
