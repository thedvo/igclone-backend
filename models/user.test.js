const {
	NotFoundError,
	BadRequestError,
	UnauthorizedError,
} = require('../expressError');
const db = require('../db.js');
const User = require('./user.js');
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testPostIds,
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/** ********************** AUTHENTICATE A USER */

describe('authenticate user', function () {
	it('works', async function () {
		const user = await User.authenticate('testuser1', 'password1');

		user.lastModified = 100;
		// reason we set lastModified is to mimic a mock timestamp

		expect(user).toEqual({
			username: 'testuser1',
			firstName: 'firstname1',
			lastName: 'lastname1',
			email: 'tester1@test.com',
			profileImage: 'img.png',
			bio: 'Test Bio',
			lastModified: 100,
			isAdmin: false,
		});
	});

	it('throws unauth if no such user', async function () {
		try {
			await User.authenticate('nope', 'password');
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});

	it('throws unauth if wrong password', async function () {
		try {
			await User.authenticate('testuser1', 'wrong');
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});
});

/** ********************** CREATE/REGISTER A USER */

describe('register user', function () {
	const newUser = {
		username: 'testuser4',
		firstName: 'test',
		lastName: 'tester',
		email: 'test@test.com',
		isAdmin: false,
	};

	it('works', async function () {
		let user = await User.register({
			...newUser,
			password: 'password',
		});

		user.last_modified = 100;
		// reason we set last_modified is to mimic a mock timestamp
		expect(user).toEqual({
			username: 'testuser4',
			firstName: 'test',
			lastName: 'tester',
			email: 'test@test.com',
			last_modified: 100,
			isAdmin: false,
		});

		const found = await db.query(
			"SELECT * FROM users WHERE username = 'testuser4'"
		);

		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].is_admin).toEqual(false);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	it('works: adds admin', async function () {
		let user = await User.register({
			...newUser,
			password: 'password',
			isAdmin: true,
		});

		// reason we set last_modified is to mimic a mock timestamp
		user.last_modified = 100;

		expect(user).toEqual({
			username: 'testuser4',
			firstName: 'test',
			lastName: 'tester',
			email: 'test@test.com',
			last_modified: 100,
			isAdmin: true,
		});
		const found = await db.query(
			"SELECT * FROM users WHERE username = 'testuser4'"
		);
		expect(found.rows.length).toEqual(1);
		expect(found.rows[0].is_admin).toEqual(true);
		expect(found.rows[0].password.startsWith('$2b$')).toEqual(true);
	});

	it('throws bad request with duplicate data', async function () {
		try {
			await User.register({
				...newUser,
				password: 'password',
			});
			await User.register({
				...newUser,
				password: 'password',
			});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/** ********************** GET ALL USERS */

describe('findAll users', function () {
	it('works', async function () {
		const users = await User.findAll();

		// set mock timestamp for last_modified
		users.map((u) => (u.last_modified = 100));

		expect(users).toEqual([
			{
				id: 1000,
				username: 'testuser1',
				firstName: 'firstname1',
				lastName: 'lastname1',
				email: 'tester1@test.com',
				profileImage: 'img.png',
				last_modified: 100,
				isAdmin: false,
			},
			{
				id: 1001,
				username: 'testuser2',
				firstName: 'firstname2',
				lastName: 'lastname2',
				email: 'tester2@test.com',
				profileImage: 'img.png',
				last_modified: 100,
				isAdmin: false,
			},
			{
				id: 1002,
				username: 'testuser3',
				firstName: 'firstname3',
				lastName: 'lastname3',
				email: 'tester3@test.com',
				profileImage: 'img.png',
				last_modified: 100,
				isAdmin: false,
			},
		]);
	});
});

/** ********************** GET A USER */

describe('get an individual user by ID', function () {
	it('works', async function () {
		let user = await User.get('testuser1');

		// mock password
		user.password = 'password1';

		// mock last_modified
		user.last_modified = 100;

		// mock datePosted
		user.posts[0].datePosted = 100;

		expect(user).toEqual({
			id: 1000,
			username: 'testuser1',
			password: 'password1',
			firstName: 'firstname1',
			lastName: 'lastname1',
			profileImage: 'img.png',
			bio: 'Test Bio',
			last_modified: 100,
			posts: [
				{
					id: testPostIds[0],
					imageFile: 'img.jpg',
					caption: 'test!',
					datePosted: 100,
				},
			],
			likes: [testPostIds[0], testPostIds[1]],
			comments: [
				{
					postId: testPostIds[0],
					commentId: 500,
					comment: 'awesome picture!',
				},
			],
			following: [1001, 1002],
			followers: [1001, 1002],
		});
	});
});

/** ********************** UPDATE A USER */

describe('update user profile', function () {
	const updateData = {
		first_name: 'newFirstName',
		last_name: 'newLastName',
		password: 'password',
		email: 'new@email.com',
		profile_image: 'img.png',
		bio: 'new bio',
	};

	it('works', async function () {
		let user = await User.update('testuser1', updateData);

		// mock last_modified
		user.lastModified = 100;

		expect(user).toEqual({
			id: 1000,
			username: 'testuser1',
			firstName: 'newFirstName',
			lastName: 'newLastName',
			email: 'new@email.com',
			profileImage: 'img.png',
			bio: 'new bio',
			lastModified: 100,
			isAdmin: false,
		});
	});

	it('returns bad request if no data', async function () {
		expect.assertions(1);
		try {
			await User.update('testuser1', {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/** ********************** REMOVE A USER */

describe('remove user', function () {
	it('works', async function () {
		await User.remove('testuser2');
		const res = await db.query(
			"SELECT * FROM users WHERE username='testuser2'"
		);
		expect(res.rows.length).toEqual(0);
	});

	it('throws not found if no such user', async function () {
		try {
			await User.remove('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/** ********************** GET A USER'S LIST OF LIKES */

describe("get a list of a user's likes", function () {
	it('works', async function () {
		let likes = await User.getUserLikes('testuser1');
		expect(likes).toEqual([
			{
				postId: testPostIds[0],
				imageFile: 'img.jpg',
			},
			{
				postId: testPostIds[1],
				imageFile: 'img.jpg',
			},
		]);
	});
});

/** ********************** GET A USER'S FOLLOWING */

describe("get a user's following", function () {
	it('works', async function () {
		let following = await User.getUserFollowing('testuser1');
		expect(following).toEqual([
			{
				userId: 1001,
				username: 'testuser2',
				firstName: 'firstname2',
				lastName: 'lastname2',
				profileImage: 'img.png',
			},
			{
				userId: 1002,
				username: 'testuser3',
				firstName: 'firstname3',
				lastName: 'lastname3',
				profileImage: 'img.png',
			},
		]);
	});
});

/** ********************** GET A USER'S FOLLOWERS */

describe("get a user's followers", function () {
	it('works', async function () {
		let followers = await User.getUserFollowers('testuser1');
		expect(followers).toEqual([
			{
				userId: 1001,
				username: 'testuser2',
				firstName: 'firstname2',
				lastName: 'lastname2',
				profileImage: 'img.png',
			},
			{
				userId: 1002,
				username: 'testuser3',
				firstName: 'firstname3',
				lastName: 'lastname3',
				profileImage: 'img.png',
			},
		]);
	});
});

/** ********************** LIKING A POST */

describe('like a post', function () {
	it('works', async function () {
		await User.addLike('testuser1', testPostIds[2]);

		let user = await db.query('SELECT * FROM users WHERE username=$1', [
			'testuser1',
		]);
		console.log(user);

		const res = await db.query(
			'SELECT * FROM likes WHERE post_id=$1 AND user_id=$2',
			[testPostIds[2], user.rows[0].id]
		);

		expect(res.rows).toEqual([
			{
				post_id: testPostIds[2],
				user_id: user.rows[0].id,
			},
		]);
	});

	it('throws unauthorized error if liking same post again', async function () {
		try {
			await User.addLike('testuser1', testPostIds[0]);
			fail();
		} catch (err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		}
	});
});

/** ********************** UNLIKING A POST */

describe('unlike a post', function () {
	it('works', async function () {
		await User.removeLike('testuser1', testPostIds[1]);

		let user = await db.query('SELECT * FROM users WHERE username=$1', [
			'testuser1',
		]);

		const res = await db.query(
			'SELECT * FROM likes WHERE post_id=$1 AND user_id=$2',
			[testPostIds[1], user.rows[0].id]
		);

		expect(res.rows.length).toEqual(0);
	});
});

/** ********************** FOLLOW ANOTHER USER */

describe('follow another user', function () {
	it('works', async function () {
		await User.followUser('testuser2', 1002);

		let user_following = await db.query(
			'SELECT * FROM users WHERE username=$1',
			['testuser2']
		);

		let user_followingId = user_following.rows[0].id;

		const res = await db.query(
			'SELECT * FROM follows WHERE user_following_id=$1 AND user_followed_id=$2',
			[user_followingId, 1002]
		);

		expect(res.rows).toEqual([
			{
				user_following_id: user_followingId,
				user_followed_id: 1002,
			},
		]);
		expect(res.rows.length).toEqual(1);
	});
});

/** ********************** UNFOLLOW A USER */

describe('unlike a post', function () {
	it('works', async function () {
		await User.unfollowUser('testuser1', 1001);

		let user1 = await db.query('SELECT * FROM users WHERE username=$1', [
			'testuser1',
		]);

		let user1_Id = user1.rows[0].id;

		const res = await db.query(
			'SELECT * FROM follows WHERE user_following_id=$1 AND user_followed_id=$2',
			[user1_Id, 1001]
		);

		expect(res.rows.length).toEqual(0);
	});
});

/** ********************** ADD A COMMENT */
describe('add a comment to a post', function () {
	it('works', async function () {
		const comment = {
			comment: 'wow nice picture!',
		};

		let res = await User.addComment('testuser1', testPostIds[1], comment);

		// mock datePosted
		res.datePosted = 100;

		expect(res).toEqual({
			id: expect.any(Number),
			comment: 'wow nice picture!',
			userId: 1000,
			postId: testPostIds[1],
			datePosted: 100,
		});
	});
});

/** ********************** REMOVE A COMMENT */
describe('remove a comment', function () {
	it('works', async function () {
		await User.removeComment(testPostIds[0], 500);

		let res = await db.query('SELECT * FROM comments WHERE id=$1', [500]);

		expect(res.rows.length).toEqual(0);
	});
});
