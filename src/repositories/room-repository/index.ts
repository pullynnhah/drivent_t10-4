import { prisma } from '@/config';

async function findRoomById(roomId: number) {
  return prisma.room.findUnique({ where: { id: roomId } });
}

const roomRepository = {
  findRoomById,
};

export default roomRepository;
