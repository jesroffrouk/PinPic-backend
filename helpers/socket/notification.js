import { getIO } from '../../socket.js';
import placesModels from '../../models/placesModels.js';


export const sendNotification = async({type,recipient_id,notificationId}) => {
    const io = getIO()
    // construct messgae for like,
    const sockets = await io.in(recipient_id).fetchSockets();
    if (sockets.length > 0) {
        let msg = '';
        if ((type = 'like')) {
            msg = `someone has upvoted your image`;
        }
        io.to(recipient_id).emit('notification', {
            msg
        });
        // update the db , to that sent to true
        await placesModels.setNotificationtoSent(notificationId)
    }
};
