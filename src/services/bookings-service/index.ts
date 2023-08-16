import bookingRepository from '@/repositories/booking-repository';
import { forbiddenError, notFoundError } from '@/errors';
import hotelsService from '@/services/hotels-service';
import hotelRepository from '@/repositories/hotel-repository';

async function getBooking(userId: number) {
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) throw notFoundError();
  return booking;
}

async function saveBooking(userId: number, roomId: number) {
  const booking = await bookingRepository.findBooking(userId);
  if (booking) throw forbiddenError('A reservation already exists');
  const bookings = await bookingRepository.findBookingByRoomId(roomId);
  if (bookings.length !== 0 && bookings.length === bookings[0].Room.capacity) throw forbiddenError('Room is full');
  const { id: bookingId } = await bookingRepository.saveBooking(userId, roomId);
  return bookingId;
}

async function updateBooking(userId: number, roomId: number, bookingId: number) {
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) throw forbiddenError('User does not have a reservation yet');
  const bookings = await bookingRepository.findBookingByRoomId(roomId);
  if (bookings.length !== 0 && bookings.length === bookings[0].Room.capacity) throw forbiddenError('Room is full');
  await bookingRepository.updateBooking(bookingId, roomId);
}

export default { getBooking, saveBooking, updateBooking };
