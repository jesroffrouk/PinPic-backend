import db from '../config/db/conn.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'db service');

const placesModels = {
    setImages: async (captions, imgurl, longitude, latitude, userid) => {
        logger.info('adding Image to db');
        return await db.query(
            `INSERT INTO places (captions,imgurl,location,userid) VALUES ($1,$2, ST_GeogFromText('POINT('|| $3 || ' '|| $4 || ' )'), $5 ) RETURNING *`,
            [captions, imgurl, longitude, latitude, userid]
        );
    },

    getImages: async (longitude, latitude, userid) => {
        console.log(longitude, latitude, userid);
        logger.info('getting images from db');
        return await db.query(
            `SELECT 
      places.id,
      places.location,
      places.captions,
      places.imgurl,
      users.username AS author_name,
      COUNT(DISTINCT CASE WHEN upvotes.react_type = 'like' THEN upvotes.id END) AS upvotes_count,
          CASE 
              WHEN EXISTS (
                  SELECT 1 
                  FROM upvotes u2 
                  WHERE u2.imgid = places.id 
                    AND u2.userid = $3
                    AND u2.react_type = 'like'
              ) 
              THEN true ELSE false
          END AS upvoted
      FROM places 
      JOIN users ON places.userid = users.id 
      LEFT JOIN upvotes ON places.id = upvotes.imgid 
      WHERE ST_DWithin(
          location, 
          ST_GeogFromText($1), 
          $2
      )
      GROUP BY places.id, users.username
      ORDER BY upvotes_count;
            `,
            [`SRID=4326;POINT(${longitude} ${latitude})`, 1000, userid]
        );
    },
    doesUpoteExist: async (userid, imgid) => {
        logger.info('getting upvote..');
        return await db.query(
            `SELECT id , react_type
            FROM upvotes
            WHERE userid = $1
            AND imgid = $2
        `,
            [userid, imgid]
        );
    },
    setNewUpvote: async (userid, imgid, react_type) => {
        logger.info('creating new upvote');
        return await db.query(
            `
            INSERT INTO upvotes (userid, imgid, react_type)
            VALUES ($1,$2,$3);
            `,
            [userid, imgid, react_type]
        );
    },
    setExistingUpvote: async (id, react_type) => {
        logger.info('setting exisitng upvote to this image');
        return await db.query(
            `
            UPDATE upvotes
            SET react_type = $1
            WHERE id = $2;
            `,
            [react_type, id]
        );
    },
    getUserFromimgid: async (imgid) => {
        logger.info('getting userid from imgid');
        return await db.query(
            `
            SELECT users.id FROM users JOIN
            places ON users.id = places.userid 
            WHERE places.id = $1
            `,
            [imgid]
        );
    },
    createNotification: async ({ type, recipient_id, actor_id, metaData }) => {
        console.log(type,recipient_id,actor_id,metaData)
        logger.info('createing new notification...');
        return await db.query(
            `
      INSERT INTO notifications
      (type,recipient_id,actor_id,metadata)
      VALUES ($1,$2,$3,$4)
      RETURNING id
      `,
            [type, recipient_id, actor_id, metaData]
        );
    },
    getNotification: async (user_id) => {
        logger.info('getting all notificaton for user');
        return await db.query(
            `
      SELECT id,type,actor_id,is_read,is_sent,metadata,created_at FROM notifications 
      WHERE recipient_id = $1
      ORDER BY created_at DESC
      `,
            [user_id]
        );
    },
    getNotificationToSend: async (recipient_id) => {
        logger.info('getting all notificaton for user to send');
        return await db.query(
            `
      SELECT id,type,recipient_id,created_at FROM notifications 
      WHERE recipient_id = $1 and is_sent = false
      ORDER BY created_at ASC
      `,
            [recipient_id]
        );
    },
    setNotificationtoSent: async(notificationId) => {
        logger.info('setting notification.sent to true')
        return await db.query(`
            UPDATE notifications
            SET is_sent = true
            WHERE id = $1;
            `,[notificationId])
    }
};

export default placesModels;
