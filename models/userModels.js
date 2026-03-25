import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'user repository');

function createUserRepository({prisma}){
    return {
      async doesEmailExist(email){
        logger.info('checking db if user exist..');
        // return await db.query(
        //   `SELECT EXISTS ( SELECT 1 FROM users WHERE email = $1)`,
        //   [email]
        // );
        return await prisma.users.findFirst({
          where: { email: email },
          select: { id: true },
        });
      },
     async doesUserExist(username, email){
        logger.info('checking db if user exist..');
        // return await db.query(
        //   `SELECT EXISTS ( SELECT 1 FROM users WHERE username = $1 OR email = $2 );`,
        //   [username, email]
        // );
        return await prisma.users.findFirst({
          where: {
            OR: [{ username: username }, { email: email }],
          },
          select: { id: true },
        });
      },
      async addNewUser ({
        username,
        email,
        password,
        isoauthuser,
        googleid,
        verifyEmailToken,
      }){
        logger.info('adding new user to db');
        // return await db.query(
        //   `INSERT INTO users (username,email,password,isoauthuser,googleid,verify_email_token) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`,
        //   [username, email, password, isoauthuser, googleid, verifyEmailToken]
        // );
        return await prisma.users.create({
          data: {
            username,
            email,
            password,
            isoauthuser,
            googleid,
            verify_email_token: verifyEmailToken,
          },
          select: { id: true },
        });
      },
      async getUserByUsername(username){
        logger.info('getting user by username..');
        // return await db.query(`SELECT * FROM users WHERE username = $1;`, [
        //   username,
        // ]);
        return await prisma.users.findUnique({
          where: { username },
          select: {
            public_id: true,
            username: true,
            email: true,
            password: true,
            isoauthuser: true,
          },
        });
      },
      async getUserByEmail(email){
        logger.info('getting user by email..');
        // return await db.query(`SELECT * FROM users WHERE email = $1`, [email]);
        return await prisma.users.findUnique({
          where: { email },
          select: {
            id: true,
            username: true,
            email: true,
            isoauthuser: true,
          },
        });
      },
      async getVerifyEmailToken(token){
        logger.info('getting verify email token from db..');
        // return await db.query(
        //   `SELECT * FROM users WHERE verify_email_token = $1 AND verify_email_token_expiry > NOW()`,
        //   [token]
        // );
        return await prisma.users.findFirst({
          where: {
            verify_email_token: token,
            verify_email_token_expiry: { gt: new Date() },
          },
          select: { id: true },
        });
      },
      async setVerified(userId){
        logger.info('updating is_verified in db..');
        // return await db.query(
        //   `UPDATE users SET is_verified = true, verify_email_token = NULL, verify_email_token_expiry = NULL WHERE verify_email_token = $1`,
        //   [token]
        // );
        return await prisma.users.update({
          where: { id: userId },
          data: {
            is_verified: true,
            verify_email_token: null,
            verify_email_token_expiry: null,
          },
        });
      },
      async getUserProfile(userId){
        logger.info('getting user profile info from database');
        return await prisma.users.findUnique({
          where: { id: userId },
          select: {
            username: true,
            email: true,
            bio: true,
            profile_url: true
          },
        });
    }
  }
}

export default createUserRepository;
