let connection;

const get = () => connection;

const set = (conn) => {
  connection = conn;
};

module.exports = {
  get,
  set,
};
