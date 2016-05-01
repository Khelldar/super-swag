'use strict';
const utils = require('./utils');
const path = require('path');

function handler(api, opts, superSwagOptions) {
  const request = opts.request;

  const operation = api.getOperation(request.path, request.method);
  if (operation == null){
   const err = {
     statusCode: 404,
     message: 'not found'
   };

   throw err;
  }

  // console.log(operation.pathObject);
  const controllerName = operation.pathObject.definition['x-swagger-router-controller'];
  const funcName = operation.pathObject.definition[request.method.toLowerCase()].operationId;

  //  console.log(controllerName);
  //  console.log(funcName);

  const controllerPath = path.resolve(superSwagOptions.controllerDir, controllerName);

  //  console.log(controllerPath);

  const controller = require(controllerPath);

  return controller[funcName](opts);
}

module.exports = utils.handlerToMiddleware(handler);
