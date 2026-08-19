import { sendNotification } from '../helpers/socket/notification.js';
import placesModels from '../models/placesModels.js';
import CustomError from '../utils/CustomError.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'notification Services');

export const sendPendingNotifications = async (userPublicId) => {
  const { id: userId } =
    (await placesModels.getIdFromPublicId('users', userPublicId))?.rows[0] ??
    {};

  if (!userId) {
    logger.warn(`Users with publicId: ${userPublicId} doesn't exist`);
    throw new CustomError(
      `Users with publicId: ${userPublicId} doesn't exist`,
      404,
      'USER NOT FOUND'
    );
  }

  const pendingNotifications = await placesModels.getNotificationToSend(userId);
  if (pendingNotifications.rowCount > 0) {
    for (const n of pendingNotifications.rows) {
      const notiData = {
        recipient_id: n.recipient_id,
        notificationId: n.id,
        type: n.type,
      };
      await sendNotification(notiData);
    }
  }
};
