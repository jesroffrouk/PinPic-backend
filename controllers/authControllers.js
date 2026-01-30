import catchAsync from '../utils/catchAsync.js';
import authServices from '../services/authServices.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'auth controlller service');

const authControllers = {
  registerUser: catchAsync(async (req, res) => {
    logger.info('register user started..');
    const { email, username, password } = req.body;
    const result = await authServices.registerUser(email, username, password);
    logger.info('user registered successfully');
    res.status(201).json(result);
  }),

  loginUser: catchAsync(async (req, res) => {
    logger.info('login user started..');
    const { username, password } = req.body;
    const { token, UserInfo } = await authServices.loginUser(
      username,
      password
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 60 * 60 * 1000,
    });
    logger.info('user registered successfully, cookie sent');
    res.status(201).json({ user: UserInfo, message: 'successfully logged in',success: true});
  }),

  logoutUser: catchAsync(async (req, res) => {
    logger.info('logout user started..');
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
    });
    logger.info('user logged out successfully');
    return res.status(201).json({message: "user logged out successfully"});
  }),
  getUser: catchAsync(async (req, res) => {
    logger.info('getting user...');
    const userDetails = req.user;
    logger.info('user retrived successfully');
    res
      .status(201)
      .json({user: userDetails, success: true, message: 'user data retrived successfully' });
  }),

  LoginWithGoogle: catchAsync(async (req, res) => {
    logger.info('loginwith google oauth started..');
    const { sub, email, name } = req.user;
    const { Jwttoken, userDetails } = await authServices.OauthGoogleLogin(
      sub,
      email,
      name
    );
    res.cookie('token', Jwttoken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 60 * 60 * 1000,
    });
    logger.info('successfully logged in');
    return res
      .status(201)
      .json({ user: userDetails, message: 'successfully logged in' });
  }),

  verifyEmail: catchAsync(async (req, res) => {
    logger.info('verify email started...');
    const token = req.query.token;
    const result = await authServices.verifyEmailService(token);
    logger.info('email verified successfully');
    res.status(201).json(result);
  }),
};

export default authControllers;
