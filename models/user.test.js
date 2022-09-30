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
