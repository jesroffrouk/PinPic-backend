import placesModels from '../models/placesModels.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';
import { sendNotification } from '../helpers/socket/notification.js';
import CustomError from '../utils/CustomError.js';

const logger = createLoggerFor(import.meta.url, 'metadata Services');

const metadataServices = {
  upVoteImage: async (userPublicId, imgPublicId, reactType) => {
    // get id from publicid
    // change imgid to postsId instead --for future
        // impt: I had doubt on this logic on related to multple attempts causing it to increasing upvotes twice , need to test.
    const {id: userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const {id: imgId} = (await placesModels.getIdFromPublicId('posts',imgPublicId))?.rows[0]
    const doesUpvoteExist = await placesModels.doesUpoteExist(userId, imgId); // expecting object
    if (doesUpvoteExist.rowCount > 0) {
      logger.info('vote already exist')
      // get current react type.
      const current_react_type = doesUpvoteExist.rows[0].react_type
      const existVoteId = doesUpvoteExist.rows[0].id
      // match that current react_type can't be similar with previous react type.
      if (current_react_type === reactType) {
       throw new CustomError('invalid react_type',401,'INVALID_INPUT') 
      }
      // if current react_type is upvoted or downvoted, decrease it's count and according to react type increase it's count as it wants
      if (current_react_type === 'upvoted') {
        // decrease upvoted
        await placesModels.decreaseUpvotesCount(imgId)
      }
      else if (current_react_type === 'downvoted') {
        // decrease downvoted
        // for future
      }

      await placesModels.setExistingUpvote(
        existVoteId,
        reactType
      );
      logger.info('updated existing vote');
    }
    else {
      // if not the existing call, check the react type is valid one and create a new entry in db.
      await placesModels.setNewUpvote(userId,imgId,reactType);
      logger.info('created new vote')
    }

    if (reactType === 'upvoted') {
      // increase upvote
      await placesModels.increaseUpvotesCount(imgId)

      // Future: Handle all these in notification service.
      // notification logic separate it pls
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
    }
    else if (reactType === 'downvoted') {
      // increase downvote
      // for future
    }
    logger.info('successfully performed interactions for user');
    return { message: 'sucessfully created upvote for user', success: true };
  },
  setCommentToPost: async(userPublicId,postPublicId,comment) => {
    // get id from publicId
    const {id: userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const {id: postId} = (await placesModels.getIdFromPublicId('posts',postPublicId))?.rows[0]
    // create a new comment query
    await placesModels.setComment(userId,postId,comment)
    // on success send successfull
    // increase comment count
    await placesModels.increaseCommentCount(postId)
    return {success: true,message: 'comment added successfully'}
  },
  getComments: async(postPublicId) => {
    // get id from publicId
    const {id: postId} = (await placesModels.getIdFromPublicId('posts',postPublicId))?.rows[0]
    // create a new comment query
    // send comments in batch. Future: send only 10 comments , provide rest on request.
    // plan it out.
    const data = (await placesModels.getComments(postId))?.rows
    return {data}
  },
  setVisitor: async(userPublicId,postPublicId) => {
    // get id from publicId
    const {id: userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const {id: postId} = (await placesModels.getIdFromPublicId('posts',postPublicId))?.rows[0]
    // check if user already visited it
    const doesVisitorExist = (await placesModels.doesVisitorExist(userId,postId))?.rows[0]
    if (doesVisitorExist.exists) {
      logger.info('visitor already exist')
      return {success: true,message: 'visitor already exist'}
    }
    // set new visitor
    await placesModels.setVisitor(userId,postId)
    // otherwise create a entry and increase visitor count
    await placesModels.increaseVisitorCount(postId)
    return {success: true,message: 'visitor added successfully'}
  }
}

export default metadataServices
