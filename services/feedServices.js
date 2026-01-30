import placesModels from '../models/placesModels.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'feed Services');

const feedServices = {
  getImageByLocation: async (longitude, latitude, userPublicId) => {
    logger.info('getting images from database');
    // userid must be public_Id so request and change it to id before use
    const {id:userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const result = await placesModels.getImages(longitude, latitude, userId);
    const data = result.rows;
    logger.info('sorting the images..');
    logger.info('image retrived successful');
    return { data };
  },
}

export default feedServices
