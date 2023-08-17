import { faker } from '@faker-js/faker';
import { Room } from '@prisma/client';
import { prisma } from '@/config';

export function getRandomRoom(rooms: Room[]) {
  return rooms[faker.mersenne.rand(0, rooms.length)];
}

export async function createBooking(userId: number, rooms: Room[]) {
  const room = getRandomRoom(rooms);
  const booking = await prisma.booking.create({
    data: {
      userId,
      roomId: room.id,
    },
  });
  return { booking, room };
}

export async function createBookings(userId: number, rooms: Room[]) {
  const room = getRandomRoom(rooms);
  const bookings = [];
  for (let i = 0; i < room.capacity; i++) {
    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId: room.id,
      },
    });

    bookings.push(booking);
  }
  return { bookings, roomId: room.id };
}
