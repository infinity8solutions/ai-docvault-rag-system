import { FastifyReply } from 'fastify';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const ERRORS = {
  invalidToken: new AppError('Token is invalid.', 401),
  userExists: new AppError('User already exists', 409),
  userNotExists: new AppError('User not exists', 404),
  userCredError: new AppError('Invalid credential', 401),
  tokenError: new AppError('Invalid Token', 401),
  invalidRequest: new AppError('Invalid Token', 400),
  internalServerError: new AppError('Internal Server Error', 500),
  unauthorizedAccess: new AppError('Unauthorized access', 401),
  notFound: new AppError('Resource not found', 404),
  badRequest: new AppError('Bad request', 400),
  serverError: new AppError('Server error', 500),
};

export function handleServerError(reply: FastifyReply, error: any) {
  // Log the error for debugging
  console.error('Server Error:', error);

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply
    .status(ERRORS.internalServerError.statusCode)
    .send(ERRORS.internalServerError.message);
}
