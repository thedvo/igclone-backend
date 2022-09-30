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
