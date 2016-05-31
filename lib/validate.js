'use strict';
const _ = require('lodash');
const helpers = require('./helpers');

module.exports = function (api, options) {
  const request = options.request;

  const operation = helpers.getOperation(api, request.path, request.method);
  request.url = request.path; //needed for sway
  const validationResults = operation.validateRequest(request);

  if (validationResults.errors.length > 0){
    const badRequestError = {
      statusCode: 400,
      message: validationResults.errors //TODO: transform this into something more readable with a util function
    };
    throw badRequestError;
  }
}
