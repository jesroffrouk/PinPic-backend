import cloudinary from '../config/cloudinary.js';
import placesModels from '../models/placesModels.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';
import { sendNotification } from '../helpers/socket/notification.js';

const logger = createLoggerFor(import.meta.url, 'places Services');

const placesServices = {
  uploadImage: async (userid, captions, longitude, latitude, fileBase64) => {
    //image upload to cloudnary
    logger.info('uploading images to cloudinary');
    const cloudResponse = await cloudinary.uploader.upload(fileBase64, {
      folder: 'uploads',
    });
    logger.info('uploaded to cloudinary');
    logger.info('saving it to db');
    const imgurl = cloudResponse.secure_url;
    const result = await placesModels.setImages(
      captions,
      imgurl,
      longitude,
      latitude,
      userid
    ).rows;
    logger.info('upload Image successfull');
    return { result };
  },
  getImageByLocation: async (longitude, latitude, userid) => {
    logger.info('getting images from database');
    const result = await placesModels.getImages(longitude, latitude, userid);
    const data = result.rows;
    logger.info('sorting the images..');
    logger.info('image retrived successful');
    return { data };
  },
  upVoteImage: async (userid, imgid, react_type) => {
    const doesUpvoteExist = await placesModels.doesUpoteExist(userid, imgid); // expecting object
    if (doesUpvoteExist.rowCount > 0) {
      // update it with react type so match react type if it matches update otherwise don't also check it's is_active
      // matching if current react type is same as before,
      // also need to check if imgid is valid one in db, and can current user authorize to like it or not
      await placesModels.setExistingUpvote(
        doesUpvoteExist.rows[0].id,
        react_type
      );
      logger.info('updated the upvote');
      // notification creation is not working for this section
      return { message: 'updated the upvote reaction', success: true };
    }
    // create a new table for this upvote
    await placesModels.setNewUpvote(userid, imgid, react_type);
    // get author from imgid
    const recipient_id = (await placesModels.getUserFromimgid(imgid)).rows[0].id;
    // create notification
    const notification = {
      type: 'like',
      recipient_id: recipient_id,
      actor_id: userid,
      metaData: {
        post: imgid,
      },
    };
    const notificationId = await placesModels.createNotification(notification);
    // send online notification
    const notData = {
      recipient_id,
      notificationId,
      type: notification.type
    }
    await sendNotification(notData)
    logger.info('successfully created new upvote for user');
    return { message: 'sucessfully created upvote for user', success: true };
  },
};

export default placesServices;
