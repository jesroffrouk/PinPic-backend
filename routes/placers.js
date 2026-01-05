import express from 'express';
import multer from 'multer';
import validateMiddlewares from '../middlewares/validateMiddlewares.js';
import placeControllers from '../controllers/placeControllers.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  '/',
  upload.single('image'),
  validateMiddlewares.validateImage,
  validateMiddlewares.validateLocation,
  authMiddleware.requireAuth,
  placeControllers.uploadImage
);

router.get(
  '/all',
  validateMiddlewares.validateLocation,
  authMiddleware.requireAuth,
  placeControllers.getImagesByLocation
);

router.post(
  '/upvotes',
  authMiddleware.requireAuth,
  placeControllers.upvoteImage
);

router.get(
  '/notifications',
  authMiddleware.requireAuth,
  placeControllers.getNotification
)

export default router;
