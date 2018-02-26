const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongostore = require('connect-mongodb-session')(session);
const renderFile = require('ejs').renderFile;
const passport = require('passport');
const csrf = require('csurf');
const flash = require('connect-flash');
require('dotenv').config();
const logger = require('winston');
const RateLimit = require('express-rate-limit');

const app = express();

const oauth2 = require('./routes/oauth2');
const auth = require('./routes/auth');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('.html', renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const dbStore = new mongostore({
  uri: process.env.MONGO_URI,
  collection: 'sessions'
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'zee',
  store: dbStore
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// non-csrf protected endpoints
app.use('/', oauth2);

// everything after this point uses the CSRF protection middleware
// and is also rate limited to 10 requests per minute
let authLimit = new RateLimit({
  windowMs: 60*1000, // 1 minute
  max: 10, // limit each IP to 100 requests per windowMs
  delayMs: 0 // disable delaying - full speed until the max limit is reached
});

//  apply to all requests
app.use(csrf({ cookie: true }));
app.use('/', authLimit, auth);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    logger.error(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      title: 'error'
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.log(err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    title: 'error'
  });
});


module.exports = app;
