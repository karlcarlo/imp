var check = require('validator').check
  , sanitize = require('validator').sanitize
  , config = require('../config');

var models = require('../models')
  , Tag = models.Tag
  , Investment = models.Investment;

var controllers;

var helpers = require('../helpers');

var words = {
  name: '投资',
  new: '新增',
  create: '创建',
  edit: '编辑',
  update: '更新',
  destroy: '删除',
  no_login: '您还未登录，不能进行当前操作。',
  no_exist: '此投资不存在或已被删除。',
  permission_denied: '您没有操作权限。',
  empty_tags: '至少需要为您的投资选择一个标签。',
  empty_title: '标题或内容不能为空。',
  empty_topimg: '分享到首页展示时，投资头图不能为空。',
  error_find_tags: '选中标签加载出错！',
  success_create: '新投资发布成功！',
  success_update: '投资已经更新！',
  success_destroy: '投资已经成功删除。'
}

var fs = require('fs')
  , path = require('path');

/*
 * GET investment index
 */
exports.index = function(req, res){

  if(req.params.format && req.params.format == 'json'){
    var res_obj = {
      success: true,
      message: '',
      data: []
    };

    Investment
    .find(null, 'id title started_at ended_at amount repayment_type rate_type rate period_type periods borrower')
    .sort('-created_at')
    .limit(100)
    .exec(function(err, items){
      res_obj.data = items;
      res.json(res_obj);
      return;
    });

    return;    
  }


  // 分页对象
  var pagination = {
    max_items: 0,
    max_pages:0,
    items_per_page: 20,
    link_to: '/investments',
    prev_page: 0,
    next_page: 0,
    current_page: 0
  };

  var query_obj = {};
  
  if(req.query.page){
    pagination.current_page = parseInt(req.query.page);
  }

  // 按标签查询
  if(req.query.tag && req.query.tag.length == 24){
    query_obj.tags = req.query.tag
  }


  // 按照访问权限过滤投资
  if(req.session.person){
    query_obj.$or = [{
      permission: {
        $in: ['public', 'protect']
      }
    }, {
      author: req.session.person._id
    }];

    // 管理员可以查看所有投资
    if(req.session.person.email == config.application.root_account){
      query_obj.$or = [{}];
    }
  }
  else{
    query_obj.permission = 'public';
  }


  // 按标签查询投资

  Investment.count(query_obj, function(err, count){
    //分页设置
    pagination.max_items = count;
    pagination.max_pages = Math.ceil(pagination.max_items / pagination.items_per_page);
    pagination.prev_page = (pagination.current_page < 1)? 0 : pagination.current_page - 1;
    pagination.next_page = (pagination.current_page >= pagination.max_pages - 1)? pagination.max_pages - 1 : pagination.current_page + 1;



    Investment
    .find(query_obj, null, { sort: '-updated_at' })
    .populate('author')
    // .populate('tags', null, null, { sort: '-sequence -created_at' })
    // .populate('comments')
    .limit(pagination.items_per_page)
    .skip(pagination.current_page * pagination.items_per_page)
    .exec(function(err, investments){
      res.locals.pagination = pagination;
      res.render('investments/index', { investments: investments });
    });
  });

};

/*
 * GET investment latest
 */
exports.latest = function(req, res){
  var query_obj = {
    permission: 'public'
  };

  Investment
  .find(query_obj, null, { sort: '-updated_at' })
  .populate('author')
  .limit(5)
  .exec(function(err, investments){
    if(req.params.format && req.params.format == 'json'){
      var res_obj = {
        success: true,
        message: '',
        investments: []
      };
      res_obj.investments = investments;
      res.json(res_obj);
      return;
    }
    else{
      res.render('investments/index', { investments: investments });
    }
  });
};


/*
 * GET investment show
 */
exports.show = function(req, res, next){
  var investment_id = req.params.id;

  if(investment_id.length != 24){
    res.app.locals.messages.push({ type: 'error', content: words.no_exist });
    res.redirect('/notify');
    return;
  }
  
  Investment
  .findById(investment_id)
  .populate('author')
  .populate('tags', null, null, { sort: '-sequence -created_at' })
  .populate('comments')
  .exec(function(err, investment){
    if(err){
      next(err);
    }
    if(!investment){
      res.app.locals.messages.push({ type: 'error', content: words.no_exist });
      res.redirect('/notify');
      return;
    }

    // 按照访问权限过滤投资
    if(investment.permission != 'public'){

      // 受保护投资
      if(!req.session.person){
        res.app.locals.messages.push({ type: 'error', content: words.permission_denied });
        res.redirect('/notify');
        return;
      }

      // 私有投资
      if(investment.permission == 'private'){
        if(investment.author._id != req.session.person._id && req.session.person.email != config.application.root_account){
          res.app.locals.messages.push({ type: 'error', content: words.permission_denied });
          res.redirect('/notify');
          return;
        }
      }
      
    }

    
    // Visit +1
    investment.visit_count += 1;

    Investment.update({ _id: investment._id }, { $set: { visit_count: investment.visit_count } }, function(err){
      
      // Markdown转HTML
      investment.content = markdown(investment.content);

      res.render('investments/show', { investment: investment });
    });

  });

};

/*
 * GET investment new
 */
exports.new = function(req, res, next){
  // if(!req.session.person){
  //   res.app.locals.messages.push({ type: 'alert', content: words.no_login });
  //   res.redirect('/signin');
  //   return;
  // }

  res.locals({
    title: words.new + words.name,
    action: 'new',
    form_action: '/investments'
  });
  
  Tag
  .find({}, function(err, tags){
    if(err){
      next(err);
    }
    res.render('investments/edit', { tags: tags });
  });
};

/*
 * POST investment create
 */
exports.create = function(req, res, next){
  // if(!req.session.person){
  //   res.app.locals.messages.push({ type: 'alert', content: words.no_login });
  //   res.redirect('/signin');
  //   return;
  // }
  

  var title = sanitize(req.body.title).trim()
    , description = sanitize(req.body.description).trim()
    , repayment_type = req.body.repayment_type
    , rate_percent = parseInt(req.body.rate_percent)
    , rate_type = req.body.rate_type
    , amount = parseInt(req.body.amount)
    , periods = parseInt(req.body.periods)
    , period_type = req.body.period_type
    , borrower = req.body.borrower
    , started_at = req.body.started_at
    , ended_at = null
    , permission = req.body.permission
    // , tag_ids = req.body.tags || [];

// 强制转换为数组
  // if(!(tag_ids instanceof Array)){
  //   tag_ids = [tag_ids];
  // }

  title = sanitize(title).escape();

  res.locals({
    title: words.new + words.name,
    action: 'new',
    form_action: '/investments',
    investment: {
      title: title,
      description: description,
      permission: permission
    }
  });

  // Tag
  // .find({}, function(err, tags){
  //   if(err){
  //     next(err);
  //   }
    
  //   // 验证是否勾选了标签
  //   if(!tag_ids.length){
  //     res.app.locals.messages.push({ type: 'error', content: words.empty_tags });
  //     res.render('investments/edit', { tags: tags });
  //     return;
  //   }

  //   // 从全部标签中选中已选标签
  //   for(var i = 0; i < tags.length; i++){
  //     for(var j = 0; j < tag_ids.length; j++){
  //       if(tag_ids[j] == tags[i].id){
  //         tags[i].is_checked = true;
  //       }
  //     }
  //   }

    // 验证标题或内容是否为空
    // if(title == '' || content == ''){
    //   res.app.locals.messages.push({ type: 'alert', content: words.empty_title });
    //   res.render('investments/edit', { tags: tags });
    //   return;
    // }

    // 验证标题格式
    try{
      check(title, '标题为5~50个字。').len(5, 50);
    }
    catch(error){
      res.app.locals.messages.push({ type: 'alert', content: error.message });
      res.render('investments/edit', { tags: tags });
      return;
    }

    var investment = new Investment();
    investment.title = title;
    investment.description = description;
    // investment.author = req.session.person._id;
    investment.permission = permission;
    investment.repayment_type = repayment_type;
    investment.rate = helpers.valueof_percent(rate_percent);
    investment.rate_type = rate_type;
    investment.amount = amount;
    investment.periods = periods;
    investment.period_type = period_type;
    investment.borrower = borrower;
    investment.started_at = new Date(started_at);
    investment.ended_at = helpers.get_ended_at(started_at, periods, period_type);

    investment.save(function(err){
      res.app.locals.messages.push({ type: 'alert', content: words.success_create });
      res.redirect('/investments');
      return;
    });
  
};

/*
 * GET investment edit
 */
exports.edit = function(req, res, next){
  if(!req.session.person){
    res.app.locals.messages.push({ type: 'alert', content: words.no_login });
    res.redirect('/signin');
    return;
  }

  var investment_id = req.params.id;

  if(investment_id.length != 24){
    res.app.locals.messages.push({ type: 'error', content: words.no_exist });
    res.redirect('/notify');
    return;
  }

  Investment
  .findById(investment_id)
  .populate('author')
  .populate('tags', null, null, { sort: '-sequence -created_at' })
  .exec(function(err, investment){

    if(err) return next();
    
    if(!investment){
      res.app.locals.messages.push({ type: 'error', content: words.no_exist });
      res.redirect('/notify');
      return;
    }

    // 验证是否作者本人或管理员
    if(investment.author._id != req.session.person._id && req.session.person.email != config.application.root_account){
      res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
      res.redirect('/notify');
      return;
    }

    res.locals({
      title: words.edit + words.name,
      action: 'edit',
      form_action: '/investments/' + investment_id
    });

    Tag
    .find({}, function(err, tags){
      if(err){
        next(err);
      }
      
      // 从全部标签中选中已选标签
      for(var i = 0; i < tags.length; i++){
        for(var j = 0; j < investment.tags.length; j++){
          if(tags[i].name == investment.tags[j].name){
            tags[i].is_checked = true;
          }
        }
      }

      res.render('investments/edit', { investment: investment, tags: tags });
    });
  });
};

/*
 * POST investment update
 */
exports.update = function(req, res, next){
  if(!req.session.person){
    res.app.locals.messages.push({ type: 'alert', content: words.no_login });
    res.redirect('/signin');
    return;
  }

  var investment_id = req.params.id
    , title = sanitize(req.body.title).trim()
    , content = sanitize(req.body.content).trim()
    , permission = req.body.permission
    , is_elite = req.body.is_elite
    , is_elite_modified = false
    , tag_ids = req.body.tags || [];

  // 强制转换为数组
  if(!(tag_ids instanceof Array)){
    tag_ids = [tag_ids];
  }

  title = sanitize(title).escape();

  res.locals({
    title: words.edit + words.name,
    action: 'edit',
    form_action: '/investments/' + investment_id
  });

  Investment
  .findById(investment_id)
  .populate('author')
  .populate('tags', null, null, { sort: '-sequence -created_at' })
  .exec(function(err, investment){

    if(err) return next();

    if(investment.author._id != req.session.person._id && req.session.person.email != config.application.root_account){
      res.app.locals.messages.push({ type: 'alert', content: words.permission_denied });
      res.redirect('/notify');
      return;
    }

    Tag
    .find({}, null, function(err, tags){
      if(err){
        next(err);
      }

      // 更新投资对象
      investment.title = title;
      investment.content = content;
      investment.permission = permission;

      // 验证是否勾选了标签
      if(!tag_ids.length){
        res.app.locals.messages.push({ type: 'error', content: words.empty_tags });
        res.render('investments/edit', { investment: investment, tags: tags });
        return;
      }

      // 从全部标签中选中已选标签
      for(var i = 0; i < tags.length; i++){
        for(var j = 0; j < tag_ids.length; j++){
          if(tag_ids[j] == tags[i].id){
            tags[i].is_checked = true;
          }
        }
      }

      // 验证标题或内容是否为空
      if(title == '' || content == ''){
        res.app.locals.messages.push({ type: 'alert', content: words.empty_title });
        res.render('investments/edit', { investment: investment, tags: tags });
        return;
      }

      // 验证标题格式
      try{
        check(title, '标题为5~50个字。').len(5, 50);
      }
      catch(error){
        res.app.locals.messages.push({ type: 'alert', content: error.message });
        res.render('investments/edit', { investment: investment, tags: tags });
        return;
      }


      var old_is_elite = investment.is_elite;
      var file = req.files.topimg;
      
      // 分享到首页项是否被修改
      if(old_is_elite !== !!is_elite){
        is_elite_modified = true;
      }else if(is_elite && file && file.size != 0){
        is_elite_modified = true;
      }

      // 验证 分享到首页
      if(is_elite && is_elite_modified){
        
        investment.is_elite = true;
        
        
        if(file){
          if(file.name == '' || file.size == 0){
            res.app.locals.messages.push({ type: 'alert', content: words.empty_topimg });
            res.render('investments/edit', { investment: investment, tags: tags });
            return;
          }

          var name = file.name
            , filename = +new Date + '_' + file.filename
            , temp_path = file.path
            , file_path = './public/uploads/' + filename;

            fs.rename(temp_path, file_path, function(err){
              if(err) throw err;
              fs.unlink(temp_path, function(){

                var asset = new Asset();
                asset.name = name;
                asset.filename = filename;
                asset.type = file.type;
                asset.size = file.size;
                asset.path = '/uploads/' + filename;
                asset.url = config.application.host + 'uploads/' + filename;

                asset.save(function(err){
                  investment.topimg = asset.url;


                  // 保存投资
                  /*
                   * 从旧标签序列中更新当前标签状态
                   * 由于Mongoose的嵌入文档保存机制不支持删除和添加同时保存，所以分两次保存Investment
                   */
                  // 清除旧标签并更新
                  investment.tags.splice(0, investment.tags.length);
                  investment.save(function(err){
                    if(err){
                      next(err);
                    }
                    // 添加新标签
                    investment.tags.push(tag_ids);
                    investment.save(function(err){
                      if(err){
                        next(err);
                      }
                      res.app.locals.messages.push({ type: 'success', content: words.success_update });
                      res.redirect('/investments/' + investment.id);
                    });
                  });
                  
                });
              });
            });

        }
        else{
          res.app.locals.messages.push({ type: 'alert', content: words.empty_topimg });
          res.render('investments/edit', { investment: investment, tags: tags });
          return;
        }
      }
      else{
        
        if(is_elite_modified){
          investment.is_elite = false;
          investment.topimg = '';
        }
        
        // 保存投资

        /*
         * 从旧标签序列中更新当前标签状态
         * 由于Mongoose的嵌入文档保存机制不支持删除和添加同时保存，所以分两次保存Investment
         */
        // 清除旧标签并更新
        investment.tags.splice(0, investment.tags.length);
        investment.save(function(err){
          if(err){
            next(err);
          }
          // 添加新标签
          investment.tags.push(tag_ids);
          investment.save(function(err){
            if(err){
              next(err);
            }
            res.app.locals.messages.push({ type: 'success', content: words.success_update });
            res.redirect('/investments/' + investment.id);
          });
        });

      }

      
    });

  });

};

/*
 * POST investment destroy
 */
exports.destroy = function(req, res, next){
  if(!req.session.person){
    res.app.locals.messages.push({ type: 'alert', content: words.no_login });
    res.redirect('/signin');
    return;
  }

  var investment_id = req.params.id;

  if(investment_id.length != 24){
    res.app.locals.messages.push({ type: 'alert', content: words.no_exist });
    res.redirect('/notify');
    return;
  }

  Investment
  .findById(investment_id)
  .populate('author')
  .exec(function(err, investment){

    if(err) return next();
    
    if(!investment){
      res.app.locals.messages.push({ type: 'error', content: words.no_exist });
      res.redirect('/notify');
      return;
    }

    // 验证是否作者本人或管理员
    if(investment.author._id != req.session.person._id && req.session.person.email != config.application.root_account){
      res.app.locals.messages.push({ type: 'alert', content: permission_denied });
      res.redirect('/notify');
      return;
    }

    Investment.remove({_id: investment_id}, function(err){
      res.app.locals.messages.push({ type: 'success', content: words.success_destroy });
      res.redirect('/investments');
    });

  });
  
};

// private function
