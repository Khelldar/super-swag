'use strict';
const _ = require('lodash');

module.exports = {
  getOperation: (api, path, method) =>{
    //sway has a bug with path params, use getOperation by passing it an object to work around it
    const operation =  api.getOperation({ url: path, method: method });
    if (operation == null) {
      const otherOperations = api.getOperations(path);
      let err;

      if (otherOperations != null && otherOperations.length > 0){
        err = {
          statusCode: 405,
          message: "Method Not Allowed",
          allowedMethods: _.map(otherOperations, (o) => o.method)
        };
      } else {
        err = {
          statusCode: 404,
          message: "Not Found"
        };
      }
      throw err;
    }

    return operation;
  }
};
