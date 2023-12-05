var express = require('express')
var cors = require('cors')
var app = express()
app.use(cors())
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json() // แทรกหลัง part api
const bcrypt = require('bcrypt')//ไว้เข้ารหัส password
const saltRounds = 10 //ค่าตัวเลขที่ gen password
var jwt = require('jsonwebtoken') //
const secret = 'Fullstack-login-2023'

// get the client
const mysql = require('mysql2');

// create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'user_db'
});


app.post('/register',jsonParser, function (req, res, next) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    connection.query(
      'INSERT INTO user(email,password,fname,lname) VALUES (?,?,?,?)',
      [req.body.email,hash,req.body.fname,req.body.lname],
      function(err, results, fields) {
        console.log(results); // results contains rows returned by server
        console.log(fields); // fields contains extra meta data about results, if available
        if(err){
          res.json({status:'error',message:err})
          return
  
        }else{
          res.json({status:'insert success'})
        }
        
      }
    );
    // Store hash in your password DB.
});
  
})

app.post('/login',jsonParser, function (req, res, next) { 
  connection.query(
    'SELECT * FROM `user` WHERE `email` = ?' ,
    [req.body.email],
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({results}); return }

        bcrypt.compare(req.body.password, results[0].password, function(err, isLogin) { //password ที่ไม่ได้เข้ารหัสกับ ฐานข้อมูล users index ที่ 0 เพราะเอาแค่ตัวแรก  ตรงกันหรือไม่
          if(isLogin){
            var token = jwt.sign({ email: results[0].email }, secret,{expiresIn : '1h'});
            res.json({status: 'ok', message : 'login success',token}) // ถ้า login success จะสร้าง token ขึ้นมา
            
          }else{
            res.json({status: 'ok', message : 'login failed'})

          }
        });
      }
      
    
  );
  //ใช้ json web token ในการยืนยันตัว

})

app.post('/authen',jsonParser, function (req, res, next) { 
  try {
    const token = req.headers.authorization.split(' ')[1]
    var decoded = jwt.verify(token,secret);
    res.json({status: 'ok',decoded})

  } catch (err) {
    res.json({status: 'error',message: err.message})

  }

});

app.listen(3333, function () {
  console.log('CORS-enabled web server listening on port 3333')
})