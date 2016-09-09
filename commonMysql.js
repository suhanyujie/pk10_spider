"use strict"
const mysql = require('mysql');
const async = require('async');
const utils = require('./utils')

var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'bbs_test',
    port: 3306
});

var sqls = {
	insertSql : "insert into pk10_history(periods,num1,num2,num3,num4,num5,num6,num7,num8,num9,num10,date) values(555551,1,2,3,4,5,6,7,8,9,10,'2016-09-05')"
};


conn.query(sqls.insertSql, function (err, res) {
    console.log(res);
    callback(err, res);
});