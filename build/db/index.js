'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _datastore = require('@google-cloud/datastore');

var _datastore2 = _interopRequireDefault(_datastore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = () => {
  const datastore = new _datastore2.default({
    projectId: process.env.GCLOUD_PROJECT
  });

  const storeUserData = (id, email) => {
    datastore.save({
      key: datastore.key('user'),
      data: {
        id,
        email
      }
    });
  };

  return { storeUserData };
};