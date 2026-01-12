const path = require('path');

const createHttpError = require('http-errors');
const express = require('express');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { morganStream } = require('./logger');

const MySQLStore = require('express-mysql-session')(session);
const { customConnectionPool } = require('./database');
const sessionStore = new MySQLStore({}, customConnectionPool);

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// 使用ejs作为模板引擎，并将文件扩展名设置为.html
app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set('trust proxy', true);

app.use(morgan(process.env.MORGAN_OPTION, { stream: morganStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
	defParamCharset: 'utf8'
}));
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	store: sessionStore,
	cookie: {
		maxAge: 60 * 60 * 1000, // 默认1小时
		httpOnly: true,
		secure: isProduction,
		sameSite: 'lax'
	}
}));
app.use((req, res, next) => {
	res.locals.isProduction = isProduction;
	next();
});

const mainRoute = require('./routes/mainRoute');
const apiRoute = require('./routes/apiRoute');
const loginRoute = require('./routes/loginRoute');
const historyRoute = require('./routes/historyRoute');
app.use('/api', apiRoute);
app.use('/login', loginRoute);
app.use('/history', historyRoute);
app.use('/', mainRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createHttpError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.isProduction = isProduction;
	res.locals.message = err.message;
	res.locals.error = !isProduction ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;