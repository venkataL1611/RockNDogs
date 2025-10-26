var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs=require('express-handlebars');
var mongoose=require('mongoose'),
    mongoosastic=require('mongoosastic');
var session=require('express-session');
var passport = require('passport');
require('./config/passport');
var expressLayouts = require('express-ejs-layouts');
var ejs = require('ejs');
var engine = require('ejs-mate');


var indexRouter = require('./routes/index');



var app = express();
mongoose.connect('mongodb://localhost:27017/shopping');


// view engine setup
app.engine('.hbs',expressHbs({defaultLayout:'layout',extname:'.hbs'}));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Sessions (dev-only MemoryStore; replace with connect-mongo in production)
app.use(session({
    secret: 'rockndogs-secret',
    resave: false,
    saveUninitialized: false
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Expose auth/cart info to templates
app.use(function(req, res, next) {
    res.locals.isAuthenticated = !!req.user;
    res.locals.user = req.user;
    res.locals.cart = req.session.cart || { totalQty: 0, totalPrice: 0, items: [] };
    next();
});
/*app.use(expressLayouts);
app.use(ejs);
app.use(engine);*/


app.use('/', indexRouter);
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/cart'));


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
