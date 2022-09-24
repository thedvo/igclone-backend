/** Routes for Users */
const express = require('express');

const { ensureLoggedIn, verifyUserOrAdmin } = require('../middleware/auth');
const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/token');

const User = require('../models/user');
const Post = require('../models/post');

const jsonschema = require('jsonschema');
const userUpdateSchema = require('../schemas/userUpdate.json');

const router = new express.Router();

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 **/

router.get('/', ensureLoggedIn, async function (req, res, next) {
	try {
		const users = await User.findAll();
		return res.json({ users });
	} catch (err) {
		return next(err);
	}
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, profileImage, bio, posts, likes, comments, followers, following}
 *
 * Authorization required: login
 **/
// *****************remember to add back ensureLoggedIn!!!*************************
router.get('/:username', ensureLoggedIn, async function (req, res, next) {
	try {
		const user = await User.get(req.params.username);
		return res.json({ user });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: verifyUserorAdmin
 **/

// add verifyUserorAdmin
router.patch(
	'/:username/edit',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			const validator = jsonschema.validate(req.body, userUpdateSchema);
			if (!validator.valid) {
				const errs = validator.errors.map((e) => e.stack);
				throw new BadRequestError(errs);
			}

			// update method can be found in user.js
			const user = await User.update(req.params.username, req.body);
			return res.json({ user });
		} catch (err) {
			return next(err);
		}
	}
);

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: verifyUserorAdmin
 **/

router.delete('/:username', verifyUserOrAdmin, async function (req, res, next) {
	try {
		await User.remove(req.params.username);
		return res.json({ deleted: req.params.username });
	} catch (err) {
		return next(err);
	}
});

/** GET / [:username/likes]
 *  Links to a user's likes
 * 	Authorization required: login
 */

router.get('/:username/likes', ensureLoggedIn, async function (req, res, next) {
	try {
		const username = req.params.username;
		const likes = await User.getUserLikes(username);
		return res.json({ likes });
	} catch (err) {
		return next(err);
	}
});

/** GET / [:username/following]
 *  Shows list of current user's following
 * 	Authorization required: login
 *
 */

router.get(
	'/:username/following',
	ensureLoggedIn,
	async function (req, res, next) {
		try {
			const username = req.params.username;
			const following = await User.getUserFollowing(username);
			return res.json({ following });
		} catch (err) {
			return next(err);
		}
	}
);

/** GET / [:username/followers]
 *  Shows list of current user's followers
 *  Authorization required: login
 */

router.get(
	'/:username/followers',
	ensureLoggedIn,
	async function (req, res, next) {
		try {
			const username = req.params.username;
			const followers = await User.getUserFollowers(username);
			return res.json({ followers });
		} catch (err) {
			return next(err);
		}
	}
);

/** POST / [/follow/:follow-id]
 * 	Follow a user
 * 	Authorization required: verifyUserOrAdmin
 * */

router.post(
	'/:username/follow/:id',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			const currentUser = req.params.username;
			const userFollowed = req.params.id;

			const follow = await User.followUser(currentUser, userFollowed);

			return res.json({ followed: +req.params.id });
		} catch (err) {
			return next(err);
		}
	}
);

/** DELETE / [/unfollow/:follow-id]
 * 	Unfollow a user
 * 	Authorization required: verifyUserOrAdmin
 * */

router.delete(
	'/:username/unfollow/:id',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			const currentUser = req.params.username;
			const userUnfollowed = req.params.id;

			const unfollow = await User.unfollowUser(currentUser, userUnfollowed);

			return res.json({ unfollowed: +req.params.id });
		} catch (err) {
			return next(err);
		}
	}
);

module.exports = router;
