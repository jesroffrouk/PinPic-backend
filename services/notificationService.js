import { sendNotification } from "../helpers/socket/notification.js"
import placesModels from "../models/placesModels.js"

export const sendPendingNotifications = async (userPublicId) => {
    const {id: userId} = (await placesModels.getIdFromPublicId('users',userPublicId))?.rows[0]
    const pendingNotifications = await placesModels.getNotificationToSend(userId)
    console.log(pendingNotifications.rows)
    if(pendingNotifications.rowCount > 0) {
            for (const n of pendingNotifications.rows) {
            const notiData = {
            recipient_id: n.recipient_id,
            notificationId: n.id,
            type: n.type
            }
            await sendNotification(notiData)
    }

}
}