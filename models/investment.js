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

// define model
mongoose.model('Investment', InvestmentSchema);