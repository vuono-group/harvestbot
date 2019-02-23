"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _datastore = require("@google-cloud/datastore");

var _default = config => {
  const userKind = 'user';
  const datastore = new _datastore.Datastore({
    projectId: config.projectId
  });

  const storeUserData = (id, email) => datastore.save({
    key: datastore.key([userKind, id]),
    data: {
      id,
      email
    }
  });

  const fetchUsers = new Promise(resolve => datastore.runQuery(datastore.createQuery(userKind)).then(res => resolve(res[0])));
  return {
    storeUserData,
    fetchUsers
  };
};

exports.default = _default;