const bcrypt = require('bcrypt');

const db = require('../db.js');
const { BCRYPT_WORK_FACTOR } = require('../config');

const testPostIds = [];

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM users');
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM posts');

	/** INSERT INTO USERS TABLE  */
	await db.query(
		`
    INSERT INTO users (id, username, password, first_name, last_name, email, profile_image, bio, is_admin)
	VALUES 
        (1000,
        'testuser1',
        $1,
        'firstname1',
        'lastname1',
        'tester1@test.com',
        'img.png',
        'Test Bio',
        FALSE),
        (1001,
        'testuser2',
        $2,
        'firstname2',
        'lastname2',
        'tester2@test.com',
        'img.png',
        'Test Bio',
        FALSE),
        (1002,
        'testuser3',
        $3,
        'firstname3',
        'lastname3',
        'tester3@test.com',
        'img.png',
        'Test Bio',
        FALSE)`,
		[
			await bcrypt.hash('password1', BCRYPT_WORK_FACTOR),
			await bcrypt.hash('password2', BCRYPT_WORK_FACTOR),
			await bcrypt.hash('password3', BCRYPT_WORK_FACTOR),
		]
	);

	/** INSERT INTO POSTS TABLE  */
	const resultsPosts = await db.query(`
    INSERT INTO posts (image_file, caption, user_id)
	VALUES 
        ('img.jpg', 'test!', 1000),
        ('img.jpg', 'test!', 1001),
        ('img.jpg', 'test!', 1002)
        RETURNING id`);
	testPostIds.splice(0, 0, ...resultsPosts.rows.map((p) => p.id));

	/** INSERT INTO LIKES TABLE  */
	await db.query(
		`
    INSERT INTO likes (user_id, post_id)
    VALUES 
        (1000, $1),
        (1000, $2),
        (1001, $3)
        `,
		[testPostIds[0], testPostIds[1], testPostIds[2]]
	);
	/** INSERT INTO FOLLOWS TABLE  */
	await db.query(
		`
    INSERT INTO follows(user_following_id, user_followed_id)
    VALUES 
        (1000, 1001),
        (1000, 1002),
        (1001, 1000),
        (1002, 1000),
        (1002, 1001)
        `
	);

	/** INSERT INTO COMMENTS TABLE */
	await db.query(
		`
        INSERT INTO comments (id, user_id, post_id, comment)
        VALUES
            (500, 1000, $1, 'awesome picture!'),
            (501, 1001, $2, 'looking great'),
            (502, 1002, $3, 'congrats dan!')
            `,
		[testPostIds[0], testPostIds[1], testPostIds[2]]
	);
}

/** Begins a transaction block
 * https://www.postgresql.org/docs/current/sql-begin.html
 */
async function commonBeforeEach() {
	await db.query('BEGIN');
}

/** Use COMMIT or ROLLBACK to terminate a transaction block */
async function commonAfterEach() {
	await db.query('ROLLBACK');
}

// closes connection to database
async function commonAfterAll() {
	await db.end();
}

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	testPostIds,
};
