'use strict'
// exports.validate = require('./validate');
// exports.authorize = require('./authorize');
// exports.route = require('./route');
const utisl = require('./utils');
const Sway = require('sway');
const _ = require('lodash');

class SuperSwag {
  constructor(options) {
    this.swaggerFileLocation = options.swaggerFileLocation;
    this.controllers = options.controllers;
    this.lazyLoadSwaggerFile = options.lazyLoadSwaggerFile || false;

    this.authorize = this.authorize.bind(this);
    this.validate = this.validate.bind(this);
    this.route = this.route.bind(this);
    this._api = this._api.bind(this);

    if (!options.lazyLoadSwaggerFile) {
      this._api(); // go ahead and load the swagger file and get it cached (or crash)
    }
  }

  authorize(options) {
    throw new Error("not yet implemented");
  }

  validate(options) {
    validateOptions(options);
    return this._api().then((api) => {
      const request = options.request;

      const operation = getOperation(api, request.path, request.method);
      const validationResults = operation.validateRequest(request);

      if (validationResults.errors.length > 0){
        const badRequestError = {
          statusCode: 400,
          message: validationResults.errors //TODO: transform this into something more readable with a util function
        };
        throw badRequestError;
      }
    });
  }

  route(options){
    validateOptions(options);

    if (this.controllers == null) {
      throw new TypeError('controllers must be passed in to the SuperSwag constructor to use route middleware.');
    }

    return this._api().then((api) => {
      const request = options.request;

      const operation = getOperation(api, request.path, request.method);
      const controllerName = operation.pathObject.definition['x-swagger-router-controller'];
      const funcName = operation.pathObject.definition[request.method.toLowerCase()].operationId;

      if (this.controllers[controllerName] == null || this.controllers[controllerName][funcName] == null) {
        throw new Error(`No controller function could be found based on swagger definition.  controller: ${controllerName}, function: ${funcName}`)
      }

      return this.controllers[controllerName][funcName](options);

    });
  }

  _api(){
    if (this.apiSpec == null){
      this.apiSpec = Sway.create({ definition: this.swaggerFileLocation }).catch((err) => {
        console.error("SuperSwag: unable to load swagger file:");
        console.error(err);
        process.exit(1);
      });
    }
    return this.apiSpec;
  }

}

function getOperation(api, path, method){
  const operation =  api.getOperation(path, method);


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

function validateOptions(options) {
  if (!_.isObject(options)) {
   throw new TypeError('options must be an object.');
  }

  if (!_.isObject(options.request)) {
    throw new TypeError('options.request must be an object');
  }

  if (!_.isObject(options.response)) {
    throw new TypeError('options.response must be an object');
  }
}

module.exports = SuperSwag;
