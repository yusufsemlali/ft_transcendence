import { initServer } from '@ts-rest/express';
// import type { RouterImplementation } from '@ts-rest/express/src/lib/types';
import { contract } from '@ft-transcendence/contracts';
import messageService from '../services/messageService';
import roomService from '../services/roomService';
import userService from '../services/userService';

const s = initServer();

export const chatController = s.router(contract.chat, {
// export const chatController: RouterImplementation<typeof contract.chat> = s.router(contract.chat, {
  getStats: async () => {
    return {
      status: 200 as const,
      body: {
        connectedUsers: userService.getAllUsers().length,
        activeRooms: await roomService.getRoomCount(),
        totalMessages: await messageService.getTotalMessageCount(),
      },
    };
  },
  getRoomInfo: async ({ params }) => {
    const room = await roomService.getRoom(params.roomId);

    if (!room) {
      return {
        status: 404 as const,
        body: { message: 'Room not found' },
      };
    }

    const roomDatabaseId = await roomService.getRoomDatabaseId(room.id);
    return {
      status: 200 as const,
      body: {
        room: room.id,
        userCount: userService.getUsersInRoom(room.id).length,
        messageCount: roomDatabaseId
          ? (await messageService.getMessagesByRoom(roomDatabaseId)).length
          : 0,
        createdAt: room.createdAt,
      },
    };
  },
  getRooms: async () => {
    return {
      status: 200 as const,
      body: await roomService.getRooms(),
    };
  },
  getRoomMessages: async ({ params, query }) => {
    const room = await roomService.getRoom(params.roomId);

    if (!room) {
      return {
        status: 404 as const,
        body: { message: 'Room not found' },
      };
    }

    const parsedLimit = query.limit ? parseInt(query.limit, 10) : 50;
    const parsedOffset = query.offset ? parseInt(query.offset, 10) : 0;
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;
    const offset = Number.isFinite(parsedOffset) ? parsedOffset : 0;
    const roomDatabaseId = await roomService.getRoomDatabaseId(room.id);

    return {
      status: 200 as const,
      body: roomDatabaseId
        ? await messageService.getMessagesByRoom(roomDatabaseId, limit, offset)
        : [],
    };
  },
});
