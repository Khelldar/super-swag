'use strict';
const _ = require('lodash');
const helpers = require('./helpers');

module.exports = function (api, options, controllers) {
  const request = options.request;

  const operation = helpers.getOperation(api, request.path, request.method);
  const controllerName = operation.pathObject.definition['x-swagger-router-controller'];
  const funcName = operation.pathObject.definition[request.method.toLowerCase()].operationId;

  if (controllers[controllerName] == null || controllers[controllerName][funcName] == null) {
    throw new Error(`No controller function could be found based on swagger definition.  controller: ${controllerName}, function: ${funcName}`)
  }

  // parse out params in the path
  _.forEach(operation.getParameters(), (param) => {
    if (param.in === 'path') {
      request.routeParams[param.name] = param.getValue({ url: request.path }).value
    }
  })

  return controllers[controllerName][funcName](options);
}
