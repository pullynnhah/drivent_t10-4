import { Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import bookingsService from '@/services/bookings-service';

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const booking = bookingsService.getBooking(userId);
  res.send(booking);
}

export async function saveBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = Number(req.body.roomId);
  const bookingId = bookingsService.saveBooking(userId, roomId);
  res.send({ bookingId });
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const bookingId = Number(req.params.bookingId);
  const roomId = Number(req.body.roomId);
  await bookingsService.updateBooking(userId, roomId, bookingId);
  res.send({ bookingId });
}
