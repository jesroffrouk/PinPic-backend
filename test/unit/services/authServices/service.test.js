import { beforeEach, describe, expect, it, vi } from 'vitest';
import createAuthServices from '../../../services/authServices';

let fakeLogger;
let fakeBcrypt;
let fakeVerifyTokens;
let fakeRepo;
let fakeJwt;
let fakeCrypto;
let fakeGenerateUniqueUsername;
let authServices;
let fakeHelperRepository;

describe('registerUser()', () => {
  const input = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
  };
    beforeEach(()=> {
       fakeLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        }
        fakeBcrypt = {
            hash: vi.fn()
        }
        fakeVerifyTokens = vi.fn().mockReturnValue({
          rawToken: 'raw123',
          hashedToken: 'hashed123',
        })
        fakeRepo = {
                doesUserExist: vi.fn(),
                addNewUser: vi.fn()
            }

        authServices = createAuthServices({
                userRepository: fakeRepo,
                helperRepository: fakeHelperRepository,
                jwt: fakeJwt,
                bcrypt: fakeBcrypt,
                crypto: fakeCrypto,
                generateVerifyTokens: fakeVerifyTokens,
                generateUniqueUsername: fakeGenerateUniqueUsername,
                logger: fakeLogger
            })
        })

  it('should be registered', async () => {
    fakeRepo.doesUserExist.mockResolvedValue(false)
    // Act
    const result = await authServices.registerUser(
      input.email,
      input.username,
      input.password
    );

    // Assert
    // expectedCallTest();

    expect(result).toEqual({ message: 'user registered Successfully' });
  });

  it('should throw custom error for duplicate user', async () => {
    fakeRepo.doesUserExist.mockResolvedValue(true)
    await expect(
      authServices.registerUser(input.email, input.username, input.password)
    ).rejects.toMatchObject({
      message: 'User Already Exist',
      statusCode: 401,
      errorCode: 'USER_EXIST',
    });
    expect(fakeRepo.doesUserExist).toHaveBeenCalledWith(
      'testuser',
      'test@example.com'
    );
  });

})

//  edge cases for login
describe('loginUser()', () => {
  const input = {
    username: 'testuser',
    password: 'password123',
  };
  const UserInfo = {
    id: 2234,
    username: 'testuser',
    email: 'test@user.com',
  };

    beforeEach(()=> {
        fakeLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
        }
        fakeBcrypt = {
            compare: vi.fn().mockReturnValue(true)
        }
        fakeJwt = {
            sign: vi.fn().mockReturnValue('jwttoken123')
            }
        fakeRepo = {
                getUserByUsername: vi.fn().mockResolvedValue(
                    {
                      username: 'testuser',
                      email: 'test@user.com',
                      password: 'hashpass123',
                      isoauthuser: false,
                      id: 2,
                      public_id: 2234,
                    },
                ),
            }

         authServices = createAuthServices({
                userRepository: fakeRepo,
                helperRepository: fakeHelperRepository,
                jwt: fakeJwt,
                bcrypt: fakeBcrypt,
                crypto: {},
                generateVerifyTokens: {},
                generateUniqueUsername: {},
                logger: fakeLogger,
                
            })
    })

  // happy test
  it('should have logged in', async () => {
    // act
    const result = await authServices.loginUser(input.username, input.password);
    const secretkey = process.env.JWT_SECRET_KEY

    // assert
    expect(fakeRepo.getUserByUsername).toHaveBeenCalledWith('testuser');
    expect(fakeBcrypt.compare).toHaveBeenCalledWith('password123', 'hashpass123');
    expect(fakeJwt.sign).toHaveBeenCalledWith(UserInfo, secretkey, {
      expiresIn: '1h',
    });
    expect(result).toEqual({ token: 'jwttoken123', UserInfo });
  });

  // error test + edge cases
  it('should return error for oauthuser registered accounts', async () => {
        fakeRepo.getUserByUsername.mockResolvedValue(
            {
              username: 'testuser',
              password: 'hashpass123',
              isoauthuser: true,
              id: 2,
              public_id: 2,
            },

        )
   await expect(authServices.loginUser(input.username)).rejects.toMatchObject({
      message: 'please sign in through google',
      statusCode: 402,
      errorCode: 'GOOGLE_REGISTERED',
    });
    expect(fakeRepo.getUserByUsername).toHaveBeenCalledWith('testuser');
  });

  // no result
  it('should return error for not registered accounts', async () => {
    fakeRepo.getUserByUsername.mockResolvedValue()
    await expect(authServices.loginUser(input.username)).rejects.toMatchObject({
      message: 'user doesnot exist',
      statusCode: 401,
      errorCode: 'USER_NOT_EXIST',
    });
    expect(fakeRepo.getUserByUsername).toHaveBeenCalledWith('testuser');
  });

  // password didnot match
  it('should return error for wrong password', async () => {
    fakeRepo.getUserByUsername.mockResolvedValue({
              username: 'testuser',
              password: 'hashpass123',
              isoauthuser: false,
              id: 2,
              public_id: 2,

        })
    fakeBcrypt.compare.mockReturnValue(false)
    await expect(authServices.loginUser(input.username)).rejects.toMatchObject({
      message: 'incorrect password',
      statusCode: 400,
      errorCode: 'INCORRECT_PASSWORD',
    });
    expect(fakeRepo.getUserByUsername).toHaveBeenCalledWith('testuser');
  });
});

 // OauthGoogleLogin
 describe('OauthGoogleLogin()', () => {
    const input = {
            sub: "icandothis",
            email: "jaws@gmail.com",
            name: "testuser"
        }
    let userDetails = {
            id: "231",
            username: "testuser",
            email: "jaws@gmail.com",
            isoauthuser: true,
            public_id: "231"
        }
    beforeEach(()=> {
        fakeLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn()
            }

        fakeRepo = {
                doesEmailExist: vi.fn().mockResolvedValue(true),
                addNewUser: vi.fn().mockResolvedValue(userDetails),
                getUserByEmail: vi.fn().mockResolvedValue(userDetails)
            }
        fakeJwt = {
                sign: vi.fn().mockReturnValue("jwttoken123")
            }

        // callling
        authServices = createAuthServices({
                userRepository: fakeRepo,
                helperRepository: fakeHelperRepository,
                jwt: fakeJwt,
                bcrypt: {},
                crypto: {},
                generateVerifyTokens: {},
                generateUniqueUsername: vi.fn().mockResolvedValue("testuser1"),
                logger: fakeLogger,
            })
    })
   // happy path
    
   it('should be logged in successfully',async()=>{
        const result = await authServices.OauthGoogleLogin(input.sub,input.email,input.name)
        
        expect(result).toEqual({
                Jwttoken: "jwttoken123",
                userDetails: {
                    id: "231",
                    username: "testuser",
                    email: "jaws@gmail.com"
                }
            })
        // list of expected calls
        expect(fakeRepo.doesEmailExist).toBeCalledWith(input.email)
        expect(fakeRepo.addNewUser).not.toBeCalledWith({
                username: "testuser1",
                email: input.email,
                password: null,
                isoauthuser: true,
                googleid: input.sub
            })
        expect(fakeRepo.getUserByEmail).toBeCalledWith(input.email)
   })
    // handle second case what if user already exist
   it('should be logged in successfully as new user',async()=>{
        fakeRepo.doesEmailExist.mockResolvedValue(false)
        fakeJwt.sign.mockReturnValue("jwttoken123")

        // callling
        const result = await authServices.OauthGoogleLogin(input.sub,input.email,input.name)
        
        expect(result).toEqual({
                Jwttoken: "jwttoken123",
                userDetails: {
                    id: "231",
                    username: "testuser",
                    email: "jaws@gmail.com"
                }
            })
        // list of expected calls
        expect(fakeRepo.doesEmailExist).toBeCalledWith(input.email)
        expect(fakeRepo.addNewUser).toBeCalledWith({
                username: "testuser1",
                email: input.email,
                password: null,
                isoauthuser: true,
                googleid: input.sub
            })
        expect(fakeRepo.getUserByEmail).not.toBeCalledWith(input.email)
   })

   it('should throw an error for not being oauthuser',async()=>{
        userDetails = {
                id: "231",
                username: "testuser",
                email: "jaws@gmail.com",
                isoauthuser: false,
                public_id: "231"
            }
        fakeRepo.doesEmailExist.mockResolvedValue(true)
        fakeRepo.addNewUser.mockResolvedValue(userDetails)
        fakeRepo.getUserByEmail.mockResolvedValue(userDetails)
        fakeJwt.sign.mockReturnValue("jwttoken123")

        // callling
        await expect(authServices.OauthGoogleLogin(input.sub,input.email,input.name)
        ).rejects.toMatchObject({
              message: 'please login using username and password',
              statusCode: 402,
              errorCode: 'LOCAL_EMAIL',
            })
        // list of expected calls
        expect(fakeRepo.doesEmailExist).toBeCalledWith(input.email)
        expect(fakeRepo.addNewUser).not.toBeCalledWith({
                username: "testuser1",
                email: input.email,
                password: null,
                isoauthuser: true,
                googleid: input.sub
            })
        expect(fakeRepo.getUserByEmail).toBeCalledWith(input.email)
   })

    // getUserProfile 
    describe('getUserProfile()',()=>{
        const userPublicId = 'skfsdlfjsdfsdf'
        let userDetails = {
            id: '312',
            public_id: '321',
            username: 'jake',
            email: 'ja@gmail.com',
        }

        beforeEach(()=> {
            fakeHelperRepository = {
                getIdFromPublicId: vi.fn().mockReturnValue({
                    rows: [
                        {
                            id: '312'
                        }
                    ]
                })
            }            
            fakeRepo = {
                getUserProfile: vi.fn().mockReturnValue(userDetails)
            }
        })

        it('should return user details successfully',async() => {
            let authServices = createAuthServices({
                userRepository: fakeRepo,
                helperRepository: fakeHelperRepository,
                jwt: {},
                bcrypt: {},
                crypto: {},
                generateVerifyTokens: {},
                generateUniqueUsername: {},
                logger: fakeLogger,

            })
            const result = await authServices.getUserProfile(userPublicId)
            expect(result).toEqual({
                "message": "user profile info retrieved successfully",
                "success": true,
                "userDetails": userDetails
            })
            expect(fakeHelperRepository.getIdFromPublicId).toBeCalledWith("users",userPublicId)
            expect(fakeRepo.getUserProfile).toBeCalledWith('312')
        })

    })


 })



 // verifyEmailService
//  describe('verifyEmailService()', () => {
//    // happy path
//    it('should be logged in successfully',()=>{
//    })



