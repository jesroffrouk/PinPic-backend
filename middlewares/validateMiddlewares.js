import catchAsync from '../utils/catchAsync.js';
import CustomError from '../utils/CustomError.js';
import { OAuth2Client } from 'google-auth-library';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const logger = createLoggerFor(import.meta.url, 'validateMiddleware');

const validateMiddlewares = {
  validateImage: (req, res, next) => {
    logger.info('Validating Inputs..');
    if (!req.file) {
      logger.warn('file not provided');
      throw new CustomError('file not provided', 422, 'INVALID_INPUT');
    }
    if (!req.file.mimetype.startsWith('image')) {
      logger.warn('image not provided');
      throw new CustomError('image not provided', 422, 'INVALID_INPUT');
    }
    logger.info('Validated');
    next();
  },
  validateLocation: (req, res, next) => {
    logger.info('Validating inputs..');
    const longitude = req.query.longitude || req.body.longitude;
    const latitude = req.query.latitude || req.body.latitude;

    if (!longitude) {
      logger.warn('provide longitude');
      throw new CustomError('provide longitude', 422, 'INVALID_LOCATION');
    }
    if (!latitude) {
      logger.warn('provide lattitude');
      throw new CustomError('provide latitude', 422, 'INVALID_LOCATION');
    }

    // checking for type
    if (typeof longitude !== 'string' || typeof latitude !== 'string') {
      logger.warn(
        `Wrong type detected.. longitude: ${longitude} Latitude: ${latitude}`
      );
      throw new CustomError('provide correct inputs', 422, 'INVALID_INPUT');
    }
    logger.info('Validated');
    next();
  },
  validateEmail: async (req, res, next) => {
    logger.info('Validating Inputs..');
    const email = req.body.email;
    // check type of inputs
    if (typeof email !== 'string') {
      logger.warn(`wrong input detected... Email: ${email}`);
      throw new CustomError('provide correct inputs', 422, 'INVALID_INPUT');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('invalid email address');
      throw new CustomError('invalid email address', 422, 'INVALID_EMAIL');
    }
    logger.info('Validated');
    next();
  },
  validateUserCrendentials: (req, res, next) => {
    logger.info('Validating Inputs..');
    const username = req.body.username;
    const password = req.body.username;
    if (!username) {
      logger.warn('empty username');
      throw new CustomError('username empty', 422, 'INVALID_INPUT');
    }
    if (!password) {
      logger.warn('empty password');
      throw new CustomError('password empty', 422, 'INVALID_INPUT');
    }
    // check for type of inputs
    // i am also logging field like password because invalid type of inputs are threat to exploit the site
    if (typeof username !== 'string' || typeof password !== 'string') {
      logger.warn(
        `wrong input detected.. username: ${username} password: ${password}`
      );
      throw new CustomError('provide correct inputs', 422, 'INVALID_INPUT');
    }
    logger.info('Validated');
    next();
  },
  validateTokenBygoogleAuth: catchAsync(async (req, res, next) => {
    logger.info('Validating Inputs..');
    const token = req.body.token;
    if (!token) {
      logger.warn('empty Oauth token');
      throw new CustomError('Empty Oauth Token', 401, 'INVALID_TOKEN');
    }
    // checking type of input
    if (typeof token !== 'string') {
      logger.warn(`wrong input detected.. Token: ${token}`);
      throw new CustomError('provide correct inputs', 422, 'INVALID_INPUT');
    }

    logger.info('verifying Id token');
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    req.user = payload;
    logger.info('Validated');
    next();
  }),
  validateVerifyEmailToken: (req, res, next) => {
    logger.info('Validating Inputs..');
    const token = req.query.token;
    if (!token) {
      throw new CustomError('empty token', 422, 'INVALID_TOKEN');
    }
    // checking inputs
    if (typeof token !== 'string') {
      logger.warn(`wrong input detected.. Token: ${token}`);
      throw new CustomError('provide correct inputs', 422, 'INVALID_INPUT');
    }
    logger.info('Validated');
    next();
  },
  validateUpvotes: (req,res,next) => {
    logger.info("validating inputs..")
    const {react_type,imgid} = req.body
    const reactions = ['like','dislike']
    if (!react_type) {
      throw new CustomError('provide react type',422,'INVALID_INPUT')
    }

    if (typeof react_type !== 'string' || !reactions.includes(react_type)){
      throw new CustomError('invalid react type',422,'INVALID_INPUT')
    }

    if (!imgid || typeof imgid !== 'number'){
      throw new CustomError('invalid image',422,'INVALID_INPUT')
    }
    next();
  }
};

export default validateMiddlewares;
