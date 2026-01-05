import express from 'express';
import authControllers from '../controllers/authControllers.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validateMiddleware from '../middlewares/validateMiddlewares.js';

const router = express.Router();

router.post(
  '/register',
  validateMiddleware.validateEmail,
  validateMiddleware.validateUserCrendentials,
  authMiddleware.blockIfAuth,
  authControllers.registerUser
);
router.post(
  '/login',
  validateMiddleware.validateUserCrendentials,
  authMiddleware.blockIfAuth,
  authControllers.loginUser
);
router.get('/logout', authMiddleware.requireAuth, authControllers.logoutUser);
router.get('/me', authMiddleware.requireAuth, authControllers.getUser);
router.post(
  '/google',
  authMiddleware.blockIfAuth,
  validateMiddleware.validateTokenBygoogleAuth,
  authControllers.LoginWithGoogle
);
router.patch(
  '/verifyemail',
  validateMiddleware.validateVerifyEmailToken,
  authControllers.verifyEmail
);

export default router;
