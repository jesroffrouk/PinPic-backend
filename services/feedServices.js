import placesModels from '../models/placesModels.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';
import { generateSignedUrl, generateSignedUrlMultiple } from '../utils/generateSignedUrl.js';

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
        // generateSignedUrl for it
        let signedUrlPosts;

        if (result.length > 0) {
            signedUrlPosts = generateSignedUrlMultiple(result) 
            }
        return {
                success: true,
                message: 'next getAllImagesByLocation successful',
                data: {
                    posts: signedUrlPosts,
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
        let signedUrlPosts;

        if (result.length > 0) {
            signedUrlPosts = generateSignedUrlMultiple(result)
            }

        // generateSignedUrl for it
        logger.info('image retrieved successful');
        return {
                success: true,
                message: 'Image retrieved successful',
                data: {
                    posts: signedUrlPosts,
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
    // handle if it's empty no need to change.
    // generateSignedUrl
    let signedUrldata;
    if (data) {
    signedUrldata = {
        ...data, imgurl: generateSignedUrl(data.imgurl)
        }
        }
    logger.info('image retreived successful');
    return { 
            success: true,
            message: 'Image retrieved successful',
            data: signedUrldata
        };
  },
}

export default feedServices
