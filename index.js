// index.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC 
var cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

let dateResponse = {};
app.get('/api/:dateInput?',function(req, res) {

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



// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});