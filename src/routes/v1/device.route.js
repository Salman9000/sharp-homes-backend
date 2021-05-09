const express = require('express');
const auth = require('../../middlewares/auth');
// const validate = require('../../middlewares/validate');
// const userValidation = require('../../validations/user.validation');
const deviceController = require('../../controllers/device.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('createDevice'), deviceController.createDevice)
  .get(auth('getDevice'), deviceController.getDevices)
  .delete()
  .patch();

router.route('/rooms/:roomId').get(auth('roomDevice'), deviceController.getRoomDevices);

router
  .route('/getDevice/:deviceId')
  .get(deviceController.getDevice)
  .patch(deviceController.updateDevice)
  .delete(deviceController.deleteDevice);

router.route('/getConsumptionByDevice/:deviceId').get(auth('getDevice'), deviceController.getTotalConsumptionByDevice);

router.route('/getDeviceConsumptionBy1month').get(auth('getDevice'), deviceController.getDeviceConsumptionBy1Month);

router.route('/getDeviceConsumptionBy7days').get(auth('getDevice'), deviceController.getDeviceConsumptionBy7Days);

router.route('/getDeviceConsumptionByOneDay/:day').get(auth('getActivity'), deviceController.getDeviceConsumptionByOneDay);

router.route('/getConsumptions').get(auth('getDevice'), deviceController.getTotalConsumptionAllDevices);

router.route('/getConsumptionsByDevice/').get(auth('getDevice'), deviceController.getCustomDeviceConsumption);

module.exports = router;
