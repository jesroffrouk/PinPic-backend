import db from '../config/db/conn.js';
import { createLoggerFor } from '../helpers/loggers/loggers.js';

const logger = createLoggerFor(import.meta.url, 'db service');

const placesModels = {
    getIdFromPublicId: async (table,public_id) => {
        logger.info('getting id');
        return await db.query(
            `Select id 
             From ${table}
             WHERE public_id = $1`,
            [public_id]
        );
    },
    setImages: async (captions, imgurl, longitude, latitude, userId) => {
        logger.info('adding Image to db');
        return await db.query(
            `INSERT INTO posts (captions,imgurl,location,user_id) VALUES ($1,$2, ST_GeogFromText('POINT('|| $3 || ' '|| $4 || ' )'), $5 ) RETURNING *`,
            [captions, imgurl, longitude, latitude, userId]
        );
    },

    getImages: async (longitude, latitude, userId) => {
        console.log(longitude, latitude, userId);
        logger.info('getting images from db');
        return await db.query(
            `SELECT 
      posts.public_id as id,
      posts.location,
      posts.captions,
      posts.imgurl,
      users.username AS author_name,
      COUNT(DISTINCT CASE WHEN votes.react_type = 'upvoted' THEN votes.id END) AS upvotes_count,
          CASE 
              WHEN EXISTS (
                  SELECT 1 
                  FROM votes u2 
                  WHERE u2.img_id = votes.id 
                    AND u2.user_id = $3
                    AND u2.react_type = 'upvoted'
              ) 
              THEN true ELSE false
          END AS upvoted
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      LEFT JOIN votes ON posts.id = votes.img_id 
      WHERE ST_DWithin(
          location, 
          ST_GeogFromText($1), 
          $2
      )
      GROUP BY posts.id, users.username , votes.id
      ORDER BY upvotes_count;
            `,
            [`SRID=4326;POINT(${longitude} ${latitude})`, 1000, userId]
        );
    },
    doesUpoteExist: async (userId, imgId) => {
        logger.info('getting upvote..');
        return await db.query(
            `SELECT id , react_type
            FROM votes
            WHERE user_id = $1
            AND img_id = $2
        `,
            [userId, imgId]
        );
    },
    setNewUpvote: async (userId, imgId, react_type) => {
        logger.info('creating new upvote');
        return await db.query(
            `
            INSERT INTO votes (user_id, img_id, react_type)
            VALUES ($1,$2,$3);
            `,
            [userId, imgId, react_type]
        );
    },
    setExistingUpvote: async (id, reactType) => {
        logger.info('setting exisitng upvote to this image');
        return await db.query(
            `
            UPDATE votes
            SET react_type = $1
            WHERE id = $2;
            `,
            [reactType, id]
        );
    },
    getUserFromimgid: async (imgId) => {
        logger.info('getting userid from imgid');
        return await db.query(
            `
            SELECT users.id FROM users JOIN
            posts ON users.id = votes.user_id 
            WHERE posts.id = $1
            `,
            [imgId]
        );
    },
    createNotification: async (type, recipientId, actorId, metaData) => {
        console.log(type,recipientId,actorId,metaData)
        logger.info('createing new notification...');
        return await db.query(
            `
      INSERT INTO notifications
      (type,recipient_id,actor_id,metadata)
      VALUES ($1,$2,$3,$4)
      RETURNING id
      `,
            [type, recipientId, actorId, metaData]
        );
    },
    getNotification: async (userId) => {
        logger.info('getting all notificaton for user');
        return await db.query(
            `
      SELECT id,type,actor_id,is_read,is_sent,metadata,created_at FROM notifications 
      WHERE recipient_id = $1
      ORDER BY created_at DESC
      `,
            [userId]
        );
    },
    getNotificationToSend: async (recipientId) => {
        logger.info('getting all notificaton for user to send');
        console.log(recipientId)
        return await db.query(
            `
      SELECT id,type,recipient_id,created_at FROM notifications 
      WHERE recipient_id = $1 and is_sent = false
      ORDER BY created_at ASC
      `,
            [recipientId]
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
