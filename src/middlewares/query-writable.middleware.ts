import type { Request, Response, NextFunction } from 'express';

const queryWritable = (req: Request, _res: Response, next: NextFunction): void => {
  Object.defineProperty(req, 'query', {
    ...Object.getOwnPropertyDescriptor(req, 'query'),
    value: req.query,
    writable: true
  });

  next();
};

export default queryWritable;
