"use strict"
const mysql = require('mysql');
const moment = require('moment');
const co = require('co');
const Promise = require('promise');
const dbconf = require('./dbconf.json');


let originData = [];
var Compare = {
	// 获取2条记录
	getTwoData : function(){
		return new Promise(function(resolve,reject){
			Compare.getTwo().then(function(result){
				originData = result;
				//console.log(result[0].id);
				resolve(result);
			});
		});
	},
	getPeriods : function(originData){
		return new Promise(function(resolve,reject){
			let periodArr = [];
			for(let val of originData){
				periodArr.push(val.periods);
			}
			resolve(periodArr);
		});
	},
	getSixNum : function(originData){
		return new Promise(function(resolve,reject){
			let eleArr = [];
			let res = originData;
			for(let val of res){
				eleArr.push(val.num1);
				eleArr.push(val.num2);
				eleArr.push(val.num3);
			}
			resolve(eleArr);
		});
	},
	getFinalNum : function(sixData){
		return new Promise(function(resolve,reject){
			let res = sixData;
			// 去重处理哦
			res = new Set(res);
			res = Array.from(res);
			if(res.length < 5){

			}
			resolve(res);
		});
	},
	// 获取下一期的冠军号
	getNextChampion : function(connection, period){
		return new Promise(function(resolve,reject){
			let whereStr = ' AND periods='+period;
			whereStr += ' AND origin_date>"2016-09-07 00:00:00" AND origin_date<"2016-09-08 00:00:00"';
			let sql = 'SELECT num1 FROM pk10_history WHERE 1=1 '+whereStr+' order by periods limit 1';
			connection.query( sql, function(err, result){
				if(err)throw(err);
				//connection.end();
				resolve(result);
			});
		});
	},
	getTwo : function(period){
		let connection = mysql.createConnection(dbconf);
		let whereStr = '';
		if(typeof(period)!='undefined' && period>0){
			whereStr += ' AND periods>='+period;
		}
		whereStr += ' AND origin_date>"2016-09-07 00:00:00" AND origin_date<"2016-09-08 00:00:00"';
		let sql = 'SELECT * FROM pk10_history WHERE 1=1 '+whereStr+' order by periods ASC LIMIT 2';
		return new Promise(function(resolve,reject){
			let tmpRes = connection.query( sql, function(err, result){
				if(err)throw(err);
				//connection.end();
				resolve(result);
			});
		});
	},
	getFirstPeriod : function(connection){
		let whereStr = '';
		whereStr += ' AND origin_date>"2016-09-07 00:00:00" AND origin_date<"2016-09-08 00:00:00"';
		let sql = 'SELECT * FROM pk10_history WHERE 1=1 '+whereStr+' order by periods ASC LIMIT 1';
		return new Promise(function(resolve,reject){
			connection.query( sql, function(err, result){
				if(err)throw(err);
				resolve(result);
			});
		});
	}
};// end of object

var run = co(function *(initPeriod){
	let originData,sixData,periodArr,finalData,maxPeriod,winFlag = false;
	let followNumArr = [];

	let followNum = 1,middlePeriod = 0;
	let connection = mysql.createConnection(dbconf);
	if(typeof(initPeriod)=='undefined' || !initPeriod){
		console.log('没有设定初始化期数！以当天第一次的期数开始！');
		let firstData = yield Compare.getFirstPeriod(connection);
		initPeriod = firstData[0].periods;
	}
	let count = 0;
	while(initPeriod){
		if(count > 10){
			console.log('count达到设定次数[10001]！');
			break;
		}
		originData = yield Compare.getTwo(initPeriod);
		sixData = yield Compare.getSixNum(originData);
		periodArr = yield Compare.getPeriods(originData);
		finalData = yield Compare.getFinalNum(sixData);
		maxPeriod = Math.max(periodArr[0],periodArr[1]);
		if(finalData.length != 5){
			// 跳过这一期，用下一期作对比
			initPeriod = maxPeriod;
			continue;
		}
		for(let i=0;i<8;i++){
			// 和下一期冠军作对比
			let nextChampion = yield Compare.getNextChampion(connection,++maxPeriod);
			nextChampion = nextChampion.length>0 ? nextChampion[0].num1 : 0;
			if(!nextChampion){
				console.log('已经找不到下一期的冠军号码啦！');
				initPeriod = 0;
				break;
			}
			//console.log('开始第'+(count+1)+'次的对比！',nextChampion);
			if(finalData.indexOf(nextChampion) > -1){
				// 说明中奖,重置跟随次数为1
				//console.log('跟随次数：'+followNum+'|此次买号结束~');
				followNumArr.push(followNum);
				followNum = 1;
				initPeriod = maxPeriod;
				winFlag = true;
				break;
			}
			followNum++;
		}
		count++;
		if(winFlag){
			continue;
		}
	}// end of while
	console.log(followNumArr);
	if(followNumArr.length > 0){
		console.log(Math.max.apply(null, followNumArr));
	} else {
		console.log('已经结束啦~但还没有对比的数据！');
	}

	connection.destroy();
})// end of run func

console.log('end~');


