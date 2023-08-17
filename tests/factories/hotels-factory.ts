import { faker } from '@faker-js/faker';
import { Room } from '@prisma/client';
import { prisma } from '@/config';

export async function createHotel() {
  return prisma.hotel.create({
    data: {
      name: faker.company.companyName(),
      image: faker.image.imageUrl(),
    },
  });
}

async function createRoom(hotelId: number, roomNumber: string) {
  return prisma.room.create({
    data: {
      name: roomNumber,
      capacity: faker.mersenne.rand(1, 3),
      hotelId,
    },
  });
}

export async function createHotelWithRooms() {
  const hotel = await createHotel();
  const numFloors = faker.mersenne.rand(1, 9);
  const numRoomsPerFloor = faker.mersenne.rand(1, 4) * 2;

  const rooms: Room[] = [];
  for (let i = 0; i < numFloors; i++) {
    for (let j = 0; j < numRoomsPerFloor; j++) {
      rooms.push(await createRoom(hotel.id, `${i}0${j}`));
    }
  }

  return { hotel, rooms };
}

export async function createRoomWithHotelId(hotelId: number) {
  return prisma.room.create({
    data: {
      name: '1020',
      capacity: 3,
      hotelId: hotelId,
    },
  });
}
