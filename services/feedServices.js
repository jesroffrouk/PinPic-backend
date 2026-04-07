import placesModels from '../models/placesModels.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'feed Services');

const feedServices = {
  getAllImagesByLocation: async (createdAt,postPublicId,location) => {
    logger.info('get all images by location services started..');
    if (createdAt && postId) {
        const {id:postId} = (await placesModels.getIdFromPublicId('posts',postPublicId))?.rows[0]
        const result = (await placesModels.getAllImagesByLocationNext(createdAt,postId,location.longitude,location.latitude))?.rows
        let hasMore = false
        if (result.rowCount > 10)  {
                hasMore = true
                result.pop()
            }
        const lastItem = result.at(-1)
        return {
                success: true,
                message: 'next getAllImagesByLocation successful',
                data: {
                    posts: result,
                    nextCursor: {
                        created_at: lastItem?.created_at,
                        id: lastItem?.id
                    }
                }
            }

        }
    else {
        // first time
        const result = (await placesModels.getAllImagesByLocationFirst(location.longitude,location.latitude))?.rows;
        let hasMore = false
        if (result.rowCount > 10) {
                hasMore = true
                result.pop()
            }
        const lastItem = result.at(-1)
        logger.info('image retrieved successful');
        return {
                success: true,
                message: 'Image retrieved successful',
                data: {
                    posts: result,
                    nextCursor: {
                        created_at: lastItem?.created_at,
                        id: lastItem?.id
                    }
                }
            };
        }
  },
  getImageById: async (longitude, latitude, userPublicId,postPublicId) => {
    logger.info('getting specific image by id');
    // userid must be public_Id so request and change it to id before use
    const {id:userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const {id:postId} = (await placesModels.getIdFromPublicId('posts',postPublicId))?.rows[0]
    // don't use location if you want to show it to user or let them save it so that they can read it anywhere they want
    const result = await placesModels.getImageById(longitude,latitude,userId,postId);
    const data = result.rows[0];
    logger.info('image retreived successful');
    return { 
            success: true,
            message: 'Image retrieved successful',
            data: data
        };
  },
}

export default feedServices
