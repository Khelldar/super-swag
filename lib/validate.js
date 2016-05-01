'use strict';
const utils = require('./utils');


function handler(api, opts) {
  const request = opts.request;

  const operation = api.getOperation(request.path, request.method);
  const validationResults = operation.validateRequest(request);

  if (validationResults.errors.length > 0){
    const badRequestError = {
      statusCode: 400,
      message: validationResults.errors //TODO: transform this into something more readable
    };
    throw badRequestError;
  }
}

module.exports = utils.handlerToMiddleware(handler);
