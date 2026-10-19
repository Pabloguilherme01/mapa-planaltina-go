import { z } from 'zod';

/** Recusa históricos extensos antes de enviá-los ao provedor de IA. */
export const AssistantRequestSchema = z.object({
  message: z.string().trim().min(1, 'Mensagem não pode estar vazia').max(500),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(1000),
  })).max(10).optional(),
});
