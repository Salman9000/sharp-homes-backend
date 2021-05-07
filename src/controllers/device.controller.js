const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { deviceService } = require('../services');
const { Activity } = require('../models');
const { Device } = require('../models');
const { activityService } = require('../services');
var moment = require('moment');
// const { deviceService } = require('../services');
const createDevice = catchAsync(async (req, res) => {
  const device = await deviceService.createDevice(req.body, req.user._id);
  res.status(httpStatus.CREATED).send(device);
});

const getTotalConsumptionAllDevices = catchAsync(async (req, res) => {
  const aggregate = Activity.aggregate([
    { $match: { userId: req.user._id } },
    { $group: { _id: '$deviceId', total: { $sum: '$overallConsumption' } } },
    { $lookup: { from: 'devices', localField: '_id', foreignField: '_id', as: 'dev' } },
  ]);
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  res.json({ result });
});

const getTotalConsumptionByDevice = catchAsync(async (req, res) => {
  const aggregate = Activity.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: req.params.deviceId,
        total: { $sum: `$overallConsumption` },
      },
    },
  ]);
  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  res.json({ result });
});

const getCustomActivity1Month = (resultArray, inputArray) => {
  //{ labels: [], datasets:  [{ data: [] }, { data: [] }] }
  labels = [];
  datas = [];
  deviceArray = [];

  resultArray.docs.map((value) => {
    labels.push('Week ' + value._id.week); //add week to label array
    deviceArray.push(`${value._id.deviceId}`); //add device to device array
    datas.push(`${(value.total / 1000).toFixed(2)} ${value._id.deviceId}`); //add total and device id to datas array
  });

  data = [];
  const uniqueSet = new Set(labels); //set unique lables
  labels = [...uniqueSet];
  const uniqueDevice = new Set(deviceArray); //set unqiue devices
  deviceArray = [...uniqueDevice];
  data2 = new Array(deviceArray.length).fill(new Array(0)); //create 2d array having length of number devices

  datas.map((value) => {
    var index = deviceArray.indexOf(value.split(' ')[1]); //get the index of device in the device array
    data2[index] = [...data2[index], value.split(' ')[0]]; //insert data into data2 array
  });

  overallConsumption =
    resultArray.docs
      .map((value) => value.total)
      .reduce((acc, current) => acc + current)
      .toFixed(2) / 1000;

  data2.map((value) => {
    inputArray.datasets.push({ data: value }); //push the data eg. datasets:  [{ data: [] },]
  });
  inputArray.datasets.shift(); //remove the first empty element
  inputArray.labels = labels; //rename label
  return { inputArray, overallConsumption };
};
const getDeviceConsumptionBy1Month = catchAsync(async (req, res) => {
  var today = new Date(2021, 2 - 1, 10);
  var lastDate = moment(today).subtract(1, 'month');
  let aggregate = Activity.aggregate();
  aggregate.match({ userId: req.user._id, startDate: { $gt: new Date(lastDate), $lt: new Date(today) } });
  aggregate.group({
    _id: {
      week: { $week: '$startDate' },
      year: { $year: '$startDate' },
      deviceId: '$deviceId',
    },
    total: { $sum: '$overallConsumption' },
  });
  aggregate.sort({ '_id.deviceId': 1, '_id.week': 1, '_id.year': 1 });
  //aggregate.unwind({ path: '$_id' });
  // aggregate.populate({});

  const options = {
    pagination: false,
  };
  const result = await activityService.queryAggregateActivities(aggregate, options);
  let result1Month = { labels: [], datasets: [{ data: [] }] };
  result1Month = getCustomActivity1Month(result, result1Month);
  res.json({ result1Month });
});
const getDevices = catchAsync(async (req, res) => {
  // console.log(req.user);
  const filter = { userId: req.user._id };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await deviceService.queryDevices(filter, options);
  res.send(result);
});
const getRoomDevices = catchAsync(async (req, res) => {
  const filter = { userId: req.user._id, room: req.params.roomId };
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await deviceService.queryDevices(filter, options);
  res.send(result);
});

const getDevice = catchAsync(async (req, res) => {
  const device = await deviceService.getDeviceById(req.params.deviceId);
  if (!device) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Device not found');
  }
  res.send(device);
});

const updateDevice = catchAsync(async (req, res) => {
  const device = await deviceService.updateDeviceById(req.params.deviceId, req.body);
  res.send(device);
});

const deleteDevice = catchAsync(async (req, res) => {
  await deviceService.deleteDeviceById(req.params.deviceId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createDevice,
  getDevices,
  getRoomDevices,
  getDevice,
  updateDevice,
  deleteDevice,
  getTotalConsumptionByDevice,
  getDeviceConsumptionBy1Month,
  getTotalConsumptionAllDevices,
};
