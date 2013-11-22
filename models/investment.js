var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var helper = require('../helpers');

// define schema
var InvestmentSchema = new Schema({
  title: { type: String },
  description: { type: String },
  author: { type: ObjectId, ref: 'Person' },
  permission: { type: String, default: 'public' }, // [ public | protect | private ]
  visit_count: { type: Number, default: 0 },
  repayment_type: { type: String, default: 'debx' }, // [ debx | debj ]
  rate: { type: Number, default: 0 },
  rate_type: { type: String, default: 'year' }, // [ year | month | day ]
  amount: { type: Number, default: 0 },
  periods: { type: Number, default: 0 },
  period_type: { type: String, default: 'month' }, // [ year | month | day ]
  borrower: { type: String },
  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  tags: [{ type: ObjectId, ref: 'Tag' }]
});

InvestmentSchema.virtual('timestamp').get(function(){
  return helper.format_date(this.created_at);
});

InvestmentSchema.virtual('rate_percent').get(function(){
  return helper.print_percent(this.rate);
});

InvestmentSchema.virtual('started_at_ymd').get(function(){
  return helper.print_ymd(this.started_at);
});

InvestmentSchema.virtual('ended_at_ymd').get(function(){
  return helper.print_ymd(this.ended_at);
});

InvestmentSchema.virtual('amount_bignum').get(function(){
  return helper.print_bignum(this.amount);
});

InvestmentSchema.virtual('rate_smart').get(function(){
  var type = {
    'year': '年',
    'month': '月',
    'day': '天'
  }
  return helper.print_percent(this.rate) + '%' + type[this.rate_type];
});

InvestmentSchema.virtual('periods_smart').get(function(){
  var type = {
    'year': '年',
    'month': '个月',
    'day': '天'
  }
  return this.periods + type[this.period_type];
});

InvestmentSchema.virtual('repayment_smart').get(function(){
  var type = {
    'a': '按月分期还款',
    'b': '按季分期还款',
    'c': '按月到期还款',
    'd': '按天到期还款',
    'e': '按天计息按月还款'
  }
  return type[this.repayment_type];
});


// define model
mongoose.model('Investment', InvestmentSchema);