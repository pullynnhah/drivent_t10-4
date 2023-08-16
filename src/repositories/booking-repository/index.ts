import { prisma } from '@/config';

async function findBooking(userId: number) {
  return prisma.booking.findFirst({ where: { userId }, include: { Room: true } });
}

async function saveBooking(userId: number, roomId: number) {
  return prisma.booking.create({ data: { userId, roomId } });
}

async function updateBooking(bookingId: number, roomId: number) {
  await prisma.booking.update({ data: { roomId }, where: { id: bookingId } });
}

function findBookingById(bookingId: number) {
  return prisma.booking.findUnique({ where: { id: bookingId } });
}

function findBookingByRoomId(bookingId: number) {
  return prisma.booking.findMany({ where: { roomId: bookingId }, include: { Room: true } });
}
const bookingRepository = {
  findBooking,
  saveBooking,
  updateBooking,
  findBookingById,
  findBookingByRoomId,
};

export default bookingRepository;
