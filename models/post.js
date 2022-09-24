const db = require('../db');
const { NotFoundError } = require('../expressError');

class Post {
	/************************************************************************************************************************************** */
	/**           CREATE/READ/UPDATE/DELETE POSTS                 */
	/************************************************************************************************************************************** */

	/** Create a post (from data), update db, return new post data.
	 *
	 * data should be { image_file, caption }
	 *
	 * Returns { id, imageFile, caption, datePosted, userId }
	 *
	 * */

	static async create(data, username) {
		// first query the user to get their ID
		const userResult = await db.query(
			`SELECT 
				id,
				username
			FROM users
			WHERE username = $1`,
			[username]
		);
		const userId = userResult.rows[0].id;

		if (!userId) throw new NotFoundError(`No record of user: ${username}`);

		// user the req.body information passed to this create() method along with the userId queried above to insert the data into the Posts table.
		const result = await db.query(
			`INSERT INTO posts (
	            image_file,
	            caption,
	            user_id)
	       VALUES ($1, $2, $3)
	       RETURNING id, image_file AS "imageFile", caption, date_posted AS "datePosted", user_id AS "userId"`,
			[data.image_file, data.caption, userId]
		);
		let post = result.rows[0];

		return post;
	}

	/** Find all posts.
	 *
	 * Order by date_posted (descending)
	 * Returns [{ id, imageFile, caption, datePosted, userId }]
	 * */

	static async findAll() {
		const result = await db.query(
			`SELECT p.id,
                  p.image_file AS "imageFile",
                  p.caption,
                  p.date_posted AS "datePosted",
                  p.user_id AS "userId",
				  u.username,
				  u.profile_image AS "profileImage"
           FROM posts AS P
		   LEFT JOIN users AS u
		   ON u.id = p.user_id
           ORDER BY p.date_posted DESC`
		);

		const allPosts = result.rows;

		return allPosts;
	}

	/** Given a post id, return data about post.
	 *
	 * We make separate individual queries to user, likes, comments and add their resutls to the Post result.
	 *
	 * Returns { id, image_file, caption, date_posted, user_id }
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(id) {
		const postResult = await db.query(
			`SELECT id AS "postId",
		          image_file AS "imageFile",
		          caption,
		          date_posted AS "datePosted"
		   	FROM posts AS p
		   	WHERE p.id = $1`,
			[id]
		);

		const post = postResult.rows[0];
		if (!post) throw new NotFoundError(`No post with id: ${id}`);

		const userResult = await db.query(
			`SELECT 
			u.id,
			u.username,
			u.profile_image AS "profileImage"
			FROM users AS u
			LEFT JOIN posts AS p
			ON u.id = p.user_id
			WHERE p.id = $1
			`,
			[id]
		);

		post.user = userResult.rows;

		// query the post's likes
		const likesRes = await db.query(
			`SELECT
				l.user_id AS "userId",
				u.username
			FROM likes AS l
			LEFT JOIN users AS u
			ON l.user_id = u.id
			WHERE l.post_id = $1`,
			[id]
		);

		post.likes = likesRes.rows;

		// query the post's comments
		const commentsRes = await db.query(
			`SELECT
				c.id AS "commentId",
				c.comment,
				u.username
			FROM posts AS p
			LEFT JOIN comments AS c
			ON p.id = c.post_id
			LEFT JOIN users AS u
			ON u.id = c.user_id
			WHERE p.id = $1`,
			[id]
		);

		post.comments = commentsRes.rows;

		return post;
	}

	/** Get a post's 'likes'
	 *
	 * Will be used to display a list of users who have liked the post
	 */
	static async getPostLikes(id) {
		const likesRes = await db.query(
			`SELECT
				l.user_id AS "userId",
				u.username,
				u.profile_image AS "profileImage"
			FROM likes AS l
			LEFT JOIN users AS u
			ON l.user_id = u.id
			WHERE l.post_id = $1`,
			[id]
		);

		const likes = likesRes.rows;
		return likes;
	}

	/** Delete given post from database; returns undefined.
	 *
	 * Throws NotFoundError if post not found.
	 **/

	static async remove(id) {
		const result = await db.query(
			`DELETE
            FROM posts
            WHERE id = $1
            RETURNING id`,
			[id]
		);
		const post = result.rows[0];

		if (!post) {
			throw new NotFoundError(`No post with id: ${id}`);
		}
	}
}

module.exports = Post;
