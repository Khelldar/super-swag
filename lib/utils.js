'use strict';
const Sway = require('sway');


class Utils {

  getApiSpec(swaggerFileLocation) {
    if (this.apiSpec != null){
      return new Promise((resolve, reject) => {
        resolve(this.apiSpec);
      });
    }

    return Sway.create({definition: swaggerFileLocation})
      .then((api) => {
        this.apiSpec = api;
        return this.apiSpec;
      });
  }

  handlerToMiddleware(handler) {

    return (superSwagOptions) => {
      return (opts) => {
        return this.getApiSpec(superSwagOptions.swaggerFileLocation)
        .then((api) => {
            return handler(api, opts, superSwagOptions);
        });
      };
    };
  }
}


module.exports = new Utils();
