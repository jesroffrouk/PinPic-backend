import cloudinary from '../config/cloudinary.js';
import placesModels from '../models/placesModels.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';
import { sendNotification } from '../helpers/socket/notification.js';

const logger = createLoggerFor(import.meta.url, 'places Services');

const placesServices = {
  uploadImage: async (userPublicId, captions, longitude, latitude, fileBase64) => {
    //image upload to cloudnary
    logger.info('uploading images to cloudinary');
    const cloudResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: 'uploads',
    });
    logger.info('uploaded to cloudinary');
    logger.info('saving it to db');
    const imgurl = cloudResponse.secure_url;
    // get id from public_id
    const {id: userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    await placesModels.setImages(
      captions,
      imgurl,
      longitude,
      latitude,
      userId
    ).rows;
    // reduce it and only send public_id not id
    logger.info('upload Image successfull');
    return { success: true,message: 'upload image successfull' };
  },
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
  upVoteImage: async (userPublicId, imgPublicId, reactType) => {
    // get id from publicid
    // change imgid to postsId instead --for future
    const {id: userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const {id: imgId} = (await placesModels.getIdFromPublicId('posts',imgPublicId))?.rows[0]
    const doesUpvoteExist = await placesModels.doesUpoteExist(userId, imgId); // expecting object
    if (doesUpvoteExist.rowCount > 0) {
      // update it with react type so match react type if it matches update otherwise don't also check it's is_active
      // matching if current react type is same as before,
      // also need to check if imgid is valid one in db, and can current user authorize to like it or not
      await placesModels.setExistingUpvote(
        doesUpvoteExist.rows[0].id,
        reactType
      );
      logger.info('updated the upvote');
      // notification creation is not working for this section
      return { message: 'updated the upvote reaction', success: true };
    }
    // create a new table for this upvote
    await placesModels.setNewUpvote(userId,imgId,reactType);
    // get author from imgid
    const recipientId = (await placesModels.getUserFromimgid(imgId))?.rows[0].id;
    // create notification
    // using userId as actorId for this call
    const notificationId = await placesModels.createNotification('upvoted',recipientId,userId,{post: imgId});
    // send online notification
    const notData = {
      recipientId,
      notificationId,
      type: 'upvoted'
    }
    await sendNotification(notData)
    logger.info('successfully created new upvote for user');
    return { message: 'sucessfully created upvote for user', success: true };
  },
};

export default placesServices;
