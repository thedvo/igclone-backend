const express = require('express');
const { BadRequestError } = require('../expressError');
const { ensureLoggedIn, verifyUserOrAdmin } = require('../middleware/auth');

const Post = require('../models/post');
const User = require('../models/user');

const jsonschema = require('jsonschema');
const postNewSchema = require('../schemas/postNew.json');
const commentNewSchema = require('../schemas/commentNew.json');
const router = express.Router();

/** Create a new post
 * Utilized user_id in parameter to create post linked to current user
 * Authorization required: verifyUserOrAdmin
 */
router.post(
	'/:username/create',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			const validator = jsonschema.validate(req.body, postNewSchema);
			if (!validator.valid) {
				const errs = validator.errors.map((e) => e.stack);
				throw new BadRequestError(errs);
			}
			const username = req.params.username;
			const post = await Post.create(req.body, username);
			// const post = await Post.create(req.body);
			return res.status(201).json({ post });
		} catch (err) {
			return next(err);
		}
	}
);

/** Get all posts
 * 	Authorization Required: ensureLoggedIn
 */

router.get('/', ensureLoggedIn, async function (req, res, next) {
	try {
		const posts = await Post.findAll();
		return res.json({ posts });
	} catch (err) {
		return next(err);
	}
});

/** Get an individual post
 * Authorization Required: ensureLoggedIn
 *
 * */
router.get('/:id', ensureLoggedIn, async function (req, res, next) {
	try {
		const post = await Post.get(req.params.id);
		return res.json({ post });
	} catch (err) {
		return next(err);
	}
});

/** Get an individual post's likes
 * Authorization Required: ensureLoggedIn
 *
 * */
router.get('/:id/likes', ensureLoggedIn, async function (req, res, next) {
	try {
		const likes = await Post.getPostLikes(req.params.id);
		return res.json({ likes });
	} catch (err) {
		return next(err);
	}
});

/** Delete a post
 * Authorization Required: verifyUserOrAdmin
 *
 *  */
router.delete(
	'/:id/:username',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			await Post.remove(req.params.id);
			return res.json({ deleted_post: +req.params.id });
		} catch (err) {
			return next(err);
		}
	}
);

/** POST / [/:post_id/like/]
 *  Like a post
 * 	Authorization Required: verifyUserOrAdmin
 */

router.post(
	'/:post_id/:username/like',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			const user = req.params.username;
			const post = req.params.post_id;

			const like = await User.addLike(user, post);
			return res.json({ like });
		} catch (err) {
			return next(err);
		}
	}
);

/** DELETE / [/:post_id/unlike/]
 *  Unike a post
 * 	Authorization Required: verifyUserOrAdmin
 */

router.delete(
	'/:post_id/:username/unlike',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			const user = req.params.username;
			const post = req.params.post_id;

			await User.removeLike(user, post);
			return res.json({ unliked_post: +post });
		} catch (err) {
			return next(err);
		}
	}
);

/** POST / [/:post_id/comment/]
 *  Comment on a post
 * 	Authorization Required: verifyUserOrAdmin
 */

router.post(
	'/:id/:username/comment',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			const validator = jsonschema.validate(req.body, commentNewSchema);
			if (!validator.valid) {
				const errs = validator.errors.map((e) => e.stack);
				throw new BadRequestError(errs);
			}
			const user = req.params.username;
			const post = req.params.id;
			const data = req.body;

			const comment = await User.addComment(user, post, data);
			return res.status(201).json({ comment });
		} catch (err) {
			return next(err);
		}
	}
);

/** DELETE / [/:post_id/comment/:comment_id]
 *  Delete a comment on a post
 */

router.delete(
	'/:id/:username/comment/:comment_id',
	verifyUserOrAdmin,
	async function (req, res, next) {
		try {
			const post = req.params.id;
			const comment = req.params.comment_id;

			await User.removeComment(post, comment);
			return res.json({ deleted: +req.params.comment_id });
		} catch (err) {
			return next(err);
		}
	}
);

module.exports = router;
