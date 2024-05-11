class FancyAutomation {

  constructor() {
    console.log('FancyAutomation constructor!!');
  }

  register() {
    console.log('FancyAutomation register');
  }

  unregister() {
    console.log('FancyAutomation unregister');
  }

  run({ Entity, ha, trigger }) {
    console.log(`FancyAutomation triggered by ${trigger.entityId}`);
  }
  
};

module.exports = {
  class: FancyAutomation,
};
