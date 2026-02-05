import catchAsync from '../utils/catchAsync.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';
import placesModels from '../models/placesModels.js';
import uploadServices from '../services/uploadServices.js';
import feedServices from '../services/feedServices.js';
import metadataServices from '../services/metadataServices.js';

const logger = createLoggerFor(import.meta.url, 'place controllers');

const placeControllers = {
  uploadImage: catchAsync(async (req, res) => {
    logger.info('Upload image started..');
    const { title,content, longitude , latitude} = req.body;
    const userid = req.user.id;
    const fileBase64 = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString('base64')}`;
    const result = await uploadServices.uploadImage(
      userid,
      title,
      longitude,
      latitude,
      fileBase64,
      content
    );
    logger.info('Upload image successful');
    res.status(201).json(result);
  }),
  getAllImagesByLocation: catchAsync(async (req, res) => {
    logger.info('get all image started..');
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const { data } = await feedServices.getAllImagesByLocation(
      longitude,
      latitude,
    );
    logger.info('get image successful');
    res.status(201).json(data);
  }),
  getImageById: catchAsync(async (req, res) => {
    // this might need optimization later so let's just mkae it work for right now
    logger.info('get image started..');
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const postId = req.query.postid;
    console.log(longitude)
    console.log(postId)
    const userId = req.user.id
    const { data } = await feedServices.getImageById(
      longitude,
      latitude,
      userId,
      postId
    );
    logger.info('get image successful');
    res.status(201).json(data);
  }),
  upvoteImage: catchAsync(async (req, res) => {
    logger.info('upvote an image started..');
    // validate user inputs
    // check the type of react, it can only be like or dislike for now
    console.log(req.body)
    const react_type = req.body.react_type
    const imgid = req.body.imgid;
    const userid = req.user.id;
    //  upvote services logic
    const result = await metadataServices.upVoteImage(userid, imgid, react_type);
    logger.info('upvote successfull');
    res.status(201).json(result);
  }),
  setComment: catchAsync(async (req, res) => {
    logger.info('set a new comment');
    // validate user inputs
    // check the type of react, it can only be like or dislike for now
    const comment = req.body.comment
    const postId = req.body.postid;
    const userId = req.user.id;
    //  upvote services logic
    const result = await metadataServices.setCommentToPost(userId,postId,comment);
    logger.info('set comment successful');
    res.status(201).json(result);
  }),
  getComments: catchAsync(async (req, res) => {
    logger.info('get comments started..');
    // validate user inputs
    // check the type of react, it can only be like or dislike for now
    const postId = req.query.postid;
    //  upvote services logic
    const {data} = await metadataServices.getComments(postId);
    logger.info('get comment successful');
    res.status(201).json(data);
  }),
  setVisitors: catchAsync(async (req, res) => {
    logger.info('set a visitor');
    // validate user inputs
    // check the type of react, it can only be like or dislike for now
    const postId = req.body.postId;
    const userId = req.user.id;
    //  upvote services logic
    const result = await metadataServices.setVisitor(userId,postId);
    logger.info('setvisitors successfull');
    res.status(201).json(result);
  }),
  getNotification: catchAsync(async (req,res) => {
    logger.info('get notification started..')
    const userPublicId = req.user.id
    const {id: userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const result = await placesModels.getNotification(userId)
    logger.info('get notification successful')
    const notifications = result.rows
    console.log(notifications)
    res.status(201).json({notifications,success: true})
  })
};

export default placeControllers;
