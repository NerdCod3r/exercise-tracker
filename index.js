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
    required: true,
    unique: true
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
    type: String,
    required: true
  }
});

const USER = new mongoose.model('USER', userSchema);
const EXERCISES = new mongoose.model('EXERCISES', exerciseSchema);

app.post("/api/users", async function(request, response){
  const userName = request.body.username;
  if ( !userName ) {
    response.json({error: "Enter a valid username"});
  }
  available = false;
  USER.find({username: `${userName}`}).then((doc)=>{
    console.log(doc);
    if ( doc.length === 0 ) {
      available = true;
    }
  }).catch(err=>err);

  if ( available ) {
    response.json({error: "Username already exists. Pick a new one"});
  }

  const new_user = new USER({
    username: `${userName}`
  });
  new_user.save().then((doc)=>{
    response.json({username:`${userName}`, _id: doc.id});
  }).catch(err=>err);
});

app.post("/api/users/:__id/exercises", async function(request, response){
   const user_id = request.params.__id;
   var user_found = false;
   var _date = request.body.date;
   var userName = "";

  if ( !_date ) {
    _date = new Date().toDateString();
  } else {
    _date = new Date(_date).toDateString();
  }

 await USER.find({_id: user_id}).then((doc)=>{
    if ( doc.length !== 0 ) {
      user_found = true;
      userName = doc[0].username;
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
    username: userName,
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

app.get('/api/users/:_id/logs', async (req, res) => {
  const user_id = req.params._id;
  var {from, to, limit} = req.query;
  const date_reg = /[0-9]{4}\-{1}[0-9]{1,2}\-{1}[0-9]/;

  var userName = "Unknown";

  await USER.find({_id: user_id}).then(doc=>{
   userName = doc[0].username;
  }).catch(err=>err);

 var exercise_logs = [];

 await EXERCISES.find({__id: `${user_id}`}).then((doc)=>{
  exercise_logs = doc;
 }).catch(err=>err);

 // Handle from
 if (from && !date_reg.test(from) || to && !date_reg.test(to) ) {
  response.json({error: 'invalid date format. \'YYYY-MM-DD\' REQUIRED'});
 }
 var filtered_logs_from = [];
 if ( from && date_reg.test(from)){
  for ( let i = 0; i < exercise_logs.length; i++ ) {
    const curr_obj = exercise_logs[i];
    const _date = curr_obj.date;

    if (new Date(from) <= new Date(_date)) {

      if (to && date_reg.test(to)) {
        if (new Date(to) >= new Date(_date)) {
          filtered_logs_from.push(curr_obj);
        }
      }else {
        filtered_logs_from.push(curr_obj);
      }
    }
  }
  exercise_logs = filtered_logs_from;
 }
 if (limit && !parseInt(limit)) {
  res.json({error: 'limit should be a positive integer'});
 }

 if (limit && parseInt(limit) && exercise_logs.length > parseInt(limit)) {
  exercise_logs = exercise_logs.slice(0, parseInt(limit));
}
 
 res.json({
  username: `${userName}`, 
  _id: user_id, 
  count: exercise_logs.length,
  log: exercise_logs
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
