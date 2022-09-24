const db = require('../db');
const bcrypt = require('bcrypt');
const { sqlForPartialUpdate } = require('../helpers/sql');

const {
	NotFoundError,
	BadRequestError,
	UnauthorizedError,
	ExpressError,
} = require('../expressError');

const { BCRYPT_WORK_FACTOR } = require('../config');

/** Related functions for users */

class User {
	/************************************************************************************************************************************** */
	/**           CREATE/READ/UPDATE/DELETE USERS                 */
	/************************************************************************************************************************************** */

	/** LOGIN --> AUTHENTICATE A USER
	 * authenticate user with username, password.
	 *
	 * Returns { username, first_name, last_name, email, is_admin }
	 *
	 * Throws UnauthorizedError is user not found or wrong password.
	 **/

	static async authenticate(username, password) {
		// try to find the user first
		const result = await db.query(
			`SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  profile_image AS "profileImage",
                  bio,
                  last_modified AS "lastModified",
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
			[username]
		);

		const user = result.rows[0];

		if (user) {
			// compare hashed password to a new hash from password
			const isValid = await bcrypt.compare(password, user.password);
			if (isValid === true) {
				delete user.password;
				return user;
			}
		}

		throw new UnauthorizedError('Invalid username/password');
	}

	/** REGISTER A NEW USER (CREATE)
	 *
	 * Returns { username, firstName, lastName, email, isAdmin }
	 *
	 * Throws BadRequestError on duplicates.
	 **/

	static async register({
		username,
		password,
		firstName,
		lastName,
		email,
		isAdmin,
	}) {
		const duplicateCheck = await db.query(
			`SELECT username
           FROM users
           WHERE username = $1`,
			[username]
		);

		if (duplicateCheck.rows[0]) {
			throw new BadRequestError(`Duplicate username: ${username}`);
		}

		const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

		const result = await db.query(
			`INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, last_modified, is_admin AS "isAdmin"`,
			[username, hashedPassword, firstName, lastName, email, isAdmin]
		);

		const user = result.rows[0];

		return user;
	}

	/** FIND ALL USERS
	 *
	 * Returns [{ username, first_name, last_name, email, is_admin }, ...]
	 **/

	static async findAll() {
		const result = await db.query(
			`SELECT 
				  id,
				  username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
				  profile_image AS "profileImage",
				  last_modified,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`
		);

		return result.rows;
	}

	/** GET A USER
	 *
	 * Given a username, return data about user.
	 *
	 * Returns { username, first_name, last_name, profile_image, bio, is_admin }
	 *   where jobs is { id, title, company_handle, company_name, state }
	 *
	 * Throws NotFoundError if user not found.
	 **/

	static async get(username) {
		const userRes = await db.query(
			`SELECT 
				  id,
				  username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  profile_image AS "profileImage",
                  bio,
				  last_modified
           FROM users
           WHERE username = $1`,
			[username]
		);

		const user = userRes.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);

		// query current user's posts
		const postRes = await db.query(
			`SELECT 
				  id,
				  image_file AS "imageFile",
				  caption,
				  date_posted AS "datePosted"
			FROM posts
			WHERE user_id = $1
			ORDER BY date_posted DESC`,
			[user.id]
		);

		user.posts = postRes.rows;

		// query a user's likes
		const likesRes = await db.query(
			`SELECT
				p.id AS "postId"
			FROM posts AS p
			LEFT JOIN likes AS l
			ON p.id = l.post_id
			LEFT JOIN users AS u
			ON u.id = l.user_id
			WHERE u.id = $1`,
			[user.id]
		);

		user.likes = likesRes.rows.map((l) => l.postId);

		// query a user's comments
		const userCommentsRes = await db.query(
			`SELECT
				p.id AS "postId",
				c.id AS "commentId",
				c.comment
			FROM posts AS p
			LEFT JOIN comments AS c
			ON p.id = c.post_id
			LEFT JOIN users AS u
			ON u.id = c.user_id
			WHERE u.id = $1`,
			[user.id]
		);

		user.comments = userCommentsRes.rows;

		// query a user's following
		const userFollowingRes = await db.query(
			`SELECT 
				u.id,
				u.username
			FROM users AS u
			LEFT JOIN follows AS f
			ON u.id = f.user_followed_id
			WHERE f.user_following_id = $1`,
			[user.id]
		);

		user.following = userFollowingRes.rows.map((u) => u.id);

		// query a user's followers
		const userFollowersRes = await db.query(
			`SELECT 
				u.id,
				u.username
			FROM users AS u
			LEFT JOIN follows AS f
			ON u.id = f.user_following_id
			WHERE f.user_followed_id = $1`,
			[user.id]
		);

		user.followers = userFollowersRes.rows.map((u) => u.id);

		return user;
	}

	/** UPDATE USER DATA WITH 'DATA'.
	 *
	 * This is a "partial update" --- it's fine if data doesn't containß
	 * all the fields; this only changes provided ones.
	 *
	 * Data can include:
	 *   { firstName, lastName, password, email, isAdmin }
	 *
	 * Returns { username, firstName, lastName, email, isAdmin }
	 *
	 * Throws NotFoundError if not found.
	 *
	 * WARNING: this function can set a new password or make a user an admin.
	 * Callers of this function must be certain they have validated inputs to this
	 * or a serious security risks are opened.
	 */
	// username is req.params.username from patch route
	// data is req.body from the patch route

	static async update(username, data) {
		// if you want to update your password
		if (data.password) {
			data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
		}

		// this sets up the variables needed for the sql query
		// returns an object where we destructure out setCols, values
		// returns set columns string format for the query
		// return the updated values in an array
		const { setCols, values } = sqlForPartialUpdate(data, {
			isAdmin: 'is_admin',
		});

		// firstName: 'first_name',
		// lastName: 'last_name',

		// makes username the last element to be set in the query
		const usernameVarIdx = '$' + (values.length + 1);

		// sql query variable using setCols and usernameVarIdx
		const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING 
					  			id,
					  			username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
								profile_image AS "profileImage",
								bio,
								last_modified AS "lastModified",
                                is_admin AS "isAdmin"`;

		// updates the data by making a query
		// use spread operator on values array and add username at the end
		const result = await db.query(querySql, [...values, username]);

		// if everything works, should return a result
		const user = result.rows[0];

		// if not, then throw an error as the user is not found
		if (!user) throw new NotFoundError(`No user: ${username}`);

		delete user.password;
		return user;
	}

	/** DELETE A USER
	 *
	 * Delete given user from database; returns undefined. */

	static async remove(username) {
		let result = await db.query(
			`DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
			[username]
		);
		const user = result.rows[0];

		if (!user) throw new NotFoundError(`No user: ${username}`);
	}

	/************************************************************************************************************************************** */
	/**           LIKES                 */
	/************************************************************************************************************************************** */

	/** GET A USER'S LIKES
	 *
	 * Will be used to display a user's liked posts
	 */
	static async getUserLikes(username) {
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

		const likeResult = await db.query(
			`
				 SELECT p.id AS "postId",
                        p.image_file AS "imageFile"
                 FROM posts AS p
                 LEFT JOIN likes AS l 
				 ON p.id = l.post_id
				 LEFT JOIN users AS u
				 ON u.id = l.user_id
				 WHERE u.id = $1`,
			[userId]
		);

		// if (likeResult.rows.length === 0) {
		// 	throw new ExpressError(`User: ${username} has no likes.`);
		// }

		return likeResult.rows;
	}

	/** LIKE A POST
	 *
	 * * 3 PRE-CHECKS
	 * --> if user exists
	 * --> if post exists
	 * --> if user already likes the post
	 *
	 */
	static async addLike(user, post) {
		// check if user exists in database
		const preCheck = await db.query(
			`SELECT username
			FROM users
			WHERE username = $1`,
			[user]
		);

		const existingUser = preCheck.rows[0];
		if (!existingUser) throw new NotFoundError(`No record of user: ${user}`);

		// check if the post exists in the database
		const preCheck2 = await db.query(
			`SELECT id
			FROM posts
			WHERE id = $1`,
			[post]
		);

		const existingPost = preCheck2.rows[0];
		if (!existingPost)
			throw new NotFoundError(`No record of post with id: ${post}`);

		// query user's id which will be used for INSERT
		const userResult = await db.query(
			`
		SELECT id
		FROM users
		WHERE username = $1`,
			[user]
		);

		const userId = userResult.rows[0].id;

		// check if user already likes this post
		const preCheck3 = await db.query(
			`SELECT user_id
			FROM likes
			WHERE user_id = $1
			AND post_id = $2`,
			[userId, post]
		);

		const alreadyLiked = preCheck3.rows[0];
		if (alreadyLiked)
			throw new UnauthorizedError(`You already liked this image.`);

		const result = await db.query(
			`INSERT INTO likes (
				user_id,
				post_id)
			VALUES ($1, $2)
			RETURNING user_id AS "userId", post_id AS "postId"`,
			[userId, post]
		);

		let like = result.rows[0];
		return like;
	}

	/** UNLIKE A POST */
	static async removeLike(user, post) {
		const userResult = await db.query(
			`
		SELECT
			id,
			username
		FROM users
		WHERE username = $1`,
			[user]
		);

		const userId = userResult.rows[0].id;

		if (!userId) throw new NotFoundError(`No record of user: ${username}`);

		const result = await db.query(
			`DELETE FROM likes
			WHERE 
			user_id = $1
			AND post_id = $2
			`,
			[userId, post]
		);
	}

	/************************************************************************************************************************************** */
	/**           COMMENTS                 */
	/************************************************************************************************************************************** */

	/** Add a Comment to a Post */
	static async addComment(user, post, data) {
		const userResult = await db.query(
			`
		SELECT
			id,
			username
		FROM users
		WHERE username = $1`,
			[user]
		);

		const userId = userResult.rows[0].id;

		if (!userId) throw new NotFoundError(`No record of user: ${username}`);

		const result = await db.query(
			`INSERT INTO comments (
				user_id,
				post_id,
				comment)
			VALUES ($1, $2, $3)
			RETURNING id, comment, user_id AS "userId", post_id AS "postId", date_posted AS "datePosted"`,
			[userId, post, data.comment]
		);

		let comment = result.rows[0];
		return comment;
	}

	/** Delete a Comment from a Post */
	static async removeComment(post, comment) {
		const result = await db.query(
			`DELETE FROM comments
			WHERE 
			post_id = $1
			AND id = $2
			RETURNING id
			`,
			[post, comment]
		);

		const deleted_comment = result.rows[0];
		// if (!deleted_comment) {
		// 	throw new NotFoundError(`No comment with id: ${comment}`);
		// }
	}

	/************************************************************************************************************************************** */
	/**           FOLLOWS                 */
	/************************************************************************************************************************************** */

	/** Get a user's 'following'
	 *
	 * Will be used to display a list of users which the current user follows
	 */
	static async getUserFollowing(username) {
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

		let result = await db.query(
			`
		SELECT 
			u.id AS "userId",
			u.username,
			u.first_name AS "firstName",
			u.last_name AS "lastName",
			u.profile_image AS "profileImage"
		FROM users AS u
		LEFT JOIN follows AS f
		ON u.id = f.user_followed_id
		WHERE f.user_following_id = $1`,
			[userId]
		);

		return result.rows;
	}

	/** Get a user's 'followers'
	 *
	 * Will be used to display a list of users who follow the current user
	 */
	static async getUserFollowers(username) {
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

		let result = await db.query(
			`
		SELECT 
			u.id AS "userId",
			u.username,
			u.first_name AS "firstName",
			u.last_name AS "lastName",
			u.profile_image AS "profileImage"
		FROM users AS u
		LEFT JOIN follows AS f
		ON u.id = f.user_following_id
		WHERE f.user_followed_id = $1`,
			[userId]
		);

		// if (result.rows.length === 0) {
		// 	throw new ExpressError(`User: ${username} has no followers.`);
		// }

		return result.rows;
	}

	/** Follow a user
	 *
	 * 4 PRE-CHECKS
	 * 	--> if user exists
	 * 	--> if user being followed exists
	 * 	--> if user is trying to follow themselves
	 *  --> if the user already follows the user
	 *
	 */
	static async followUser(currentUser, userFollowed) {
		// Check if the current user who is following exists in the database
		const preCheck = await db.query(
			`SELECT id
           FROM users
           WHERE username = $1`,
			[currentUser]
		);
		const cUser = preCheck.rows[0];
		if (!cUser) throw new NotFoundError(`No record of user: ${currentUser}`);

		const currentUserId = preCheck.rows[0].id;

		// Check if the user being followed exists in the database
		const preCheck2 = await db.query(
			`SELECT id
           FROM users
           WHERE id = $1`,
			[userFollowed]
		);
		const userBeingFollowed = preCheck2.rows[0];

		if (!userBeingFollowed)
			throw new NotFoundError(`No record of user: ${userFollowed}`);

		// Check if user is trying to follow themselves
		if (userBeingFollowed.id === currentUserId)
			throw new UnauthorizedError(`Sorry, you can not follow yourself.`);

		// Check if user is already following this user
		const preCheck3 = await db.query(
			`SELECT user_following_id
			FROM follows
			WHERE user_following_id = $1
			AND user_followed_id = $2`,
			[currentUserId, userFollowed]
		);

		const alreadyFollow = preCheck3.rows[0];
		if (alreadyFollow) {
			throw new UnauthorizedError(
				`You already follow user with id: ${userFollowed}`
			);
		}

		// if all pre-checks pass, insert the follow into the database.
		await db.query(
			`INSERT INTO follows (user_following_id, user_followed_id)
           VALUES ($1, $2)`,
			[currentUserId, userFollowed]
		);
	}

	/** Unfollow a user
	 *
	 * 2 PRE-CHECKS
	 * --> if user exists
	 * --> if user currently follows the user being unfollowed
	 *
	 */
	static async unfollowUser(currentUser, userUnfollowed) {
		const preCheck = await db.query(
			`SELECT id
           FROM users
           WHERE username = $1`,
			[currentUser]
		);
		const user = preCheck.rows[0];
		if (!user) throw new NotFoundError(`No record of user: ${currentUser}`);

		const userId = preCheck.rows[0].id;

		const preCheck2 = await db.query(
			`SELECT user_followed_id
           FROM follows
           WHERE user_followed_id = $1
		   AND user_following_id = $2`,
			[userUnfollowed, userId]
		);
		const user2 = preCheck2.rows[0];

		if (!user2)
			throw new NotFoundError(
				`No record of ${currentUser} following user with id: ${userUnfollowed}`
			);

		const result = await db.query(
			`DELETE
			 FROM follows 
			 WHERE 
			 user_following_id = $1 
			 AND user_followed_id = $2`,
			[userId, userUnfollowed]
		);
	}
}

module.exports = User;
