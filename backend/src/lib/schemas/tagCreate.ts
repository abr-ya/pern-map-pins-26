import { z } from 'zod';

export const tagCreateBodySchema = z.object({
  name: z.string().min(1).max(100),
});

export type TagCreateBody = z.infer<typeof tagCreateBodySchema>;
