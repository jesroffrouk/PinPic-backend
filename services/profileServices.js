import CustomError from "../utils/CustomError.js";

function createProfileServices({helperRepository,logger,userRepository,cloudinary}) {

  return {
    setProfileImage: async(fileBase64,userPublicId) => {
      logger.info("adding profile picture started")
      const userResult = await helperRepository.getIdFromPublicId(
        'users',
        userPublicId
      );
      const userId = userResult?.rows[0]?.id;
      if (!userId) {
        logger.warn(`Users with publicId: ${userPublicId} doesn't exist`);
        throw new CustomError(
          `Users with publicId: ${userPublicId} doesn't exist`,
          404,
          'USER NOT FOUND'
        );
      }
    // upload image to cloudinary and get the image_url
      logger.info('uploading profile image to cloudinary');
      const cloudResponse = await cloudinary.uploader.upload(fileBase64, {
        folder: 'profiles',
        type: 'authenticated',
      });
      logger.info('uploaded to cloudinary');
      logger.info('saving it to db');
      const imgurl = cloudResponse.public_id;
     // saving to db
      await userRepository.setProfileImage(imgurl,userId);
      logger.info('setProfileImage finished');
      return { success: true, message: "sucessfully set profile image"}
    }
  }
}

export default createProfileServices;
