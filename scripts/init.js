#! /usr/bin/env node
console.log('\nIMP init start...');
var fs = require('fs')
  , path = require('path')
  , util = require('util')
  , mongoose = require('mongoose')
  , async = require('async')
  , config= require('../config');

// mongodb connect
mongoose.connect(config.database.url, function(err){
  if(err){
    console.log('connect to db error: ' + err.message);
    process.exit(1);
  }
});

// Models
require('../models/tag');
require('../models/person');
require('../models/investment');

var Tag = mongoose.model('Tag'),
    Person = mongoose.model('Person'),
    Investment = mongoose.model('Investment');

async.waterfall([
  function(callback){
    var basedir = path.normalize(__dirname + '/../')
      , tmpdir = path.join(basedir, 'tmp')
      , uploaddir = path.join(basedir, 'public/uploads');

    async.series([
      function(callback){
        fs.exists(tmpdir, function(exists){
          if(!exists){
            fs.mkdir(tmpdir, function(){
              console.log('tmp directory was successfully created.');
              callback(null, tmpdir);
            });
          }
          else{
            callback(null, tmpdir);
          }
        });
      },
      function(callback){
        fs.exists(uploaddir, function(exists){
          if(!exists){
            fs.mkdir(uploaddir, function(){
              console.log('upload directory was successfully created.');
              callback(null, uploaddir);
            });
          }
          else{
            callback(null, uploaddir);
          }
        });  
      }
  
    ],
    function(err, results){
        console.log('set env done');
        callback();
    });    
  },
  
  function(callback){
    Person.findOne({ 'email': config.application.root_account }, function(err, person){
      if(person){
        console.log('root account already exist!\nAcorn init exited.');
        mongoose.disconnect();
        process.exit(0);
      }
      else{
        var person = new Person();
        person.email = config.application.root_account;
        person.salt = 'salt1336484866068';
        person.hashed_password = 'f4a5bd2867e9bd5cf79a8b31348c03d27993f561'; // origin_password: 123456
        person.name = '管理员';
        person.avatar = '/images/icon_avatar.png';
        person.active = true;
        person.save(function(err){
          console.log('root account(' + person.email + ') was successfully created.');
          callback(null, person);
        });
      }
    });
  },

  function(person, callback){
    var tag = new Tag();
    tag.name = '默认';
    tag.description = '默认标签分类';
    tag.sequence = 0;
    tag.save(function(err){
      console.log('tag was successfully created.');
      callback(null, person, tag);
    });
  },

  function(person, tag, callback){
    var investment = new Investment();
    investment.title = '资金周转演示_20131105';
    investment.description = '资金周转演示';
    investment.author = person._id;
    investment.permission = 'public';
    investment.repayment_type = 'debx';
    investment.rate = 0.15;
    investment.rate_type = 'year';
    investment.amount = 100000;
    investment.periods = 6;
    investment.period_type = 'month';
    investment.borrower = '张某某';
    investment.started_at = new Date('2013-11-05');
    investment.ended_at = new Date('2014-05-05');
    investment.tags.push(tag);
    investment.save(function(err){
      console.log('investment was successfully created.');

      callback(null, person, tag, investment);
    });
  }

], function(err, results) {
  console.log('IMP init well done, get started now.');
  mongoose.disconnect();
  process.exit(0);
});
