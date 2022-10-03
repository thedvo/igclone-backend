'use strict';

const db = require('../db.js');
const User = require('../models/user');
const Post = require('../models/post');
const { createToken } = require('../helpers/token');

const testPostIds = [];
// const testUserIds = [];

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM users');
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM posts');

	// create mock users for tests
	const user1 = await User.register({
		username: 'user1',
		password: 'password1',
		firstName: 'firstname1',
		lastName: 'lastname1',
		email: 'user1@user.com',
		isAdmin: false,
	});
	const user2 = await User.register({
		username: 'user2',
		password: 'password2',
		firstName: 'firstname2',
		lastName: 'lastname2',
		email: 'user2@user.com',
		isAdmin: false,
	});
	const user3 = await User.register({
		username: 'user3',
		password: 'password3',
		firstName: 'firstname3',
		lastName: 'lastname3',
		email: 'user3@user.com',
		isAdmin: false,
	});

	const user1ID = user1.id;
	const user2ID = user2.id;
	const user3ID = user3.id;
	console.log(user1ID);
	console.log(user2ID);
	console.log(user3ID);

	// create mock posts for tests
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

	await User.addLike('user1', testPostIds[1]);
	await User.addLike('user2', testPostIds[0]);

	await User.followUser('user1', user2ID);
	await User.followUser('user2', user1ID);

	await User.addComment('user1', testPostIds[1], { comment: 'awesome!' });
	await User.addComment('user2', testPostIds[0], {
		comment: 'congratulations',
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

const u1Token = createToken({ username: 'user1', isAdmin: false });
const u2Token = createToken({ username: 'user2', isAdmin: false });

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testPostIds,
	u1Token,
	u2Token,
};
