/**
 * Middleware is useful for:
 *  - ensuring users are authenticated
 *  - ensuring that a user is authorized to access an endpoint
 */

const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const { UnauthorizedError } = require('../expressError');

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username/userID and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
	try {
		const authHeader = req.headers && req.headers.authorization;
		if (authHeader) {
			const token = authHeader.replace(/^[Bb]earer /, '').trim();
			res.locals.user = jwt.verify(token, SECRET_KEY);
		}
		return next();
	} catch (err) {
		return next();
	}
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
	try {
		if (!res.locals.user)
			// if (!req.user)
			throw new UnauthorizedError(`Unauthorized. Please sign up or login.`);
		return next();
	} catch (err) {
		return next(err);
	}
}

/** Middleware to use to ensure the correct logged in user or they are an admin */

function verifyUserOrAdmin(req, res, next) {
	try {
		// The res.locals is an object that contains the local variables for the response which are scoped to the request only and therefore just available for the views rendered during that request or response cycle.

		// This property is useful while exposing the request-level information such as the request path name, user settings, authenticated user, etc.
		const user = res.locals.user;
		// const user = req.user;

		// if not user AND admin or the userId matches the userId in the parameter
		if (!(user && (user.isAdmin || user.username === req.params.username))) {
			throw new UnauthorizedError();
		}
		return next();
	} catch (err) {
		return next(err);
	}
}

module.exports = {
	authenticateJWT,
	ensureLoggedIn,
	verifyUserOrAdmin,
};
