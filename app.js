const querystring = require('querystring');
const http = require('http');
const url = require('url');
const fs = require('fs');
const cheerio = require('cheerio');
const mysql = require('mysql');
const MysqlConnection = require('./utils').MysqlConnection;
const moment = require('moment');
const Promise = require('promise');
const dbconf = require('./dbconf.json');
const co = require('co');



function recordNum(conn,taskObj){
	let sql = `insert into pk10_history(periods,num1,num2,num3,num4,num5,num6,num7,num8,num9,num10,date) `+
				'values (:periods,:num1,:num2,:num3,:num4,:num5,:num6,:num7,:num8,:num9,:num10,:date)';
	conn.execute( sql, taskObj );
	return;
}
// 获取号码 一个td的html
function getPkNum(html) {
	var $ = cheerio.load(html);
	var iArr = $('i'),tmpEle,res=[];
	iArr.map(index=>{
		tmpEle = iArr.eq(index).attr('class');
		tmpEle = tmpEle.replace('pk-no','');
		res.push(tmpEle);
	});
	return res;
}
// 获取插入的一条数据 对象
function getInsertDataObj(pkNumArr,otherObj) {
	let dataObj = otherObj,tmpKey;
	let i=1;
	pkNumArr.map((val)=>{
		dataObj['num'+i] = val;
		i++;
	});
	return dataObj;
}
// 根据html获取期数
function getPeirod(tdHtml) {
	var $ = cheerio.load(tdHtml);
	var firstP = $('.p').eq(0);

	return firstP.text();
}
// 入库操作
var insertData111 = function(connection,dataObj) {
	let sqls = {
		sql1 : "INSERT INTO pk10_history set ? "
	};
	return new Promise(function(resolve,reject){
		console.log('This is insertData111....');
		let tmpRes = connection.query(sqls.sql1,dataObj,function(err, result){
    		if (err) reject(err);
			resolve(result.insertId);
		});
	})
}

main();

function main(){
	co(function *(){
		var setYear = '2016';
		var post_data = {
			time : setYear + '-08-07',
			date : setYear + '-08-23'
		};
		post_data = querystring.stringify(post_data);

		// console.log(post_data);

		// set the request options
		var post_options = {
		    host: 'www.pk108.cc',
		    port: '80',
		    path: '/PK10/KaijiangSearch',
		    method: 'POST',
		    headers: {
		        'Content-Type': 'application/x-www-form-urlencoded',
		        'Referer':'http://www.pk108.cc/PK10/Kaijiang.html'
		    }
		};
		// http://www.pk10we.com/pk10/kj?date=2015-09-23 
		var post_options2 = {
			host: 'www.pk10we.com',
			port: '80',
			path: '/pk10/kj?',
			method: 'GET',
			query: '',
			headers: {
		        'Referer':'http://www.pk10we.com/pk10/'
		    }
		};
		post_options2.path += post_data;

		let nowTime = moment().format('YYYY-MM-DD hh:mm:ss');
		var resData = '',connection = null;
		var post_req = http.request(post_options2, function(res) {
		    res.setEncoding('utf8');
		    var chunks = [],size=0;
		    res.on('data', function (chunk) {
				size += chunk.length;
				chunks.push(chunk);	
				resData += chunk;	        
		    });
		    res.on('end', function () {
		    	//var data = Buffer.concat(chunks, size);
		    	//var data = chunks.join('');
		    	var $ = cheerio.load(resData);
		    	// 排除多余的tr
		    	$('.head','#history-table').remove();
		    	// 获取多个tr
		    	var tmpTotalTr = $('tr','#history-table');
		    	var totalTr = [];
		    	// 数据库连接
				connection = mysql.createConnection(dbconf);
		    	// 这里 index为索引
		    	tmpTotalTr.map((index)=>{
		    		// 获取期数
		    		let period = tmpTotalTr.eq(index).find('td').eq(0).find('.p').text();
		    		// 获取时间
		    		let timeStr = tmpTotalTr.eq(index).find('td').eq(0).find('.t').text();
		    		timeStr = setYear + '-' + timeStr;
		    		// 时间
		    		let origin_date = timeStr;
		    		// 日期
		    		let origin_day = moment(timeStr).format('YYYY-MM-DD');
		    		// 插入时间
		    		let insert_date = nowTime;
		    		let dataObj = {
						periods : period,
						origin_date : origin_date,
						insert_date : insert_date,
						origin_day : origin_day
					};
					// 获取号码的td
					let numTd = tmpTotalTr.eq(index).find('td.nums').html();
					// 拼接插入的数据对象
					dataObj = getInsertDataObj(getPkNum(numTd),dataObj);

					if(index == 0){
						insertData111( connection, dataObj ).then(function(res){
							console.log(res);
						});
					}
		    		
		    	});// end of map

		    	connection.end();
		    });

		});
		post_req.write(post_data);
		post_req.end();

	})
	.catch( (error)=>console.log('co catched', error) )// end of co
	.then( (connection)=>{
		console.log('co complete->then');
		console.log(connection);
	});

}// end of main


function doStoreData(dataObj){
	co(function*(){

		

	})
	.catch( error=>console.log('some error catched', error) )
	.then( ()=>{
		console.log('complete!');
    });
}// end of co



