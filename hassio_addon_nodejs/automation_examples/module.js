let log;
let garageTempEntity;

const register = ({ Entity, log: inLog }) => {
  log = inLog;
  log.info('Module-style automation registered');

  garageTempEntity = Entity.findById('sensor.garage_temperature_2');
  if(!garageTempEntity) throw new Error('Module-style automation could not find sensor.garage_temperature_2')
  garageTempEntity.onStateChange(garageTempChange);
};

const unregister = () => {
  log.info('Module-style automation unregistered');
  garageTempEntity.removeStateChangeHandler(this.garageTempChange);
};

const garageTempChange = () => {
  log.info(`Module-style automation garageTempChange ${garageTempEntity.previousState} -> ${garageTempEntity.state}`);
};

// const trigger = ({ Entity, log, trigger }) => {
//   log.info(`Module-style automation triggered by ${trigger.entityId}`);
// };

module.exports = {
  register,
  unregister,
  // trigger,
};
