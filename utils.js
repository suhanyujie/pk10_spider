"use strict"
const mysql   = require('mysql')
const BufferHelper = require('bufferhelper')
//类形式的封装
class MysqlConnection {
  constructor( option ) {
    this._option = option
    this._conn = mysql.createConnection( this._option )

    //设置参数绑定模式
    this._conn.config.queryFormat = function (query, values) {
      if (!values) return query
      return query.replace(/\:(\w+)/g, function (txt, key) {
        if (values.hasOwnProperty(key)) {
          return this.escape(values[key])
        }
        return txt
      }.bind(this))
    }

    //将连接添加到类属性conns中
    if( MysqlConnection._conns === undefined || MysqlConnection._conns === null ) {
      MysqlConnection._conns = []
    }
    MysqlConnection._conns.push( this._conn )
  }

  execute( sqlstr, paramObj ) {
    return new Promise( (resolve, reject) => {
      this._conn.query( {sql:sqlstr,typeCast (field, next) {
        if(field.type =='VAR_STRING' || field.type == 'TEXT') {
          // console.log(iconv.decode(field.buffer(),'gbk'));
          return iconv.decode(field.buffer(), 'utf-8');
        }
        return next();
      }}, paramObj, (err, results, fields)=>{
        if( err ) {
          return reject( err )
        }
        return resolve( results )
      })
    })
  }

  disconnect() {
    return new Promise( (resolve, reject) => {
      //end函数会等待所有sql都执行完毕才关闭链接
      this._conn.end( err =>{
        if( err )
          return reject( err )
        return resolve()
      })
    })
  }

  static destroyAll() {
    if( MysqlConnection._conns ) {
      for( let conn of MysqlConnection._conns ) {
        conn.destroy()
      }
      MysqlConnection._conns = null
    }
  }
}

function toUnicode(str) {
  let i = 0
  let result = [] //转换后的结果数组
  let unicodePrefix = '\\u'//unicode前缀 (example:\1234||\u1234)

  for (; i < str.length; i++) {
    //转为16进制的unicode, js及css里须转成16进制
    result.push( unicodePrefix + sprintf('%04x',str.charCodeAt(i)) );
  }
  return '"'+result.join('')+'"';
}

exports.MysqlConnection = MysqlConnection;

