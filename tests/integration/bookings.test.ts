import supertest from 'supertest';
import httpStatus from 'http-status';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import { TicketStatus } from '@prisma/client';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createEnrollmentWithAddress,
  createHotelWithRooms,
  createHotel,
  createTicket,
  createTicketType,
  createUser,
  createBookings,
  getRandomRoom,
} from '../factories';
import { createBooking } from '../factories/bookings-factory';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /bookings', () => {
  describe('invalid token', () => {
    it('should respond with status 401 if no token is given', async () => {
      const { status } = await server.get('/bookings');
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();
      const { status } = await server.get('/bookings').set('Authorization', `Bearer ${token}`);

      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const { status } = await server.get('/bookings').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe('valid token (w/o booking)', () => {
    it('should respond with 404 when user is not enroll', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { status } = await server.get('/bookings').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 403 when enrolled user has no ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const { status } = await server.get('/bookings').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when enrolled user has remote ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/bookings').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when enrolled user has in person ticket that does not include hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: false });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/bookings').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 404 when no booking is found', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.get('/bookings').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
  });
  describe('valid token (w/ booking)', () => {
    it('should respond with 200 when a booking is found', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { rooms } = await createHotelWithRooms();
      const { booking, room } = await createBooking(user.id, rooms);
      const { body, status } = await server.get('/bookings').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({
        ...booking,
        Room: {
          ...room,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
      });
    });
  });
});

describe('POST /bookings', () => {
  describe('invalid token', () => {
    it('should respond with status 401 if no token is given', async () => {
      const { status } = await server.post('/bookings').send({ roomId: 1 });
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();
      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });

      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe('valid token but cannot make booking', () => {
    it('should respond with 404 when user is not enroll', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 403 when enrolled user has no ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when enrolled user has remote ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when enrolled user has in person ticket that does not include hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: false });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 404 when roomId is invalid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 403 when user already has a booking', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { rooms } = await createHotelWithRooms();
      await createBooking(user.id, rooms);

      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when room is full', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { rooms } = await createHotelWithRooms();
      const { roomId } = await createBookings(user.id, rooms);

      const { status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
  });
  describe('valid token can book room', () => {
    it('should respond with 200 when user can booked a room', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);
      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { rooms } = await createHotelWithRooms();
      const { id: roomId } = getRandomRoom(rooms);
      const { body, status } = await server.post('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId });
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({ bookingId: expect.any(Number) });
    });
  });
});

describe('PUT /bookings/:bookingId', () => {
  describe('invalid token', () => {
    it('should respond with status 401 if no token is given', async () => {
      const { status } = await server.put('/bookings').send({ roomId: 1 });
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if given token is not valid', async () => {
      const token = faker.lorem.word();
      const { status } = await server.put('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });

      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
    it('should respond with status 401 if there is no session for given token', async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const { status } = await server.put('/bookings').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
  describe('valid token but cannot update booking', () => {
    it('should respond with 404 when user is not enroll', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { status } = await server.put('/bookings/1').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 403 when enrolled user has no ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const { status } = await server.put('/bookings/1').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when enrolled user has remote ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.put('/bookings/1').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when enrolled user has in person ticket that does not include hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: false });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.put('/bookings/1').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when user has no previous booking', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { status } = await server.put('/bookings/1').set('Authorization', `Bearer ${token}`).send({ roomId: 1 });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
    it('should respond with 403 when roomId is invalid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);
      const { rooms } = await createHotelWithRooms();
      const { booking } = await createBooking(user.id, rooms);
      const { status } = await server
        .put(`/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: 0 });
      expect(status).toBe(httpStatus.NOT_FOUND);
    });
    it('should respond with 403 when room is full', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { id: enrollmentId } = await createEnrollmentWithAddress(user);

      const { id: ticketTypeId } = await createTicketType({ isRemote: false, includesHotel: true });
      await createTicket(enrollmentId, ticketTypeId, TicketStatus.PAID);

      const { rooms } = await createHotelWithRooms();
      const { bookings, roomId } = await createBookings(user.id, rooms);

      const { status } = await server
        .put(`/bookings/${bookings[0].id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });
  });
});
