import cloudinary from '../config/cloudinary.js';
import placesModels from '../models/placesModels.js';
import CustomError from '../utils/CustomError.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'upload Services');

const uploadServices = {
  uploadImage: async (
    userPublicId,
    title,
    longitude,
    latitude,
    fileBase64,
    content
  ) => {
    //image upload to cloudnary
    logger.info('uploading images to cloudinary');
    const cloudResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: 'uploads',
      type: 'authenticated',
    });
    logger.info('uploaded to cloudinary');
    logger.info('saving it to db');
    const imgurl = cloudResponse.public_id;
    // get id from public_id
    const { id: userId } =
      (await placesModels.getIdFromPublicId('users', userPublicId))?.rows[0] ??
      {};

    if (!userId) {
      logger.warn(`Users with publicId: ${userPublicId} doesn't exist`);
      throw new CustomError(
        `Users with publicId: ${userPublicId} doesn't exist`,
        404,
        'USER NOT FOUND'
      );
    }

    await placesModels.setImages(
      title,
      content,
      imgurl,
      longitude,
      latitude,
      userId
    ).rows;
    // reduce it and only send public_id not id
    logger.info('upload Image successfull');
    return { success: true, message: 'Upload Image successful', data: null };
  },
};

export default uploadServices;
