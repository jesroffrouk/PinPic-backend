import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req, _res, next) {
  req.requestId = uuidv4();
  next();
}
