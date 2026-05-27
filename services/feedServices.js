import placesModels from '../models/placesModels.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';
import {
  generateSignedUrl,
  generateSignedUrlMultiple,
} from '../utils/generateSignedUrl.js';
import CustomError from '../utils/CustomError.js';

const logger = createLoggerFor(import.meta.url, 'feed Services');

const feedServices = {
  getAllImagesByLocation: async (createdAt, postPublicId, location) => {
    logger.info('get all images by location services started..');
    if (createdAt && postPublicId) {
      const postResult = await placesModels.getIdFromPublicId(
        'posts',
        postPublicId
      );
      const postId = postResult?.rows[0];

      if (!postId) {
        logger.warn(`Posts publicId ${postPublicId} doesn't found`);
        throw new CustomError(
          `Posts with publicId: ${postPublicId} not found`,
          404,
          'POST NOT FOUND'
        );
      }

      const result = (
        await placesModels.getAllImagesByLocationNext(
          createdAt,
          postId,
          location.longitude,
          location.latitude
        )
      )?.rows;
      let hasMore = false;
      if (result.rowCount > 10) {
        hasMore = true;
        result.pop();
      }
      const lastItem = result.length > 0 ? result.at(-1) : null;
      // generateSignedUrl for it
      let signedUrlPosts;

      if (result.length > 0) {
        signedUrlPosts = generateSignedUrlMultiple(result);
      }
      // todo: find why you don't have hasMore in here
      return {
        success: true,
        message: 'next getAllImagesByLocation successful',
        data: {
          posts: signedUrlPosts,
          hasMore: hasMore,
          nextCursor: lastItem
            ? {
                created_at: lastItem.created_at,
                id: lastItem.id,
              }
            : null,
        },
      };
    } else {
      // first time
      const result =
        (
          await placesModels.getAllImagesByLocationFirst(
            location.longitude,
            location.latitude
          )
        )?.rows ?? [];
      let hasMore = false;
      if (result.rowCount > 10) {
        hasMore = true;
        result.pop();
      }
      const lastItem = result.length > 0 ? result.at(-1) : null;
      let signedUrlPosts;

      if (result.length > 0) {
        signedUrlPosts = generateSignedUrlMultiple(result);
      }

      // generateSignedUrl for it
      logger.info('image retrieved successful');
      // todo: why no hasMore in return
      return {
        success: true,
        message: 'Image retrieved successful',
        data: {
          posts: signedUrlPosts,
          hasMore: hasMore,
          nextCursor: lastItem
            ? {
                created_at: lastItem.created_at,
                id: lastItem.id,
              }
            : null,
        },
      };
    }
  },
  getImageById: async (longitude, latitude, userPublicId, postPublicId) => {
    logger.info('getting specific image by id');
    // userid must be public_Id so request and change it to id before use
    const { id: userId } =
      (await placesModels.getIdFromPublicId('users', userPublicId))?.rows[0] ??
      {};
    if (!userId) {
      logger.warn(`User with PublicId: ${userPublicId} doesn't exist`);
      throw new CustomError(
        `User with PublicId: ${userPublicId} doesn't exist`,
        404,
        'USER NOT FOUND'
      );
    }
    const { id: postId } =
      (await placesModels.getIdFromPublicId('posts', postPublicId))?.rows[0] ??
      {};

    if (!postId) {
      logger.warn(`Posts with PublicId: ${postPublicId} doesn't exist`);
      throw new CustomError(
        `Posts with PublicId: ${postPublicId} doesn't exist`,
        404,
        'POST NOT FOUND'
      );
    }
    // don't use location if you want to show it to user or let them save it so that they can read it anywhere they want
    const result = await placesModels.getImageById(
      longitude,
      latitude,
      userId,
      postId
    );
    const data = result.rows[0];
    // handle if it's empty no need to change.
    // generateSignedUrl
    let signedUrldata;
    if (data) {
      signedUrldata = {
        ...data,
        imgurl: generateSignedUrl(data.imgurl),
      };
    }
    logger.info('image retreived successful');
    return {
      success: true,
      message: 'Image retrieved successful',
      data: signedUrldata,
    };
  },
};

export default feedServices;
