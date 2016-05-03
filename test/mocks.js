const sinon          = require('sinon');

exports._api = () => {
  return new Promise(function(resolve, reject) {
    resolve({
      getOperation: sinon.stub().returns({
        validateRequest: sinon.stub(),
      }),

    })
  });
}
