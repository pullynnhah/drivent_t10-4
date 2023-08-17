import bookingRepository from '@/repositories/booking-repository';
import { forbiddenError, notFoundError } from '@/errors';
import roomRepository from '@/repositories/room-repository';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';
import { cannotHaveBookingError } from '@/errors/cannot-have-booking-error';

async function canHaveBooking(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }
  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw cannotHaveBookingError();
  }
}

async function getBooking(userId: number) {
  await canHaveBooking(userId);
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) throw notFoundError();
  return booking;
}

async function saveBooking(userId: number, roomId: number) {
  await canHaveBooking(userId);
  const booking = await bookingRepository.findBooking(userId);
  if (booking) throw forbiddenError('A reservation already exists');
  const room = await roomRepository.findRoomById(roomId);
  if (!room) throw notFoundError();
  const bookings = await bookingRepository.findBookingByRoomId(roomId);
  if (bookings.length !== 0 && bookings.length === bookings[0].Room.capacity) throw forbiddenError('Room is full');
  const { id: bookingId } = await bookingRepository.saveBooking(userId, roomId);
  return bookingId;
}

async function updateBooking(userId: number, roomId: number, bookingId: number) {
  await canHaveBooking(userId);
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) throw forbiddenError('User does not have a reservation yet');
  const room = await roomRepository.findRoomById(roomId);
  if (!room) throw notFoundError();
  const bookings = await bookingRepository.findBookingByRoomId(roomId);
  if (bookings.length !== 0 && bookings.length === bookings[0].Room.capacity) throw forbiddenError('Room is full');
  await bookingRepository.updateBooking(bookingId, roomId);
}

export default { getBooking, saveBooking, updateBooking };
