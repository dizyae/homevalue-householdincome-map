var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var usernames = [];
var userCount = 0;

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var port = process.env.PORT ? process.env.PORT : 3000;
console.log(port);

app.set('port', port);

var server = http.createServer(app);
server.listen(port);

var io = require('socket.io').listen(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

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
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

io.sockets.on('connection', function (socket) {

  socket.on('requestFIPS', function (coords) {
    
    getFIPS(coords, socket);
    
    // io.sockets.emit('showUsers', usernames);
  });

});

function getData(coords, socket)
{
  getFIPS(coords, socket);
}

function getFIPS (coords, socket)
{
  http.request(
  {
    host:'data.fcc.gov',
    path:'/api/block/find?latitude=' + coords.lat + '&longitude=' + coords.lng + '&showall=false&format=json'
  },
  function (response) {
    var fipsString = '';

    response.on('data', function (chunk) {
      fipsString += chunk;
    });

    response.on('end', function () {
      fipsObj = JSON.parse(fipsString);
      if(fipsObj.Block.FIPS == null)
      {
        socket.emit('noData', 'No Data.');
      }
      else
      {
        getCensusData(censusApiUrl(fipsObj.Block.FIPS), socket);
      }
    });
  }).end();
}

function censusApiUrl (FIPS)
{
  var state = FIPS.substring(0,2);
  var county = FIPS.substring(2,5);
  var tract = FIPS.substring(5,11);
  
  var output = {
    host:'api.census.gov',
    path:'/data/2011/acs5?get=B25077_001E,B19113_001E&for=tract:' + tract + '&in=state:' + state + '+county:' + county + '&key=8301967e6a54a3c2cee1afbd468c83930eb503b9'
  }

  return output;
}

function getCensusData (url, socket)
{
  http.request(url, function (response) {
    var censusDataString = '';

    response.on('data', function (chunk) {
      censusDataString += chunk;
    }); 

    response.on('end', function () {
      data = JSON.parse(censusDataString);

      var homeValue = data[1][0];
      var income = data[1][1];

      socket.emit('displayData', {'homeValue':homeValue,'income':income});
    });
  }).end();
}


module.exports = server;
