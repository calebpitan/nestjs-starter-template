import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCodeName {
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  BAD_USER_INPUT = 'BAD_USER_INPUT',
  FORBIDDEN = 'FORBIDDEN',
  NON_DETERMINISTIC_AUTHORIZATION = 'NON_DETERMINISTIC_AUTHORIZATION',
}

export enum ErrorName {
  FORBIDDEN = 'Frobidden',
  UNAUTHORIZED = 'Unauthorized',
  BAD_REQUEST = 'Bad Request',
}

export class TokenExpiredException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    const error = ErrorName.FORBIDDEN;
    const statusCode = HttpStatus.FORBIDDEN;
    const response = {
      error,
      statusCode,
      message,
      details: { code: ErrorCodeName.TOKEN_EXPIRED, ...details },
    };
    super(response, statusCode);
    this.message = message;
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    const error = ErrorName.FORBIDDEN;
    const statusCode = HttpStatus.FORBIDDEN;
    const response = {
      error,
      statusCode,
      message,
      details: { code: ErrorCodeName.FORBIDDEN, ...details },
    };
    super(response, statusCode);
    this.message = message;
  }
}

export class NonDeterministicAuthorizationException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    const error = ErrorName.FORBIDDEN;
    const statusCode = HttpStatus.FORBIDDEN;
    const response = {
      error,
      statusCode,
      message,
      details: { code: ErrorCodeName.NON_DETERMINISTIC_AUTHORIZATION, ...details },
    };
    super(response, statusCode);
    this.message = message;
  }
}

export class UnauthenticatedException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    const error = ErrorName.UNAUTHORIZED;
    const statusCode = HttpStatus.UNAUTHORIZED;
    const response = {
      error,
      statusCode,
      message,
      details: { code: ErrorCodeName.UNAUTHENTICATED, ...details },
    };
    super(response, statusCode);
    this.message = message;
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    const error = ErrorName.UNAUTHORIZED;
    const statusCode = HttpStatus.UNAUTHORIZED;
    const response = {
      error,
      statusCode,
      message,
      details: { code: ErrorCodeName.UNAUTHORIZED, ...details },
    };
    super(response, statusCode);
    this.message = message;
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    const error = ErrorName.BAD_REQUEST;
    const statusCode = HttpStatus.BAD_REQUEST;
    const response = {
      error,
      statusCode,
      message,
      details: { code: ErrorCodeName.BAD_USER_INPUT, ...details },
    };
    super(response, statusCode);
    this.message = message;
  }
}

export * from './message';
export * from './mongodb';
