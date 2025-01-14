require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');


const mongoose = require('mongoose');
const res = require('express/lib/response');
const uri = process.env.MONGO_URI;


// Basic Configuration
const port = process.env.PORT || 3000;
app. use(bodyParser.urlencoded({extended: false}));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(uri);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

const exerciseSchema = new mongoose.Schema({
  __id:{
    type: String,
    required: true
  },
  description:{
    type: String,
    required: true
  },
  duration:{
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const USER = new mongoose.model('USER', userSchema);
const EXERCISES = new mongoose.model('EXERCISES', exerciseSchema);

app.post("/api/users", async function(request, response){
  const userName = request.body.username;
  var add_user = false;
 await USER.find({username:`${userName}`}).then((doc)=>{
    if ( doc.length === 0 ) {
      add_user = true;
    }
  }).catch(err=>err);

  if ( add_user ) {
    // Create a user and add it.
    const new_user = new USER({
      username: `${userName}`
    });

    new_user.save().then(success =>{
    }).catch(err=>err);

    await USER.find({username:`${userName}`}).then(success=>{
        response.json({username: success[0].username, id: success[0].id});
    }).catch(err=>err);
  } else {
   await USER.find({username: `${userName}`}).then(success=>{
      response.json({username: success[0].username, id: success[0].id});
    }).catch(err=>err);
  }
});

app.post("/api/users/:__id/exercises", async function(request, response){
   const user_id = request.params.__id;
   var user_found = false;
   var _date = request.body.date;

  if ( !_date ) {
    _date = new Date();
  }

 await USER.find({_id: user_id}).then((doc)=>{
    if ( doc.length !== 0 ) {
      user_found = true;
    }
  }).catch(err=>err);

// Add the exercise info out.
if ( user_found ) {
  const new_exercise = new EXERCISES({
    __id: user_id,
    description: `${request.body.description}`,
    duration: parseInt(request.body.duration),
    date: _date
  });

  new_exercise.save().then((success)=>{
    console.log("Exercise added.");
  }).catch(err=>err);

  response.json({
    _id: user_id,
    description: `${request.body.description}`,
    duration: parseInt(request.body.duration),
    date: _date
  });
}
});

app.get("/api/users", async function(request, response){
  var Users = [];

  await USER.find({}).then((doc)=>{
    
    for ( let ind = 0; ind<doc.length; ind++ )
    {
      Users.push({username: doc[ind].username, _id: doc[ind].id});
    }
  }).catch(err=>err);

  response.send(Users);
});

app.get("/api/users/:_id/logs", async function(request, response){
  // Query parameters to check for
  const from = request.query.from;
  const to = request.query.to;
  const limit = request.query.limit;

  console.log(`${from} to ${to}. LIMIT = ${limit}`);
  const date_reg = /[0-9]{4}\-{1}[0-9]{1,2}\-{1}[0-9]/;
  var valid_dates = false;
  if (date_reg.test(from) && date_reg.test(to)) {
    valid_dates = true;
  } else{
  }

  const user_id = request.params._id;
  var exerciseArray = [];
  console.log(`user_id: ${user_id}.`);
  EXERCISES.find({__id: `${user_id}`, date:{
    $gt: new Date(from),
    $lte: new Date(to)
  }}).limit(parseInt(limit)).then((doc)=>{
    console.log(`${user_id}'s logs:`);
    console.log(doc);
    for (let i = 0; i < doc.length; i++ ) {
      exerciseArray.push({description: `${doc[i].description}`,
      duration: parseInt(doc[i].duration),
    date: new Date(doc[i].date).toDateString()});
    }
    response.json({'count':doc.length, log: exerciseArray});
  }).catch(err=>{
    console.error(err);
});
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
