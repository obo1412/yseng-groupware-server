var mysql = require("mysql2/promise");
require("dotenv").config();

const data = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  pw: process.env.DB_PASSWORD,
  schema: "YSENG",
};

module.exports = function () {
  return {
    HOST: data.host,
    PORT: data.port,
    USER: data.user,
    PASSWORD: data.pw,
    DB: data.schema,
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    init: function () {
      return mysql.createConnection({
        host: data.host,
        port: data.port,
        user: data.user,
        password: data.pw,
        database: data.schema,
        timezone: "+09:00",
      });
    },

    initPool: function () {
      return mysql.createPool({
        host: data.host,
        port: data.port,
        user: data.user,
        password: data.pw,
        database: data.schema,
        timezone: "+09:00",
        waitForConnections: true,
        namedPlaceholders: true,
      });
    },

    poolConn: function () {
      this.initPool().getConnection((err, connection) => {
        if (err) throw err;
        console.log(`Connected as ID ${connection.threadId}`);
      });
    },

    test_open: function (con) {
      con.connect(function (err) {
        if (err) {
          console.error("mysql connection error :" + err);
        } else {
          console.info("mysql is connected successfully.");
        }
      });
    },
  };
};
