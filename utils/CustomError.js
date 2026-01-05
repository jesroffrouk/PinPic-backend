class CustomError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR') {
    (super(message), (this.statusCode = statusCode));
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default CustomError;
