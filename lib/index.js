'use strict'
const Sway = require('sway');
const ZSchema = require('z-schema');
const _ = require('lodash');
const util = require('util');
const defaultMiddleware = require('./default');
const routeMiddleware = require('./route');
const validateMiddleware = require('./validate');



class SuperSwag {
  constructor(options) {
    this.swaggerFileLocation = options.swaggerFileLocation;
    this.controllers = options.controllers;
    this.lazyLoadSwaggerFile = options.lazyLoadSwaggerFile || false;
    this.customValidators = options.customValidators || {};

    this.registerFormat = this.registerFormat.bind(this);
    this.authorize = this.authorize.bind(this);
    this.validate = this.validate.bind(this);
    this.route = this.route.bind(this);
    this.default = this.default.bind(this);
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

  authorize(options) {
    throw new Error("not yet implemented");
  }

  validate(options) {
    validateOptions(options);
    return this._api().then((api) => {
      return validateMiddleware(api, options);
    });
  }

  route(options){
    validateOptions(options);

    if (this.controllers == null) {
      throw new TypeError('controllers must be passed in to the SuperSwag constructor to use route middleware.');
    }

    return this._api().then((api) => {
      return routeMiddleware(api, options, this.controllers);
    });
  }

  default(options) {
    validateOptions(options);

    return this._api().then((api) => {
      return defaultMiddleware(api, options);
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
