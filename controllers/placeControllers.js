import placesServices from '../services/placesServices.js';
import catchAsync from '../utils/catchAsync.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';
import placesModels from '../models/placesModels.js';

const logger = createLoggerFor(import.meta.url, 'place controllers');

const placeControllers = {
  uploadImage: catchAsync(async (req, res) => {
    logger.info('Upload image started..');
    const { captions, longitude , latitude} = req.body;
    const userid = req.user.id;
    const fileBase64 = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString('base64')}`;
    const result = await placesServices.uploadImage(
      userid,
      captions,
      longitude,
      latitude,
      fileBase64
    );
    logger.info('Upload image successful');
    res.status(201).json(result);
  }),
  getImagesByLocation: catchAsync(async (req, res) => {
    logger.info('get image started..');
    const longitude = req.query.longitude;
    const latitude = req.query.latitude;
    const userid = req.user.id
    const { data } = await placesServices.getImageByLocation(
      longitude,
      latitude,
      userid
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
    const result = await placesServices.upVoteImage(userid, imgid, react_type);
    logger.info('upvote successfull');
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
