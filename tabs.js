var express = require('express');

var MongoStore = require('connect-mongo')(express);

var mongo = require('mongodb');

var server = new mongo.Server('localhost', 27017, { auto_reconnect: true });
var db = new mongo.Db('tabs', server, { safe: true });

var TABS;

function initDb(cb) {
  db.open(function (err, tabsDb) {
    if (err) {
      console.error("Error: " + err);
    }

    tabsDb.createCollection('tabs', function (err, tabsCollection) {
      TABS = tabsCollection;

      cb();
    });
  });
}

// Create an HTTP server
var app = express();

// Setup for the express web framework
app.configure(function () {
  app.set('view engine', 'swig');

  app.use(express.logger());
  app.use(express['static'](__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      db: 'tabs-sessions'
    })
  }));
  app.use(app.router);
});

// We want exceptions and stracktraces in development
app.configure('development', function () {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

// ... but not in production
app.configure('production', function () {
  app.use(express.errorHandler());
});

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/tabs', function (req, res) {
  if (req.param('access_token') === 'abc123') {
    TABS.findOne({ _id: req.param('id') },
      function (err, tabs) {
      if (err) {
        return res.send(err, 500);
      }

      res.send(tabs);
    });

    return;
  }

  res.send(500);
});

app.post('/tabs', function (req, res) {
  if (req.param('access_token') === 'abc123') {
    if (req.body.id && req.body.tabs) {
      TABS.update({ _id: req.body.id },
        { $pushAll: { tabs: req.body.tabs } },
        { upsert: true },
        function (err) {
        if (err) {
          return res.send(err, 500);
        }

        res.send(200);
      });

      return;
    }
  }

  res.send(500);
});

initDb(function () {
  app.listen(process.env.PORT);
});
