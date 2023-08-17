import { ApplicationError } from '@/protocols';

export function cannotHaveBookingError(): ApplicationError {
  return {
    name: 'CannotHaveBookingError',
    message: 'Cannot have booking!',
  };
}
