var 	http = require('http'),
    	express = require('express'), 
	path = require('path'),
	bodyParser = require('body-parser'),
	rs = require('@risingstack/trace');

MongoClient = require('mongodb').MongoClient,
Server = require('mongodb').Server,
CollectionDriver = require('./collectionDriver').CollectionDriver;

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

var mongoHost = 'localHost';
var mongoPort = 27017; 
var collectionDriver;
var mongoClient = new MongoClient(new Server(mongoHost, mongoPort));
var url = 'mongodb://localhost:27017/mongo-server';

MongoClient.connect(url, function(error, db) {
	if (error) {
		console.error("Unable to connect to MongoDB. Please make sure mongod is running on %s.",url);
		process.exit(1);
	}
	console.log("Connected to MongoDB successfully.");
	collectionDriver = new CollectionDriver(db);
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/:collection', function(req, res) {
   var params = req.params;
   collectionDriver.findAll(req.params.collection, function(error, objs) {
    	  if (error) { res.send(400, error); }
	      else { 
	          if (req.accepts('html')) {
    	          res.render('data',{objects: objs, collection: req.params.collection});
              } else {
	          res.set('Content-Type','application/json');
                  res.status(200).send(objs);
              }
         }
   	});
});
 
app.get('/:collection/:entity', function(req, res) {
   var params = req.params;
   var entity = params.entity;
   var collection = params.collection;
   if (entity) {
       collectionDriver.get(collection, entity, function(error, objs) {
          if (error) { res.status(400).send(error); }
          else { res.status(200).send(objs); }
       });
   } else {
      res.status(400).send({error: 'bad url', url: req.url});
   }
});

app.post('/:collection', function(req, res) {
    var object = req.body;
    var collection = req.params.collection;
    collectionDriver.save(collection, object, function(err,docs) {
          if (err) { res.status(400).send(err); }
          else { res.status(201).send(docs); }
     });
});

app.put('/:collection/:entity', function(req, res) {
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
       collectionDriver.update(collection, req.body, entity, function(error, objs) {
          if (error) { res.status(400).send(error); }
          else { res.status(200).send(objs); }
       });
   } else {
       var error = { "message" : "Cannot PUT a whole collection" };
       res.status(400).send(error);
   }
});

app.delete('/:collection/:entity', function(req, res) { //A
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
       collectionDriver.delete(collection, entity, function(error, objs) { //B
          if (error) { res.send(400, error); }
          else { res.send(200, objs); } //C 200 b/c includes the original doc
       });
   } else {
       var error = { "message" : "Cannot DELETE a whole collection" };
       res.send(400, error);
   }
});

app.use(function (req,res) {
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
