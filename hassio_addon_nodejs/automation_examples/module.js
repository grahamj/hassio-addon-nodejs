let log;
let drivewayTempState;

const register = ({ State, log: inLog }) => {
  log = inLog;
  log.info('Module-style automation registered');

  drivewayTempState = State.findByEntityId('sensor.driveway_temperature');
  if(!drivewayTempState) throw new Error('Module-style automation could not find sensor.driveway_temperature')
  drivewayTempState.onChange(drivewayTempChange);
};

const unregister = () => {
  log.info('Module-style automation unregistered');
  drivewayTempState.removeStateChangeHandler(this.drivewayTempChange);
};

const drivewayTempChange = () => {
  log.info(`Module-style automation drivewayTempChange ${drivewayTempState.previousState} -> ${drivewayTempState.state}`);
};

// const trigger = ({ State, log, trigger }) => {
//   log.info(`Module-style automation triggered by ${trigger.entityId}`);
// };

module.exports = {
  register,
  unregister,
  // trigger,
};
