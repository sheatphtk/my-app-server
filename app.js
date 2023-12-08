var express = require('express')
var cors = require('cors')
var app = express()
app.use(cors()) // ทำให้ web server ใช้ได้
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json() // แทรกหลัง part api
const bcrypt = require('bcrypt')//ไว้เข้ารหัส password
const saltRounds = 10 //ค่าตัวเลขที่ gen password
var jwt = require('jsonwebtoken') //
const secret = 'Fullstack-login-2023'
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function(req,file,cb){
    return cb(null,"./public/Images")
},
filename: function (req,file,cb){
  return cb(null,`${Date.now()}_${file.originalname}`)

}

})
const upload = multer({storage})


// get the client
const mysql = require('mysql2');

// create the connection to database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'user_db'
});
app.post('/register',jsonParser, function (req, res, next) {
  console.log(res)
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
          res.json({status:'success',message:'register success'})
        }
        
      }
    );
  
}); 
  
})

app.post('/insertimg', upload.single('file'), (req, res)=>{
  
 
  console.log(req);
  connection.query(
    'INSERT INTO banner(banner_name,banner_shop_id) VALUES (?,?)',
    [req.file.filename,req.body.selectedOption],
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
 

})


app.post('/createshop',jsonParser, function (req, res, next) {
 
    connection.query(
      'INSERT INTO shop(shop_name,address,shop_lat,shop_lng) VALUES (?,?,?,?)',
      [req.body.shopname,req.body.shopaddress,req.body.shoplat,req.body.shoplng],
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
            res.json({status: 'error', message : 'login failed'})

          }
        });
      }
      
    
  );
  //ใช้ json web token ในการยืนยันตัว

})
//select
app.get('/user', function(req, res) { 
  connection.query(
    'SELECT * FROM `user`' ,
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        res.send(results);
      }  
  );
})
app.get('/selectshop', function(req, res) { 
  connection.query(
    'SELECT shop_id,shop_name FROM shop WHERE NOT EXISTS (SELECT 1 FROM banner WHERE banner.banner_shop_id = shop.shop_id )' ,
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        res.send(results);
      }  
  );
})

app.get('/banner', function(req, res) { 
  connection.query(
    'SELECT * FROM `banner`' ,
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        res.send(results);
      }  
  );
})
app.get('/shopalldetail', function(req, res) { 
  connection.query(
    'SELECT * FROM shop INNER JOIN banner ON shop.shop_id = banner.banner_shop_id' ,
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        res.send(results);
      }  
  );
})
app.get('/shop', function(req, res) { 
  connection.query(
    'SELECT * FROM `shop`' ,
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        res.send(results);
      }  
  );
})
app.get('/getuserbyid/:id', function(req, res) { 
  const id = req.params.id;
  connection.query(
    'SELECT * FROM `user` WHERE user_id = ?' ,id,
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        else{
          res.json({status:'success',user:results})
          return
      }
      }  
  );
})

app.get('/getshopbyid/:id', function(req, res) { 
  const id = req.params.id;
  connection.query(
    'SELECT * FROM `shop` WHERE shop_id = ?' ,id,
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        else{
          res.json({status:'success',user:results})
          return
      }
      }  
  );
})

app.get('/getShopdetailbyid/:id', function(req, res) { 
  const id = req.params.id;
  connection.query(
    'SELECT * FROM shop INNER JOIN banner ON shop.shop_id = banner.banner_shop_id WHERE shop.shop_id =?' ,id,
   
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        else{
          res.json({status:'success',user:results})
          return
      }
      }  
  );
})


app.get('/getBannerdetailbyid/:id', function(req, res) { 
  const id = req.params.id;
  connection.query(
    'SELECT * FROM banner WHERE banner_id =?' ,id,
   
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        else{
          res.json({status:'success',user:results})
          return
      }
      }  
  );
})
app.post('/createuser',jsonParser, function(req, res) { 
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    connection.query(
      'INSERT INTO user(email,password,fname,lname,type) VALUES (?,?,?,?,?)',
      [req.body.email,hash,req.body.fname,req.body.lname,req.body.type],
      function(err, results, fields) {
        console.log(results); // results contains rows returned by server
        console.log(fields); // fields contains extra meta data about results, if available
        if(err){
          res.json({status:'error',message:err})
          return
  
        }else{
          res.json({status:'success',message:'usercreate success!'})
          return
        }
        
      }
    );
    // Store hash in your password DB.
});
})
app.delete('/deleteuser',jsonParser,function(req,res) {
 
  connection.query(
    'DELETE FROM user WHERE user_id = ?',[req.body.id],
    (err,results)=>{
      console.log(results)
      if(err) {
        res.json({status:'error',message:err})
        return
        
      }else{
        res.json({status:'success',message:'delete success'})
        return

      }
    }
  );


})
app.delete('/deleteshop',jsonParser,function(req,res) {
 
  connection.query(
    'DELETE FROM shop WHERE shop_id = ?',[req.body.id],
    (err,results)=>{
      
      if(err) {
        res.json({status:'error',message:err})
        return
        
      }else{
        res.json({status:'success',message:'delete success'})
        return

      }
    }
  );
})
 //deletebannerByShopId
 app.delete('/deletebannerByShopId',jsonParser,function(req,res) {
  console.log('----------------------->')
  console.log(req)
  connection.query(
    'DELETE FROM banner WHERE banner_shop_id = ?',[req.body.id],
    (err,results)=>{
      console.log(results)
      if(err) {
        res.json({status:'error',message:err})
        return
        
      }else{
        res.json({status:'success',message:'delete success'})
        return

      }
    }
  );
})
app.delete('/deletebanner',jsonParser,function(req,res) {
 
  connection.query(
    'DELETE FROM banner WHERE banner_id = ?',[req.body.id],
    (err,results)=>{
      console.log(results)
      if(err) {
        res.json({status:'error',message:err})
        return
        
      }else{
        res.json({status:'success',message:'delete success'})
        return

      }
    }
  );


})
app.put('/updateUser',jsonParser, function(req, res) { 
  connection.query(
    'UPDATE user SET email = ?,fname = ?,lname = ?,type = ? WHERE user_id = ? '  ,[req.body.email,req.body.fname,req.body.lname,req.body.type,req.body.id],
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        else{
          res.json({status:'success',message:'update success'})
          return
      }
      }  
  );
})
app.put('/updateShop',jsonParser, function(req, res) { 
  connection.query(
    'UPDATE shop SET shop_name = ?,address = ?,shop_lat = ?,shop_lng = ? WHERE banner_id = ? '  ,[req.body.shop_name,req.body.shop_address,req.body.shop_lat,req.body.shop_lng,req.body.id],
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        else{
          res.json({status:'success',message:'update success'})
          return
      }
      }  
  );
 
})

app.put('/updateimg', upload.single('file'), (req, res)=>{
  
 
  console.log(req);
  connection.query(
    'UPDATE banner SET banner_name = ?,banner_shop_id = ? WHERE banner_id = ? ',
    [req.file.filename,req.body.shopid,req.body.id],
    function(err, results, fields) {
      console.log(results); // results contains rows returned by server
      console.log(fields); // fields contains extra meta data about results, if available
      if(err){
        res.json({status:'error',message:err})
        return

      }else{
        res.json({status:'update success'})
      }
      
    }
  );
 

})

app.post('/authen',jsonParser, function (req, res) { 

 try {
    const token = req.headers.authorization.split(' ')[1]
    var decoded = jwt.verify(token,secret);
    res.json({status: 'ok',decoded})

  } catch (err) {
    res.json({status: 'error',message: err.message})

  }

});
app.post('/user', function(req, res) { 
  connection.query(
    'SELECT * FROM `user`' ,
    function(err, results, fields) {
      console.log(results);
        if(err){res.json({status:'error',message:err}); return }
        if(results.length === 0){res.json({message : 'data not found'}); return }
        res.send(results);
      }  
  );
})
app.get('/public/Images/:filename', (req, res) => {
  var path = require('path');
  console.log(req.params.filename);
 
  res.sendFile(req.params.filename, 
    {root: path.join(__dirname,'/public/Images/')});
    
  })



app.listen(3333, function () {
  console.log('CORS-enabled web server listening on port 3333')
})