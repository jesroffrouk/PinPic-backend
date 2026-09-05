import { PrismaClient } from './generated/prisma/client.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import generateVerifyTokens from './utils/generateVerifyTokens.js';
import { generateUniqueUsername } from './utils/usernameGenerator.js';
import { createLoggerFor } from './helpers/loggers/loggers.js';
import jwt from 'jsonwebtoken';
import createHelperRepository from './models/helper.model.js';
import db from './config/db/conn.js';
import cloudinary from './config/cloudinary.js';

const authLogger = createLoggerFor(import.meta.url, 'auth service');
const profileLogger = createLoggerFor(import.meta.url, 'profile service');

import createUserRepository from './models/userModels.js';
import createAuthServices from './services/authServices.js';
import createProfileServices from './services/profileServices.js';

const prisma = new PrismaClient();

const userRepository = createUserRepository({ prisma });
const helperRepository = createHelperRepository({ db });
export const authServices = createAuthServices({
  userRepository,
  helperRepository,
  jwt,
  bcrypt,
  crypto,
  generateVerifyTokens,
  generateUniqueUsername,
  logger: authLogger,
});

export const profileServices = createProfileServices({
  userRepository,
  helperRepository,
  logger: profileLogger,
  cloudinary
});
