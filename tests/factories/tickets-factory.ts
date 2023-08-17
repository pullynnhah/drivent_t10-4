import faker from '@faker-js/faker';
import { TicketStatus, TicketType } from '@prisma/client';
import { prisma } from '@/config';

export async function createTicketType(params: Partial<TicketType> = {}) {
  return prisma.ticketType.create({
    data: {
      name: faker.name.findName(),
      price: faker.datatype.number(),
      isRemote: params.isRemote ?? faker.datatype.boolean(),
      includesHotel: params.includesHotel ?? faker.datatype.boolean(),
    },
  });
}

export async function createTicket(enrollmentId: number, ticketTypeId: number, status: TicketStatus) {
  return prisma.ticket.create({
    data: {
      enrollmentId,
      ticketTypeId,
      status,
    },
  });
}

export async function createTicketTypeRemote() {
  return prisma.ticketType.create({
    data: {
      name: faker.name.findName(),
      price: faker.datatype.number(),
      isRemote: true,
      includesHotel: faker.datatype.boolean(),
    },
  });
}

export async function createTicketTypeWithHotel() {
  return prisma.ticketType.create({
    data: {
      name: faker.name.findName(),
      price: faker.datatype.number(),
      isRemote: false,
      includesHotel: true,
    },
  });
}
