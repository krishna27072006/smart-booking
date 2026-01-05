const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "smart_booking",
  password: "Krishna@27",
  port: 5432,
});

module.exports = pool;
