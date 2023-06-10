// index.js
// where your node app starts



// init project
var express = require('express');
const multer  = require('multer')
const upload = multer({ dest: 'public/' })
var app = express();

let bodyParser = require('body-parser');
const mongoose = require('mongoose');

//module.exports = app;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/whoami", function (req, res) {
  console.log(req.headers);
  res.json({"ipaddress":req.headers["x-forwarded-for"],"language":req.headers["accept-language"],
"software":req.headers["user-agent"]});
});




let dateResponse = {};
app.get('/apiX/:dateInput?',function(req, res) {

  var dateParam = req.params.dateInput;
  if(dateParam !== undefined)
  {
    if(/\d{5,}/.test(dateParam))
      {
        var dateResponseInt = parseInt(dateParam);
        dateResponse['unix'] = new Date(dateResponseInt).getTime();
        dateResponse['utc'] = new Date(dateResponseInt).toUTCString();
        console.log("here 2");
      }
    else{
      let dateObject = new Date(dateParam);
      if (dateObject.toString() === "Invalid Date") {
        res.json({ error: "Invalid Date" });
      } else {
        res.json({ unix: dateObject.valueOf(), utc: dateObject.toUTCString() });
      }
    }
  }
  else
  {
    dateResponse['unix'] = new Date().getTime();
    dateResponse['utc'] = new Date().toUTCString();
    console.log("here 4");
  }
  console.log(dateResponse);
  res.send(dateResponse);
});

let Urlshort;

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  urlFull: { type: String, required: true },
  hashid: String,
});
Urlshort = mongoose.model("Urlshort", urlSchema);


app.post("/api/shorturl", function (req, res) {
  console.log("1");
  console.log(req.body);
  //return res.json({});
  var urlInput = req.body.url;
  if(!urlInput.includes("http"))
    res.json({ error: 'invalid url' });
  
  var q = Urlshort.find({urlFull: urlInput});
  var existUrl = q.exec(function (err, data) {
      if (err) 
        return console.log(err);
      return data;
  });
  if(existUrl !== undefined)
    res.json({"original_url":existUrl.urlFull,"short_url":existUrl.hashid});
  else
  {
    var newUrl = new Urlshort({urlFull: urlInput, hashid: new Date().getTime()});

    newUrl.save(function(err, data) {
      if (err) return console.error(err);
      res.json({"original_url":data.urlFull,"short_url":data.hashid});
    });
  }
});

app.get("/api/shorturl/:id?", function (req, res) {
  console.log("2");
  console.log(req.params);
  //return res.json({});
  var urlInput = req.params.id;
  if(urlInput !== undefined)
  {
    var q = Urlshort.find({hashid: urlInput});
    var existUrl = q.exec(function (err, data) {
        if (err) 
          return console.log(err);
        res.redirect(data[0].urlFull);
        //return res.writeHead(301, { Location: data[0].urlFull }).end();
      });
  }
  //res.json({ error: 'invalid url' });
});


let UserEntity;

//const Schema = mongoose.Schema;
const UserEntitySchema = new Schema({
  username: { type: String, required: true },
  exercise: [
    {
      description: String,
      duration: Number,
      date: String
    }
  ]
});
UserEntity = mongoose.model("UserEntity", UserEntitySchema);


app.post("/api/users", function (req, res) {
  console.log(req.body);
  var userName = req.body.username;
  
  var newUser = new UserEntity({username: userName});
  
  newUser.save(function(err, data) {
      if (err) return console.error(err);
      res.json(data);
    });
});
app.get("/api/users", function (req, res) {
  console.log("GET /api/users");
  console.log(req.params);
  var result = UserEntity.find().exec().then((data) => {
    res.json(data);
  })
  .catch((err) => {
    console.error(err);
  });
});
const defaultDate = () => new Date().toISOString().slice(0, 10);
app.post("/api/users/:_id/exercises", function (req, res) {
  const userId = req.params._id; // userId from URL or from body
  const exObj = { 
    description: req.body.description,
    duration: +req.body.duration,
    date: req.body.date || new Date()
  }; 
  UserEntity.findByIdAndUpdate(
    userId, // find user by _id
    {$push: { exercise: exObj } }, 
    {new: true},
    function (err, updatedUser) {
      if(err) {
        return console.log('update error:',err);
      }
      let returnObj = {
        username: updatedUser.username,
        description: exObj.description,
        duration: exObj.duration,
       _id: userId,
        date: new Date(exObj.date).toDateString()
      };
      res.json(returnObj);
    }
  );
  
});
app.get("/api/users/:_id/logs", function (req, res) {
console.log("ZZZZZZ");
  UserEntity.findById({_id: req.params._id}, function (err, data) {
    console.log("ZZZZZZ");
    console.log(req.params);
    console.log(req.query);
    console.log(req.body);
    console.log(data.exercise);

    
    if(req.query.from != undefined)
      data.exercise = data.exercise.filter(e => e.date >= req.query.from && e.date <= req.query.to);
    if(req.query.limit != undefined)
      data.exercise = data.exercise.slice(0,req.query.limit);
    console.log(data.exercise);
      res.json({
        "_id":data._id,
        "username":data.username,
        //"log":data.exercise,
        "log": data.exercise.map((item) => ({
          description: item.description,
          duration: item.duration,
          date: new Date(item.date).toDateString()
        })),
        "__v":data.__v,
        "count":data.exercise.length
      });
    });
});


app.post("/api/fileanalyse",upload.single('upfile'), function (req, res, next) {
  console.log('uploaded file:',req.file);
  res.json({
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype
  });
})


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});