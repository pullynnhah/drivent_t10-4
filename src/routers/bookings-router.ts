import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import { getBooking, saveBooking, updateBooking } from '@/controllers';

const bookingsRouter = Router();
bookingsRouter
  .all('/*', authenticateToken)
  .get('/', getBooking)
  .post('/', saveBooking)
  .put('/:bookingId', updateBooking);
export { bookingsRouter };
