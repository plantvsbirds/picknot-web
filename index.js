var request = require('request');
var colors = require('colors');
var ejs = require('ejs');
var ecstatic = require('ecstatic');
var Db = require('mongodb').Db,
  MongoClient = require('mongodb').MongoClient,
  Server = require('mongodb').Server,
  ReplSetServers = require('mongodb').ReplSetServers,
  ObjectID = require('mongodb').ObjectID,
  Binary = require('mongodb').Binary,
  GridStore = require('mongodb').GridStore,
  Grid = require('mongodb').Grid,
  Code = require('mongodb').Code,
  BSON = require('mongodb').pure().BSON,
  assert = require('assert');
var rl = require('readline');
var MongoClient = require('mongodb').MongoClient,
  format = require('util').format;

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
  console.log('SOCKET: PAGE OPENED'.green.inverse);
  socket.on('disconnect', function(){
    console.log('SOCKET: PAGE CLOSED'.red.inverse);
  });

  socket.on('binded', function(msg){
    console.log('SERVER: DEVICE REFRESHED'.cyan.inverse + msg);
    io.emit('binded',msg);
  });

  socket.on('morning',function (device) {
    MongoClient.connect('mongodb://127.0.0.1:27017/picknot',function (err,db){
      db.collection('device').findOne({ id : device }, function (err,dev) {
        if (dev === null) {

        } else {

        }
      });
    }); 
  })
});

http.listen(80, function(){

app.use(ecstatic({ root: __dirname + '/views' }));
app.engine('html', require('ejs').renderFile);

app.get('/',function (req,res) {
  res.end('asdasd');
})

app.get('/manage/:id',function (req,res) {
  console.log('SERVER: MANAGE PAGE OPENED');
  var device = req.params.id;
  res.render('manage.ejs',{
    device : device
  });
});
app.all('/set/:id/:sina',function (req,res) {
  MongoClient.connect('mongodb://127.0.0.1:27017/picknot',function (err,db){
    db.collection('device').update({
      id : req.params.id
    },{
       $push : { wb : req.params.sina }
    },{
      upsert : true
    },function (err,dev) {
      res.render('msg.ejs',{
        msg : '已将设备与@'+req.params.sina+'关联。',
        device : req.params.id
      });
    });
  })
});
app.get('/show/:id', function (req, res) {
  var device = req.params.id;
  MongoClient.connect('mongodb://127.0.0.1:27017/picknot',function (err,db){
    db.collection('device').findOne({ id : device }, function (err,dev) {
      console.log('SERVER: DEVICE SHOWING'.cyan.inverse,dev);
      if (dev === null) {
        res.render('show.ejs',{
          pics : [
            {
              src : 'http://placehold.it/1200x600&text=Scan%20QRCode%20to%20SETUP',
              text : '请扫描二维码来配置你的相框'
            }
          ],
          device : device,
          names : []
        });
      } else {
        var arrHash = {};
        dev.wb.forEach(function (e){
          arrHash[e] = true;
        })
        var nameList = Object.keys(arrHash);
        getWeiboPicUrl(nameList,function (err,arr,names) {
          res.render('show.ejs',{
            pics : arr,
            device : device,
            names : names
          });
        });
      }
    });
  });
});


function getWeiboPicUrl(arr,callback) {
  var ans = [];
  request.get('http://api.t.sina.com.cn/statuses/user_timeline/'+encodeURIComponent(arr[0])+'.json?source=209678993&feature=12&count=5'
  ,function (error, response, body) {
    var obj = JSON.parse(response.body);
    var data=[];
    obj.forEach(function (e){
      data.push({
        text : e.text,
        src : e.original_pic
      });
    });
    if (arr.length > 1) {
      getWeiboPicUrl(arr.splice(1,arr.length - 1),function (err,subData,subArr){
        var ans = data.concat(subData);
        var nameList = arr.concat(subArr);
        var tempHash = {};
        nameList.forEach(function (e) {
          tempHash[e] = true;
        });
        nameList = Object.keys(tempHash);
        ans.sort(function (left,right) {
          return Math.random() > 0.5;
        });
        callback(err,ans,nameList);
      })
    } else {
      callback(error,data,arr);
    }
  });
}

//getWeiboPicUrl('genmfz');


  console.log('SERVER: LINTENING'.rainbow.inverse);
  var rlInterface = rl.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  function prompt (){
    rlInterface.question("", function(id) {
      console.log("EXERCUTED REFRESH".rainbow.inverse, id);
      io.emit('binded',id);
      prompt();
    });
  }
  prompt();
});
