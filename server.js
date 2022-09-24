const app = require('./app');
const { PORT } = require('./config');

/**  
app.listen takes 2 callbacks:
    - Port --> binds the server to port & listens for requests there
    - Callback Function --> calls callback function once server has started up (in this case the console.log())

    *****app.listen should always be at the BOTTOM of your file.*****
 */

app.listen(PORT, function () {
	console.log(`Started on http://localhost:${PORT}`);
});
