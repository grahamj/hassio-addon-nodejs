module.exports.init = ({ Automation, State, log }) => {

  class ClassAutomation extends Automation {

    constructor() {
      super();
      log.info('Class-style automation constructor');
    }

    register() {
      log.info('Class-style automation register');
      this.drivewayTemp = State.findByEntityId('sensor.driveway_temperature');
      if(!this.drivewayTemp) throw new Error('Class-style automation could not find sensor.garage_temperature_2')
      this.drivewayTemp.onChange(this.drivewayTempChange);
    }

    unregister() {
      log.info('Class-style automation unregister');
      this.drivewayTemp.removeStateChangeHandler(this.drivewayTempChange);
    }

    drivewayTempChange(entity) {
      log.info(`Class-style automation drivewayTempChange ${entity.previousState} -> ${entity.state}`);
    }

    // trigger({ State, ha, trigger }) {
    //   log.info(`ClassAutomation triggered by ${trigger.entityId}`);
    // }
    
  }

  return new ClassAutomation();
};
