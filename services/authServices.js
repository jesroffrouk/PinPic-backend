// import sendMail from '../helpers/mailers/sendMail.js';
import generateVerifyTokens from '../utils/generateVerifyTokens.js';
import User from '../models/userModels.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { generateUniqueUsername } from '../utils/usernameGenerator.js';
import crypto from 'crypto';
import CustomError from '../utils/CustomError.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'auth service');

const authServices = {
  registerUser: async (email, username, password) => {
    const isUserExist = await User.doesUserExist(username, email);
    if (isUserExist) {
      logger.warn('username or email already exist!!');
      throw new CustomError('User Already Exist', 401, 'USER_EXIST');
    }
    const hashPassword = await bcrypt.hash(password, 10);
    // verify email send
    logger.info('generating token..');
    const { rawToken, hashedToken } = generateVerifyTokens();
    // also find a way to verify that email is also valid email.
    await User.addNewUser({
      username,
      email,
      password: hashPassword,
      isoauthuser: false,
      googleid: null,
      verifyEmailToken: hashedToken,
    });
    logger.info('new user added');
    //  email verification send
    logger.info('sending email verification...');
    // const { error } = await sendMail({ email, token: rawToken });
    // if (error) {
    //   logger.error(`while sending email verification: ${error.message}`);
    //   throw new CustomError('verfication Mail send failed', 400);
    // }
    logger.info('verification email send successfully');
    return { message: 'user registered Successfully' };
  },
  loginUser: async (username, password) => {
    const secretkey = process.env.JWT_SECRET_KEY;
    logger.info('checking if username exist in db');
    const user = await User.getUserByUsername(username);
    if (!user) {
      logger.warn('user doesnot exist');
      throw new CustomError('user doesnot exist', 401, 'USER_NOT_EXIST');
    }
    // if user registered through google
    if (user.isoauthuser) {
      logger.warn('user is registered through google');
      throw new CustomError(
        'please sign in through google',
        402,
        'GOOGLE_REGISTERED'
      );
    }
    logger.info('user successfully retrived from db');
    const hashPassword = user.password;
    logger.info('matching password...');
    const match = await bcrypt.compare(password, hashPassword);
    if (!match) {
      logger.warn('incorrect Password');
      throw new CustomError('incorrect password', 400, 'INCORRECT_PASSWORD');
    }
    logger.info('password matched');
    // userinfo to be send for frontend
    // future: build a bigint to string converter for this kind of scenario
    const UserInfo = {
      id: user.public_id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(UserInfo, secretkey, { expiresIn: '1h' });
    logger.info('successfully logged in');
    logger.info(UserInfo.id)
    return { token, UserInfo };
  },
  OauthGoogleLogin: async (sub, email, name) => {
    const doesEmailExist = await User.doesEmailExist(email);
    let userDetails = {};
    if (doesEmailExist) {
      logger.info('email doesnot exist,creating a user..');
      const username = await generateUniqueUsername(name);
      // create an user for it
      const result = await User.addNewUser({
        username,
        email,
        password: null,
        isoauthuser: true,
        googleid: sub,
      });
      logger.info('user created successfully');
      const newUser = result.rows[0];
      userDetails = {
        id: newUser.public_id,
        username: newUser.username,
        email: newUser.email,
      };
    } else {
      // if email exist check the user if it has isauthuuser or not
      logger.info('user already exist, logging in...');
      const user = await User.getUserByEmail(email);
      if (!user.isoauthuser) {
        logger.warn('not a oauth user');
        throw new CustomError(
          'please login using username and password',
          402,
          'LOCAL_EMAIL'
        );
      }
      userDetails = {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
      };
    }
    const secretkey = process.env.JWT_SECRET_KEY;
    logger.info('setting jwt token');
    const Jwttoken = jwt.sign(userDetails, secretkey, {
      expiresIn: '1h',
    });
    logger.info('jwt token set');

    return { Jwttoken, userDetails };
  },
  verifyEmailService: async (token) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.getVerifyEmailToken(hashedToken);
    logger.info('matching token for email verify..');
    if (!user) {
      logger.warn('invalid verification token');
      throw new CustomError('Invalid verification token', 401, 'TOKEN_EXPIRED');
    }
    // also check an edge case if user is already verified
    const userId = user.id;
    await User.setVerified(userId);
    logger.info('verfied, updated in db');
    logger.info('email verified successfully');
    return { message: 'email verified successfully' };
  },
};

export default authServices;
