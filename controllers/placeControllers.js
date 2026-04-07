import catchAsync from '../utils/catchAsync.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';
import placesModels from '../models/placesModels.js';
import uploadServices from '../services/uploadServices.js';
import feedServices from '../services/feedServices.js';
import metadataServices from '../services/metadataServices.js';
import locationServices from '../services/locationService.js';
import ApiResponse from '../utils/ApiResponse.js';

const logger = createLoggerFor(import.meta.url, 'place controllers');

const placeControllers = {
  uploadImage: catchAsync(async (req, res) => {
    logger.info('Upload image started..');
    const { title,content, longitude , latitude} = req.body;
    const userid = req.user.id;
    const fileBase64 = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString('base64')}`;
    // validate Inputs
    const result = await uploadServices.uploadImage(
      userid,
      title,
      longitude,
      latitude,
      fileBase64,
      content
    );
    logger.info('Upload image successful');
    res.status(201).json(new ApiResponse(201,result.data,result.message));
  }),
  getAllImagesByLocation: catchAsync(async (req, res) => {
    logger.info('get all image started..');
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const created_at = req.query.created_at
    const post_id = req.query.post_id
    
    // validate Inputs
    const result = await feedServices.getAllImagesByLocation(
      created_at,
      post_id,
      {longitude,latitude}
    );
    logger.info('get image successful');
    res.status(200).json(new ApiResponse(200,result.data,result.message));
  }),
  getImageById: catchAsync(async (req, res) => {
    // this might need optimization later so let's just mkae it work for right now
    logger.info('get image started..');
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const postId = req.query.postid;
    // validate Inputs
    const userId = req.user.id
    const result = await feedServices.getImageById(
      longitude,
      latitude,
      userId,
      postId
    );
    logger.info('get image successful');
    res.status(201).json(new ApiResponse(200,{post: result.data},result.message));
  }),
  upvoteImage: catchAsync(async (req, res) => {
    logger.info('upvote an image started..');
    // validate user inputs
    console.log(req.body)
    const react_type = req.body.react_type
    const imgid = req.body.imgid;
    const userid = req.user.id;
    //  upvote services logic
    const result = await metadataServices.upVoteImage(userid, imgid, react_type);
    logger.info('upvote successfull');
    res.status(201).json(new ApiResponse(201,result.data,result.message));
  }),
  setComment: catchAsync(async (req, res) => {
    logger.info('set a new comment');
    // validate user inputs
    const comment = req.body.comment
    const postId = req.body.postid;
    const userId = req.user.id;
    //  upvote services logic
    const result = await metadataServices.setCommentToPost(userId,postId,comment);
    logger.info('set comment successful');
    res.status(201).json(new ApiResponse(201,result.data,result.message));
  }),
  getComments: catchAsync(async (req, res) => {
    logger.info('get comments started..');
    // validate user inputs
    const postId = req.query.postid;
    //  upvote services logic
    const result = await metadataServices.getComments(postId);
    logger.info('get comment successful');
    res.status(200).json(new ApiResponse(200,{comments: result.data},result.message));
  }),
  setVisitors: catchAsync(async (req, res) => {
    logger.info('set a visitor');
    // validate user inputs
    const postId = req.body.postId;
    const userId = req.user.id;
    //  upvote services logic
    const result = await metadataServices.setVisitor(userId,postId);
    logger.info('setvisitors successfull');
    res.status(201).json(new ApiResponse(201,result.data,result.message));
  }),
  getNotification: catchAsync(async (req,res) => {
    logger.info('get notification started..')
    const userPublicId = req.user.id
    const {id: userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const result = await placesModels.getNotification(userId)
    // security: validate Inputs
    logger.info('get notification successful')
    const notifications = result.rows
    res.status(200).json(new ApiResponse(200,{notifications: notifications},'notifications retrieved successful'))
  }),
  getLocationName: catchAsync(async(req,res)=> {
    logger.info('getLocationName started..')
    const latitude = req.query.latitude
    const longitude = req.query.longitude
    // security: validate Inputs
    const result = await locationServices.getLocationName({latitude,longitude})
    logger.info('getLocationName successful')
    res.status(200).json(new ApiResponse(200,{location: result.data},result.message))
    }),
    // collections
  setCollection: catchAsync(async(req,res) => {
    logger.info('setCollections started..')
    const userId = req.user.id
    const postId = req.body.postId
    // security: Validate Inputs
    const result = await metadataServices.setCollection(userId,postId)
    logger.info('setCollection successful')
    res.status(201).json(new ApiResponse(201,result.data,result.message))
    }),
  getCollection: catchAsync(async(req,res) => {
    logger.info('getCollection started..')
    const userId = req.user.id
    const createdAt = req.query.created_at
    const postId = req.query.post_id
    // security: Validate Inputs
    const result = await metadataServices.getCollection(userId,createdAt,postId)
    logger.info('getCollection successful')
    res.status(200).json(new ApiResponse(200,result.data,result.message))
    }),

};

export default placeControllers;
