const register = () => {
  console.log('module-style automation regsistered');
};

const unregister = () => {
  console.log('module-style automation unregsistered');
};

const run = () => {
  console.log('module-style automation running');
};

module.exports = {
  register,
  unregister,
  run,
};
