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
  placeControllers.getAllImagesByLocation
);
router.get(
  '/story',
  validateMiddlewares.validateLocation,
  authMiddleware.requireAuth,
  placeControllers.getImageById
);

router.post(
  '/upvotes',
  authMiddleware.requireAuth,
  placeControllers.upvoteImage
);

router.get(
  '/comments',
  authMiddleware.requireAuth,
  placeControllers.getComments
);
router.post(
  '/comments',
  authMiddleware.requireAuth,
  placeControllers.setComment
);

router.post(
  '/visitors',
  authMiddleware.requireAuth,
  placeControllers.setVisitors
);

router.get(
  '/notifications',
  authMiddleware.requireAuth,
  placeControllers.getNotification
)

router.get(
    '/place',
    authMiddleware.requireAuth,
    placeControllers.getLocationName
)

router.post('/collection',
    authMiddleware.requireAuth,
    placeControllers.setCollection
)

router.get('/collection',
    authMiddleware.requireAuth,
    placeControllers.getCollection
    )
    

export default router;
