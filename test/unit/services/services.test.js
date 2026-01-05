import { beforeEach, describe, expect, it, vi } from 'vitest';
import authServices from '../../../services/authServices.js';

vi.mock('../../../models/userModels.js', () => ({
  default: {
    addNewUser: vi.fn(),
    doesUserExist: vi.fn(),
    getUserByUsername: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('../../../helpers/mailers/sendMail.js', () => ({
  default: vi.fn(),
}));

vi.mock('../../../utils/generateVerifyTokens.js', () => ({
  default: vi.fn(),
}));

vi.mock('jsonwebtoken', {
  sign: vi.fn(),
});

import User from '../../../models/userModels.js';
import bcrypt from 'bcrypt';

// Import mocks AFTER defining vi.mock()
import generateVerifyTokens from '../../../utils/generateVerifyTokens.js';
import sendMail from '../../../helpers/mailers/sendMail.js';
import jwt from 'jsonwebtoken';

describe('registerUser()', () => {
  const input = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
  };

  const expectedCallTest = () => {
    expect(User.doesUserExist).toHaveBeenCalledWith(
      'testuser',
      'test@example.com'
    );
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(User.addNewUser).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashpass123',
      isoauthuser: false,
      googleid: null,
      verifyEmailToken: 'hashed123',
    });
    expect(sendMail).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: 'raw123',
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    User.doesUserExist.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('hashpass123');
    generateVerifyTokens.mockReturnValue({
      rawToken: 'raw123',
      hashedToken: 'hashed123',
    });
    User.addNewUser.mockResolvedValue(true);
    sendMail.mockResolvedValue(true);
  });

  // default arrangements

  it('should be registered', async () => {
    // Act
    const result = await authServices.registerUser(
      input.email,
      input.username,
      input.password
    );

    // Assert
    expectedCallTest();

    expect(result).toEqual({ message: 'user registered Successfully' });
  });

  it('should throw custom error for duplicate user', async () => {
    User.doesUserExist.mockResolvedValue(true);
    await expect(
      authServices.registerUser(input.email, input.username, input.password)
    ).rejects.toMatchObject({
      message: 'User Already Exist',
      statusCode: 401,
      errorCode: 'USER_EXIST',
    });
    expect(User.doesUserExist).toHaveBeenCalledWith(
      'testuser',
      'test@example.com'
    );
  });

  it('should throw custom error for email verifcation error', async () => {
    User.doesUserExist.mockResolvedValue(false);
    sendMail.mockResolvedValue({ error: {} }); // just used empty object to show error occured

    await expect(
      authServices.registerUser(input.email, input.username, input.password)
    ).rejects.toMatchObject({
      message: 'verfication Mail send failed',
      statusCode: 400,
    });
    expectedCallTest();
  });
});

//  edge cases for login
describe('loginUser()', () => {
  const input = {
    username: 'testuser',
    password: 'password123',
  };
  const UserInfo = {
    id: 2,
    username: 'testuser',
    email: 'test@user.com',
  };
  const secretkey = process.env.JWT_SECRET_KEY;

  beforeEach(() => {
    vi.clearAllMocks();

    User.getUserByUsername.mockResolvedValue({
      rows: [
        {
          username: 'testuser',
          email: 'test@user.com',
          password: 'hashpass123',
          isoauthuser: false,
          id: 2,
        },
      ],
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('jwttoken123');
  });

  const expectedCallTest = () => {
    expect(User.getUserByUsername).toHaveBeenCalledWith('testuser');
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashpass123');
    expect(jwt.sign).toHaveBeenCalledWith(UserInfo, secretkey, {
      expiresIn: '1h',
    });
  };
  // happy test
  it('should have logged in', async () => {
    // act
    const result = await authServices.loginUser(input.username, input.password);

    // assert
    expectedCallTest();
    expect(result).toEqual({ token: 'jwttoken123', UserInfo });
  });
  // error test + edge cases
  it('should return error for oauthuser registered accounts', async () => {
    User.getUserByUsername.mockResolvedValue({
      rows: [
        {
          username: 'testuser',
          password: 'hashpass123',
          isoauthuser: true,
          id: 2,
        },
      ],
    });
    await expect(authServices.loginUser(input.username)).rejects.toMatchObject({
      message: 'please sign in through google',
      statusCode: 402,
      errorCode: 'GOOGLE_REGISTERED',
    });
    expect(User.getUserByUsername).toHaveBeenCalledWith('testuser');
  });

  // no result
  it('should return error for not registered accounts', async () => {
    // arrange
    User.getUserByUsername.mockResolvedValue({
      rows: [],
    });
    //  assert
    await expect(authServices.loginUser(input.username)).rejects.toMatchObject({
      message: 'user doesnot exist',
      statusCode: 402,
      errorCode: 'USER_NOT_EXIST',
    });
    expect(User.getUserByUsername).toHaveBeenCalledWith('testuser');
  });
  // password didnot match
  it('should return error for wrong password', async () => {
    // arrange
    User.getUserByUsername.mockResolvedValue({
      rows: [
        {
          username: 'testuser',
          password: 'hashpass123',
          isoauthuser: false,
          id: 2,
        },
      ],
    });
    bcrypt.compare.mockResolvedValue(false);
    //  assert
    await expect(authServices.loginUser(input.username)).rejects.toMatchObject({
      message: 'incorrect password',
      statusCode: 400,
      errorCode: 'INCORRECT_PASSWORD',
    });
    expect(User.getUserByUsername).toHaveBeenCalledWith('testuser');
  });
});

// OauthGoogleLogin
describe('OauthGoogleLogin()', () => {
  // happy path
  it('should be logged in successfully',()=>{
    // list dependencies
    // list act
    // list assert
  })
})

// verifyEmailService
describe('verifyEmailService()', () => {
  // happy path
  it('should be logged in successfully',()=>{
    // list dependencies
    // list act
    // list assert
  })
})