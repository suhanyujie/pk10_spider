"use strict"
const querystring = require('querystring');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql');
const MysqlConnection = require('./utils').MysqlConnection;
const moment = require('moment');
const co = require('co');
const Promise = require('promise');
const dbconf = require('./dbconf.json');


var post_data = {
	time:'2016-09-07'
};
post_data = querystring.stringify(post_data);
//console.log('Post_data :'+post_data)

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
let nowTime = moment().format('YYYY-MM-DD hh:mm:ss');
var resData = '',connection = null;
var post_req = http.request(post_options, function(res) {
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
    	
    	connection = mysql.createConnection(dbconf);
    	let sqls = {
			insertSql : "INSERT INTO pk10_history(periods,num1,num2,num3,num4,num5,num6,num7,num8,num9,num10,date) VALUES (:periods,:num1,:num2,:num3,:num4,:num5,:num6,:num7,:num8,:num9,:num10,:date)",
			sqlTest : "INSERT INTO pk10_history(periods,num1,num2,num3,num4,num5,num6,num7,num8,num9,num10,date) VALUES (5555552,1,2,3,4,5,6,7,8,9,10,'2016-09-06 13:32:54')",
			sql1 : "INSERT INTO pk10_history set ? "

		};
		let resDataObj = JSON.parse(resData);
		let dataObj = {},tmpKey = '',tmpRes=null,promise=null,promiseArr = [],timeStr='';
		new Promise(function(resolve){
			let i = 1;
			resDataObj.data.map(task=>{
				timeStr = task.c_getdatatime;
				timeStr = timeStr.match(/\d+/);
				timeStr = parseInt(timeStr[0]);
				dataObj = {
					periods	: task.c_num,
					origin_date:moment(timeStr).format('YYYY-MM-DD HH:mm:ss'),// task.c_getdatatime
					date 	: nowTime,
				};
				for(let i=1;i<=10;i++){
					tmpKey = 'c_n'+i;
					dataObj['num'+i] = task[tmpKey];
				}
				
		    	let tmpRes = connection.query(sqls.sql1,dataObj,function(err, result){
		    		if (err) throw err;
					console.log(result.insertId);
				});
				if(i >= 179){
					resolve(function(){
						console.log('insert complete!');
					});
				}
				i++;
				//promiseArr.push(promise);
			});
		}).then(function(){
			console.log('This is then!');
			connection.end();
		}).catch(function(err){
			throw (err);
		});
		

		//connection.end();
    	//doStoreData(resData);

		// conn.query(sqls.insertSql, function (err, res) {
		//     console.log(res);
		// });

		//console.log(onetimetoken_data); 
		// 将数据存储到数据库中
    });

});
post_req.write(post_data);
post_req.end();



var PkShop = {
	getAdjacentNum : function(){

	}
};


function doStoreData(resData){
	co(function*(){
		let dbconf = {
			"host"     : "localhost",
			"port"     : 3306,
			"user"     : "root",
			"password" : "123456",
			"database" : "bbs_test",
			"insecureAuth": true,
			"charset"  : "utf8"
		};
		let resDataObj = JSON.parse(resData);
		// fs.writeFile('tmp.txt',resData,function(err){
		// 	console.log(err);
		// });
		//console.log(resDataObj.times);
		//创建数据库连接
	    let conn = new MysqlConnection(dbconf);
	    let sqls = {
			insertSql : "INSERT INTO pk10_history(periods,num1,num2,num3,num4,num5,num6,num7,num8,num9,num10,date) VALUES (:periods,:num1,:num2,:num3,:num4,:num5,:num6,:num7,:num8,:num9,:num10,:date)",
			sqlTest : "INSERT INTO pk10_history(periods,num1,num2,num3,num4,num5,num6,num7,num8,num9,num10,date) VALUES (5555552,1,2,3,4,5,6,7,8,9,10,'2016-09-06 13:32:54')",
			sql1 : "INSERT INTO pk10_history set ? "

		};

		let dataObj = {},tmpKey = '',tmpRes=null,promise=null,promiseArr = [];

		resDataObj.data.map(task=>{
			dataObj = {
				periods	: task.c_num,
				date 	: nowTime,
			};
			for(let i=1;i<=10;i++){
				tmpKey = 'c_n'+i;
				dataObj[tmpKey] = task[tmpKey];
			}
			
			console.log(res1.sql);
			//promiseArr.push(promise);
		});
		//let promiseArr1 = [];
		//promiseArr1.push(promiseArr[0]);


		//let res1 = yield Promise.all(promiseArr1);

		console.log(res1);

	})
	.catch( error=>console.log('some error catched', error) )
	.then( ()=>{
		console.log('complete!');
        //最终调用,确保释放资源
        //确保断开所有数据库连接
        MysqlConnection.destroyAll()
    });
}// end of co

function recordNum(conn,taskObj){
	let sql = `insert into pk10_history(periods,num1,num2,num3,num4,num5,num6,num7,num8,num9,num10,date) `+
				'values (:periods,:num1,:num2,:num3,:num4,:num5,:num6,:num7,:num8,:num9,:num10,:date)';
	conn.execute( sql, taskObj );
	return;
}



