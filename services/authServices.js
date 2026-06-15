// import sendMail from '../helpers/mailers/sendMail.js';
import 'dotenv/config';
import CustomError from '../utils/CustomError.js';

function createAuthServices({
  userRepository,
  helperRepository,
  jwt,
  bcrypt,
  crypto,
  generateVerifyTokens,
  generateUniqueUsername,
  logger,
}) {
  return {
    registerUser: async (email, username, password) => {
      const isUserExist = await userRepository.doesUserExist(username, email);
      if (isUserExist) {
        logger.warn('username or email already exist!!');
        throw new CustomError('User Already Exist', 401, 'USER_EXIST');
      }
      const hashPassword = await bcrypt.hash(password, 10);
      // verify email send
      logger.info('generating token..');

      //eslint-disable-next-line no-unused-vars
      const { rawToken: _rawToken, hashedToken } = generateVerifyTokens();
      // also find a way to verify that email is also valid email.
      await userRepository.addNewUser({
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
      const user = await userRepository.getUserByUsername(username);
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
      logger.info('use successfully retrived from db');
      const hashPassword = user.password;
      logger.info('matching password...');
      const match = bcrypt.compare(password, hashPassword);
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
      logger.info(UserInfo.id);
      return { token, UserInfo };
    },
    OauthGoogleLogin: async (sub, email, name) => {
      // this need proper testing
      const doesEmailExist = await userRepository.doesEmailExist(email);
      let userDetails = {};
      if (!doesEmailExist) {
        logger.info('email doesnot exist,creating a user..');
        const username = await generateUniqueUsername(name);
        // create an user for it
        const newUser = await userRepository.addNewUser({
          username,
          email,
          password: null,
          isoauthuser: true,
          googleid: sub,
        });
        logger.info('user created successfully');
        userDetails = {
          id: newUser.public_id,
          username: newUser.username,
          email: newUser.email,
        };
      } else {
        // if email exist check the user if it has isauthuuser or not
        logger.info('user already exist, logging in...');
        const user = await userRepository.getUserByEmail(email);
        if (!user.isoauthuser) {
          logger.warn('not a oauth user');
          throw new CustomError(
            'please login using username and password',
            402,
            'LOCAL_EMAIL'
          );
        }
        userDetails = {
          id: user.public_id.toString(),
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
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await userRepository.getVerifyEmailToken(hashedToken);
      logger.info('matching token for email verify..');
      if (!user) {
        logger.warn('invalid verification token');
        throw new CustomError(
          'Invalid verification token',
          401,
          'TOKEN_EXPIRED'
        );
      }
      // also check an edge case if user is already verified
      const userId = user.id;
      await userRepository.setVerified(userId);
      logger.info('verfied, updated in db');
      logger.info('email verified successfully');
      return { message: 'email verified successfully' };
    },
    getUserProfile: async (userPublicId) => {
      logger.info('getting id from publicId');
      const userResult = await helperRepository.getIdFromPublicId(
        'users',
        userPublicId
      );
      const userId = userResult?.rows[0]?.id;

      if (!userId) {
        logger.warn(`User publicId ${userPublicId} doesn't found`);
        throw new CustomError(
          `user with publicId: ${userPublicId} not found`,
          404,
          'USER NOT FOUND'
        );
      }
      const user = await userRepository.getUserProfile(userId);
      return user;
    },
  };
}

export default createAuthServices;
