class ClassAutomation {

  constructor({ Entity, log }) {
    this.Entity = Entity;
    this.log = log;
    this.log.info('Class-style automation constructor');
  }

  register() {
    this.log.info('Class-style automation register');
    this.garageTemp = this.Entity.findById('sensor.garage_temperature_2');
    if(!this.garageTemp) throw new Error('Class-style automation could not find sensor.garage_temperature_2')
    this.garageTemp.onStateChange(this.garageTempChange);
  }

  unregister() {
    this.log.info('Class-style automation unregister');
    this.garageTemp.removeStateChangeHandler(this.garageTempChange);
  }

  garageTempChange(entity) {
    this.log.info(`Class-style automation garageTempChange ${entity.previousState} -> ${entity.state}`);
  }

  // trigger({ Entity, ha, trigger }) {
  //   this.log.info(`ClassAutomation triggered by ${trigger.entityId}`);
  // }
  
};

module.exports = {
  class: ClassAutomation,
};
