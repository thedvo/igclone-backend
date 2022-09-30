const db = require('../db.js');
const User = require('../models/user');
const Post = require('../models/post');
const { createToken } = require('../helpers/tokens');

const testPostIds = [];
const testUserIds = [];

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
			},
			'user1'
		)
	).id;
	testPostIds[1] = (
		await Post.create(
			{
				image_file: 'test.png',
				caption: 'test caption',
			},
			'user1'
		)
	).id;
	testPostIds[2] = (
		await Post.create(
			{
				image_file: 'test.png',
				caption: 'test caption',
			},
			'user2'
		)
	).id;

	testUserIds[0] = await User.register({
		username: 'user1',
		firstName: 'firstname1',
		lastName: 'lastname1',
		email: 'user1@user.com',
		password: 'password1',
	}).id;
	testUserIds[1] = await User.register({
		username: 'user2',
		firstName: 'firstname2',
		lastName: 'lastname2',
		email: 'user2@user.com',
		password: 'password2',
	}).id;
	testUserIds[2] = await User.register({
		username: 'user3',
		firstName: 'firstname3',
		lastName: 'lastname3',
		email: 'user3@user.com',
		password: 'password3',
	}).id;

	await User.addLike('user1', testPostIds[1]);
	await User.addLike('user2', testPostIds[0]);

	await User.followUser('user1', testUserIds[1]);
	await User.followUser('user2', testUserIds[2]);

	await User.addComment('user1', testPostIds[1], 'awesome!');
	await User.addComment('user2', testPostIds[0], 'congratulations');
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

const u1Token = createToken({ username: 'user1', isAdmin: false });
const u2Token = createToken({ username: 'user2', isAdmin: false });

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testPostIds,
	testUserIds,
	u1Token,
	u2Token,
};
