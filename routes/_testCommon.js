const db = require('../db.js');
const User = require('../models/user');
const Post = require('../models/post');
const { createToken } = require('../helpers/tokens');

const testPostIds = [];

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM users');
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM posts');

	testPostIds[0] = (
		await Post.create(
			{
				image_file: 'test.png',
				caption: 'test caption',
				user_id: 1,
			},
			'u1'
		)
	).id;
	testPostIds[1] = (
		await Post.create(
			{
				image_file: 'test.png',
				caption: 'test caption',
				user_id: 1,
			},
			'u1'
		)
	).id;
	testPostIds[2] = (
		await Post.create(
			{
				image_file: 'test.png',
				caption: 'test caption',
				user_id: 1,
			},
			'u2'
		)
	).id;

	await User.register({
		username: 'u1',
		firstName: 'U1F',
		lastName: 'U1L',
		email: 'user1@user.com',
		password: 'password1',
	});
	await User.register({
		username: 'u2',
		firstName: 'U2F',
		lastName: 'U2L',
		email: 'user2@user.com',
		password: 'password2',
	});
	await User.register({
		username: 'u3',
		firstName: 'U3F',
		lastName: 'U3L',
		email: 'user3@user.com',
		password: 'password3',
	});
}

async function commonBeforeEach() {
	await db.query('BEGIN');
}

async function commonAfterEach() {
	await db.query('ROLLBACK');
}

async function commonAfterAll() {
	await db.end();
}

const u1Token = createToken({ username: 'u1', isAdmin: false });
const u2Token = createToken({ username: 'u2', isAdmin: false });

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testPostIds,
	u1Token,
	u2Token,
};
