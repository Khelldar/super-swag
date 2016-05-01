'use strict';
const _ = require('lodash');

module.exports = (api) => {
  return (opts) => {
   const request = opts.request;

   const operation = api.getOperation(request.path, request.method);
   var security = operation.getSecurity();

   _.forEach(security, (strategy) => {
     if (strategy.key != null){
       keyValidation(request);
     }
   });

 };
};


function keyValidation(request) {
  const headers = request.headers;

  //TODO: validation for real
  if (headers.key != "boggle"){
    const err = {
         statusCode: 401,
         message: "What exactly are you trying to do here?"
       };

       throw err;
  }
}
