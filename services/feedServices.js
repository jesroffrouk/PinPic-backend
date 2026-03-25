import placesModels from '../models/placesModels.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'feed Services');

const feedServices = {
  getAllImagesByLocation: async (longitude, latitude) => {
    logger.info('get all images by location services started..');
    // userid must be public_Id so request and change it to id before use
    const result = await placesModels.getAllImagesByLocation(longitude, latitude);
    const data = result.rows;
    console.log(data)
    logger.info('sorting the images..');
    logger.info('image retrived successful');
    return { data };
  },
  getImageById: async (longitude, latitude, userPublicId,postPublicId) => {
    logger.info('getting specific image by id');
    // userid must be public_Id so request and change it to id before use
    const {id:userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const {id:postId} = (await placesModels.getIdFromPublicId('posts',postPublicId))?.rows[0]
    // don't use location if you want to show it to user or let them save it so that they can read it anywhere they want
    const result = await placesModels.getImageById(longitude,latitude,userId,postId);
    const data = result.rows[0];
    logger.info('image retrived successful');
    return { data };
  },
}

export default feedServices
