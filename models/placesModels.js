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
    setImages: async (title,content, imgurl, longitude, latitude, userId) => {
        logger.info('adding Image to db');
        return await db.query(
            `INSERT INTO posts (title,content,imgurl,location,user_id) VALUES ($1,$2, $3, ST_GeogFromText('POINT('|| $4 || ' '|| $5 || ' )'), $6 ) RETURNING *`,
            [title,content, imgurl, longitude, latitude, userId]
        );
    },

    getAllImagesByLocationFirst: async (longitude, latitude) => {
        logger.info('getting first latest 10 images from db');
        return await db.query(
            `SELECT 
      posts.public_id as id,
      posts.title,
      posts.imgurl,
      posts.upvotes_count,
      users.username AS author_name,
      posts.created_at
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      WHERE ST_DWithin(
          location, 
          ST_GeogFromText($1), 
          $2
      )
      ORDER BY posts.created_at DESC, posts.id DESC
      LIMIT 11;
            `,
            [`SRID=4326;POINT(${longitude} ${latitude})`, 1000]
        );
    },
    getAllImagesByLocationNext: async (cursor_created_at,cursor_post_id,longitude, latitude) => {
        logger.info('getting next latest 10 images from db');
        return await db.query(
            `SELECT 
      posts.public_id as id,
      posts.title,
      posts.imgurl,
      posts.upvotes_count,
      users.username AS author_name,
      posts.created_at
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      WHERE 
        (
        posts.created_at < $1
        OR (posts.created_at = $1 AND posts.id < $2 )
        )
        AND  
        ST_DWithin(
              location, 
              ST_GeogFromText($3), 
              $4
          ) 
      ORDER BY posts.created_at DESC , posts.id DESC
      LIMIT 11 ;
            `,
            [cursor_created_at,cursor_post_id,`SRID=4326;POINT(${longitude} ${latitude})`, 1000]
        );
    },
    getImageById: async (longitude, latitude, userId,postId) => {
        logger.info('getting images from db');
        return await db.query(
            `SELECT 
      posts.public_id as id,
      posts.title,
      posts.content,
      posts.imgurl,
      posts.upvotes_count,
      posts.comments_count,
      posts.visitors_count,
      posts.created_at as upload_date,
      users.public_id AS author_id,
      users.username AS author_name,
          CASE 
              WHEN EXISTS (
                  SELECT 1 
                  FROM votes u2 
                  WHERE u2.img_id = posts.id 
                    AND u2.user_id = $3
                    AND u2.react_type = 'upvoted'
              ) 
              THEN true ELSE false
          END AS upvoted,
          CASE 
              WHEN EXISTS (
                  SELECT 1 
                  FROM collections c 
                  WHERE c.post_id = posts.id 
                    AND c.user_id = $3
              ) 
              THEN true ELSE false
          END AS collected
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      WHERE ST_DWithin(
          posts.location, 
          ST_GeogFromText($1), 
          $2
      ) AND posts.id = $4
            `,
            [`SRID=4326;POINT(${longitude} ${latitude})`, 1000, userId ,postId]
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
    decreaseUpvotesCount: async (postId) => {
        logger.info('decreasing upvotes count');
        return await db.query(
            `
            UPDATE posts
            SET upvotes_count = upvotes_count - 1
            WHERE id = $1 AND upvotes_count > 0;
            `,
            [postId]
        );
    },
    increaseUpvotesCount: async (postId) => {
        logger.info('increasing upvotes count');
        return await db.query(
            `
            UPDATE posts
            SET upvotes_count = upvotes_count + 1
            WHERE id = $1;
            `,
            [postId]
        );
    },
    getComments: async (postId) => {
        logger.info('getting comments for Post');
        return await db.query(
            `
            SELECT 
                comments.public_id as id,
                comments.comment,
                comments.author as author_id,
                comments.created_at AS date,
                users.username as author_name
            FROM comments
            LEFT JOIN users ON comments.author = users.id
            WHERE post_id = $1
            `,
            [postId]
        );
    },
    setComment: async (userId,postId,comment) => {
        logger.info('adding comments for Post');
        return await db.query(
            `
            INSERT INTO comments (author,post_id,comment)
            VALUES ($1,$2,$3)
            `,
            [userId,postId,comment]
        );
    },
    increaseCommentCount: async (postId) => {
        logger.info('adding comments for Post');
        return await db.query(
            `
            UPDATE posts
            SET comments_count = comments_count + 1
            WHERE id = $1
            `,
            [postId]
        );
    },
    doesVisitorExist: async (userId,postId) => {
        logger.info('checking if visitor already exist');
        return await db.query(
            `
            SELECT EXISTS (
            SELECT 1 FROM visitors 
            WHERE visitor_id = $1 AND post_id = $2
            )
            `,
            [userId,postId]
        );
    },
    setVisitor: async (userId,postId) => {
        logger.info('adding new visitor');
        return await db.query(
            `
            INSERT INTO visitors (visitor_id,post_id) VALUES ($1,$2)
            `,
            [userId,postId]
        );
    },
    increaseVisitorCount: async (postId) => {
        logger.info('increasing visitor count');
        return await db.query(
            `
            UPDATE posts
            SET visitors_count = visitors_count + 1
            WHERE id = $1
            `,
            [postId]
        );
    },
    getUserFromimgid: async (imgId) => {
        logger.info('getting userid from imgid');
        return await db.query(
            `
            SELECT users.id FROM users JOIN
            posts ON users.id = posts.user_id 
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
    },
    // collection queries
    doestCollectionExist: async(user_id,post_id) => {
        logger.info('checking if collection exists')
        return await db.query(`
            SELECT id FROM Collections
            WHERE user_id = $1 and post_id = $2;
        `,[user_id,post_id])
    },
    setCollections: async(user_id,post_id) => {
        logger.info('checking if collection exists')
        return await db.query(`
        INSERT INTO collections (user_id,post_id) VALUES ($1,$2);
        `,[user_id,post_id])
    },
    removeCollections: async(collection_id) => {
        logger.info('deleting collection which Exist')
        return await db.query(`
            DELETE FROM Collections
            WHERE id = $1
        `,[collection_id])
    },
    getCollectionsFirst: async(user_id) => {
        logger.info('getCollection of first 10 recent posts')
        return await db.query(`
           SELECT 
                c.public_id as id,
                p.public_id as post_id,
                p.title,
                p.imgurl,
                p.upvotes_count,
                p.visitors_count,
                c.created_at
           from collections c 
           JOIN posts p ON p.id = c.post_id 
           WHERE c.user_id = $1
           ORDER BY c.created_at DESC
           LIMIT 11
        `,[user_id])
    },
    getCollectionsNext: async(cursor_created_at,cursor_post_id,user_id) => {
        logger.info('getCollection of next 10 recent posts')
        return await db.query(`
           SELECT
                c.public_id as id,
                p.public_id as post_id,
                p.title,
                p.imgurl,
                p.upvotes_count,
                p.visitors_count,
                c.created_at
           from collections c 
           JOIN posts p ON p.id = c.post_id 
           WHERE c.user_id = $1
            AND (c.created_at < $2
            OR (
                c.created_at = $2
                AND c.post_id < $3
                )
            )
           ORDER BY c.created_at DESC, c.post_id DESC
           LIMIT 11
        `,[user_id,cursor_created_at,cursor_post_id])
    },
};

export default placesModels;
