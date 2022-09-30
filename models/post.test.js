const { NotFoundError, BadRequestError } = require('../expressError');
const db = require('../db.js');
const Post = require('./post.js');
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

/************************************** create */

describe('create a post', function () {
	let newPost = {
		image_file:
			'https://images.freeimages.com/images/previews/272/simple-apple-1327953.jpg',
		caption: 'test creating a post',
	};

	it('works', async function () {
		let post = await Post.create(newPost, 'testuser1');
		console.log(post);

		expect(post).toHaveProperty(
			'id',
			'imageFile',
			'caption',
			'datePosted',
			'userId'
		);
	});
});

describe('findAll posts', function () {
	it('works', async function () {
		let posts = await Post.findAll();

		posts.map((p) => (p.datePosted = 100));
		// reason we set datePosted is to mimic a mock timestamp

		console.log(posts);

		// console.log(editedPosts);
		expect(posts).toEqual([
			{
				id: testPostIds[0],
				imageFile: 'img.jpg',
				caption: 'test!',
				datePosted: 100,
				userId: 1000,
				username: 'testuser1',
				profileImage: 'img.png',
			},
			{
				id: testPostIds[1],
				imageFile: 'img.jpg',
				caption: 'test!',
				datePosted: 100,
				userId: 1001,
				username: 'testuser2',
				profileImage: 'img.png',
			},
			{
				id: testPostIds[2],
				imageFile: 'img.jpg',
				caption: 'test!',
				datePosted: 100,
				userId: 1002,
				username: 'testuser3',
				profileImage: 'img.png',
			},
		]);
	});
});

describe('get an individual post by its ID', function () {
	it('works', async function () {
		let post = await Post.get(testPostIds[0]);

		// reason we set datePosted is to mimic a mock timestamp
		post.datePosted = 100;

		expect(post).toEqual({
			postId: testPostIds[0],
			imageFile: 'img.jpg',
			caption: 'test!',
			datePosted: 100,
			user: [
				{
					id: 1000,
					username: 'testuser1',
					profileImage: 'img.png',
				},
			],
			likes: [
				{
					userId: 1000,
					username: 'testuser1',
				},
			],
			comments: [
				{
					commentId: 500,
					comment: 'awesome picture!',
					username: 'testuser1',
				},
			],
		});
	});

	it('shows not found if no such post exists', async function () {
		try {
			await Post.get(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

describe('remove post', function () {
	it('works', async function () {
		await Post.remove(testPostIds[0]);
		const res = await db.query('SELECT id FROM posts WHERE id=$1', [
			testPostIds[0],
		]);
		expect(res.rows.length).toEqual(0);
	});

	it('shows not found if no such post', async function () {
		try {
			await Post.remove(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
