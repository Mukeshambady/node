var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const hbs = require('express-handlebars');
//const hbshelpers = require("handlebars-helpers");//calling handelebar healpers
var app = express();

var fileUpload = require('express-fileupload')
var db = require('./config/connection')//calling db config file
var session = require('express-session')
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// //custome helper function engine setting
const chbs = hbs.create({
  extname: 'hbs',
  defaultLayout: 'layout',
  LayoutDir: __dirname + '/views/layout',
  partialsDir: __dirname + '/views/partials/',

  //create custom helper
  helpers:{
    numbering:(value)=>{
      return value + 1
    }
  }
})
app.engine('hbs',chbs.engine)

// with out custom helper only need this kind of engine creation.
// app.engine('hbs',  
//   hbs({ 
//   extname: 'hbs', 
//   defaultLayout: 'layout', 
//   LayoutDir: __dirname + '/views/layout', 
//   partialsDir: __dirname + '/views/partials/' 
// }))

// middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//new middilewares
app.use(fileUpload())
app.use(session({
  secret: "Key",
  cookie: { maxAge: 60000 }
}))//session settings
db.connect((err) => {
  if (err) console.log('Connection Error ' + err);
  else console.log('Database Connected succesffully');
})//db connect
app.use('/admin', adminRouter);
app.use('/', usersRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
