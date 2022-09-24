const express = require('express');
const { NotFoundError } = require('./expressError');

const { authenticateJWT } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/post');

const morgan = require('morgan');
const cors = require('cors');
// Cross-Origin Resource Sharing. Allows our React frontend access to our backend API.
// Reason for use is because there are 2 separate servers for frontend & backend. Without cors, can't connect because of server security.

/**
 Execute express as a function and store the return value in App.
    - this "app" variable will contain methods we can use such as "app.listen, app.use, etc."
    - can see the other methods in Express documentation

 Similar to how in Flask, we import Flask and then we call Flask and save that to a variable called app. Define routes using @app.something
 */
const app = express();

// place middleware above routes so they can run on every incoming request.
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use(authenticateJWT);

// Route Handlers
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/post', postRoutes);

// error handler middleware is placed at the bottom of app file because error handlers will only run if none of the routes match the request being made.

/** Handle 404 errors -- this mathces everything */
app.use(function (req, res, next) {
	return next(new NotFoundError());
});

/** Generic error handler. Anything unhandled goes here.
 * If any routes are not handled, this will run.
 * "err" parameter refers to the error which is returned when we try/catch a route.
 */
app.use(function (err, req, res, next) {
	if (process.env.NODE_ENV !== 'test') console.error(err.stack);

	// the default status is 500 Internal Server Error
	const status = err.status || 500;
	const message = err.message;

	// sets the status and alert the user
	return res.status(status).json({
		error: { message, status },
	});
});

module.exports = app;
