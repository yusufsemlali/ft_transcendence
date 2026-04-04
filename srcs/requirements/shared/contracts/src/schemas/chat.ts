import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string(),
  content: z.string(),
  timestamp: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
});

export type Room = z.infer<typeof RoomSchema>;
