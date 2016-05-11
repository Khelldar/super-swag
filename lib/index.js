'use strict'
const Sway = require('sway');
const ZSchema = require('z-schema');
const _ = require('lodash');
const util = require('util');

class SuperSwag {
  constructor(options) {
    this.swaggerFileLocation = options.swaggerFileLocation;
    this.controllers = options.controllers;
    this.lazyLoadSwaggerFile = options.lazyLoadSwaggerFile || false;
    this.customValidators = options.customValidators || {};

    this.registerFormat = this.registerFormat.bind(this);
    this.authorize = this.authorize.bind(this);
    this.meta = this.meta.bind(this);
    this.validate = this.validate.bind(this);
    this.route = this.route.bind(this);
    this._api = this._api.bind(this);

    if (!options.lazyLoadSwaggerFile) {
      this._api(); // go ahead and load the swagger file and get it cached (or crash)
    }

    //register custom validators
    _.forEach(this.customValidators, (validator, name) => {
      this.registerFormat(name, validator);
    });
  }

  registerFormat(name, validator){
    ZSchema.registerFormat(name, validator);
  }

  meta(options){
    validateOptions(options);
    return this._api().then((api) => {
      const request = options.request;
      const operation = getOperation(api, request.path, request.method);
      request.swaggerOperation = operation;

      // console.log(util.inspect(operation.definitionFullyResolved.parameters[0], { depth: null }));

      // console.log(operation.parameterObjects[0].definitionFullyResolved.schema.properties.permissions);
    });




  }

  authorize(options) {
    throw new Error("not yet implemented");
  }

  validate(options) {
    validateOptions(options);
    return this._api().then((api) => {
      const request = options.request;

      const operation = getOperation(api, request.path, request.method);
      request.url = request.path; //needed for sway
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

      // parse out params in the path
      _.forEach(operation.getParameters(), (param) => {
        if (param.in === 'path') {
          request.routeParams[param.name] = param.getValue({ url: request.path }).value
        }
      })

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
