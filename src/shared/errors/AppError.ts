class AppError extends Error {
  public statusCode: number;

  public isOperational: boolean;

  public timestamp: string;

  constructor(statusCode: number, message: string, isOperational: boolean = true, stack: string = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
