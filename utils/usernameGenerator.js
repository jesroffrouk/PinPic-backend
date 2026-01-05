import db from '../config/db/conn.js';
// logic to generate random username for users
export async function generateUniqueUsername(baseName) {
  const base = baseName.toLowerCase().replace(/\s+/g, '');
  let username = base;
  let count = 0;

  while (
    (
      await db.query(
        `SELECT EXISTS ( SELECT 1 FROM users WHERE username = $1)`,
        [username]
      )
    ).rows[0].exists
  ) {
    count++;
    username = `${base}${count}`;
  }

  return username;
}
