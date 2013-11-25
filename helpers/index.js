var crypto = require('crypto')
  , config = require('../config');

require('date-utils');

/*
 * helpers
 */

// format date
function format_date(d){
  if(typeof d != 'object'){
    return {};
  }

  function fix(num){
    return (num < 10)? '0' + num : num.toString();
  }

  var year = d.getFullYear()
    , month = d.getMonth() + 1
    , date = d.getDate()
    , day = d.getDay()
    , hours = d.getHours()
    , minutes = d.getMinutes()
    , seconds = d.getSeconds();

  var months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    , months_en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    , months_abbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    , days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    , days_en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday']
    , days_abbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return {
    year: year,
    month: fix(month),
    date: fix(date),
    day: day,
    hours: fix(hours),
    minutes: fix(minutes),
    seconds: fix(seconds),
    month_name: months[month - 1],
    month_name_en: months_en[month - 1],
    month_abbr: months_abbr[month - 1],
    day_name: days[day],
    day_name_en: days_en[day],
    day_abbr: days_abbr[day],
    normal: fix(month) + '-' + fix(date),
    full_date: year + '-' + fix(month) + '-' + fix(date),
    time: fix(hours) + ':' + fix(minutes) + ':' + fix(seconds),
    full: year + '-' + fix(month) + '-' + fix(date) + ' ' + fix(hours) + ':' + fix(minutes) + ':' + fix(seconds),
    more: year + '/' + fix(month) + '/' + fix(date) + ' ' + fix(hours) + ':' + fix(minutes),
    less: fix(month) + '/' + fix(date) + ' ' + fix(hours) + ':' + fix(minutes),
    short: fix(date) + ' ' + months_abbr[month - 1] + ' ' + year + ' ' + fix(hours) + ':' + fix(minutes),
    mini: fix(month) + '/' + fix(date)
  };
};

function string_length(str) {
  return typeof str === "string" ? str.length + str.replace(/[\x00-\x7f]/g, '').length + 1 >> 1 : 0;
};

function string_cut(str, length) {
  if (typeof str !== "string"){
    return str;
  }
  length += length;
  for ( var n = 0, L = str.length; n < L && length > 0; n++) {
    length -= str.charCodeAt(n) > 127 ? 2 : 1;
  }
  return str.substr(0, n);
};

function brief_cut(text, length){
  if (typeof text !== "string"){
    return text;
  }

  var brief = ''
    , link_ref = '';

  // 切分链接引用
  var slice_at = text.search(/\n *\[\d{0,3}\]: ((http|https|ftp):\/\/)/);
  if(slice_at != -1){
    link_ref = text.substring(slice_at, text.length);
    brief = text.substr(0, slice_at);
  }
  else{
    brief = text;
  }

  // 切分简介
  if(brief.length > length){
      var expect_at = brief.indexOf('\n', length);
      if(expect_at - length > 100){
          expect_at = brief.lastIndexOf('\n', length);
      }
      brief = brief.substr(0, expect_at);
      brief += '\n\n...';
  }

  return brief + link_ref;
}

function brief_filter(str){
  str = str
    .replace(/&/g, '&amp;')
    .replace(/\</g, '&lt;')
    .replace(/\>/g, '&gt;');
  return str;
}

// 私钥加密算法
function encrypt(str, secret){
  if(typeof str != 'string') return '';
  var cipher = crypto.createCipher('aes128', secret);
  var enc = cipher.update(str,'utf8','hex');
  enc += cipher.final('hex');
  return enc;
}

function decrypt(str, secret){
  if(typeof str != 'string') return '';
  var decipher = crypto.createDecipher('aes128', secret);
  var dec = decipher.update(str,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
}

function cut_decimals(num, places){
  places = places || 3;
  var pv = Math.pow(10, places);
  return Math.round(num * pv) / pv;
}

function valueof_percent(num){
  return cut_decimals(num / 100, 4);
}

function print_percent(rate){
  return cut_decimals(rate * 100);
}

function get_started_at(ended_at, periods, period_type){
  var started_at = new Date(ended_at)
    , action = '';

  if(typeof periods !== 'number'){
    return started_at;
  }

  switch(period_type){
    case 'year':
      action = 'addYears';
      break;
    case 'month':
      action = 'addMonths';
      break;
    case 'day':
      action = 'addDays';
      break;
    default:
      action = 'addMonths';
      break;
  }

  started_at[action](-periods);

  return started_at;
}

function get_ended_at(started_at, periods, period_type){
  var ended_at = new Date(started_at)
    , action = '';

  if(typeof periods !== 'number'){
    return ended_at;
  }

  switch(period_type){
    case 'year':
      action = 'addYears';
      break;
    case 'month':
      action = 'addMonths';
      break;
    case 'day':
      action = 'addDays';
      break;
    default:
      action = 'addMonths';
      break;
  }

  ended_at[action](periods).addDays(-1);

  return ended_at;
}

function print_ymd(date){
  var d = new Date(date);
  return d.toYMD();
}

function print_bignum(num, bits_size){
  bits_size = bits_size || 3;
  var str = num + '',
    str_arr = str.split('.'),
    str_int = str_arr[0],
    str_float = str_arr[1],
    len = str_int.length,
    result = '';

  if(len > bits_size){
    var b = Math.floor(len / bits_size),
      y = len % bits_size;

    var head = str_int.substr(0, y),
      body = str_int.substring(y, str_int.length);

    for(var i = 0; i < b; i++){
      result += body.substring(i * bits_size, (i + 1) * bits_size) + ',';
    }

    result = (head.length ? head + ',' : '') + result.substring(0, result.length - 1) + (str_float ? '.' + str_float : '');

  }
  else{
    result = str_int + (str_float ? '.' + str_float : '');
  }

  return result;
}


// 等额本息
function acpi(amount, rate_year, months_num){
  if(!amount || !rate_year || !months_num){
    return -1;
  }

  var rate_month = rate_year / 12,
    v = Math.pow(1 + rate_month, months_num),
    result = amount * rate_month * v / (v - 1);

  return result;
}

/**
 * 按等额本息计算贷款
 * @param  {Number} amount      金额
 * @param  {Number} rate        利率
 * @param  {Number} periods     周期
 * @param  {String} rate_type   利率类型[year | month | day], 默认为year(年)
 * @param  {String} period_type 周期类型[year | month | day], 默认为month(月)
 * @return {Object}             [description]
 */
function loan(amount, rate, periods, rate_type, period_type){

  if(!amount || !rate || !periods){
    return;
  }

  rate_type = rate_type || 'year';
  period_type = period_type || 'month';

  var rate_year = 0,
      periods_of_month = 0,
      repayment = 0
      interest_total = 0,
      interest_tax = 0,
      interest_month = 0,
      interest_day = 0,
      principal_interest = 0,
      tax = 0.1;

  switch(rate_type){
    case 'year':
      rate_year = rate;
      break;
    case 'month':
      rate_year = rate * 12;
      break;
    case 'day':
      rate_year = rate * 365;
      break;
    default:
      rate_year = rate;
      break;
  }

  switch(period_type){
    case 'year':
      periods_of_month = periods * 12;
      break;
    case 'month':
      periods_of_month = periods;
      break;
    case 'day':
      periods_of_month = periods / (365 / 12);
      break;
    default:
      periods_of_month = periods;
      break;
  }

  if(period_type === 'day'){
    interest_total = interest_tax = amount * rate * periods;
    interest_month = interest_tax / periods_of_month;
    interest_day = interest_tax / periods;
    repayment = principal_interest = amount + interest_tax;
  }
  else{
    // 月还款额
    repayment = acpi(amount, rate_year, periods_of_month);
    // 利息总额
    interest_total = repayment * periods_of_month - amount,
    interest_tax = interest_total * (1 - tax);
    // 按月利息
    interest_month = interest_tax / periods_of_month,
    // 按天利息
    interest_day = interest_month / (365 / 12),
    // 本息总额
    principal_interest = amount + interest_tax;    
  }


  return {
    repayment: cut_decimals(repayment),
    rate_of_year: cut_decimals(rate_year, 4),
    periods_of_month: cut_decimals(periods_of_month),
    interests: cut_decimals(interest_total),
    interests_after_tax: cut_decimals(interest_tax),
    interests_per_month: cut_decimals(interest_month),
    interests_per_day: cut_decimals(interest_day),
    principal_interest: cut_decimals(principal_interest),
    valueOf: function(){
      return this.repayment;
    }
  }

}

/**
 * exports
 */
exports.format_date = format_date;
exports.string_length = string_length;
exports.string_cut = string_cut;
exports.brief_cut = brief_cut;
exports.brief_filter = brief_filter;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.cut_decimals = cut_decimals;
exports.valueof_percent = valueof_percent;
exports.print_percent = print_percent;
exports.get_started_at = get_started_at;
exports.get_ended_at = get_ended_at;
exports.print_ymd = print_ymd;
exports.print_bignum = print_bignum;
exports.loan = loan;








