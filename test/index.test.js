'use strict';
const chai              = require('chai');
const sinon             = require('sinon');
const sinonChai         = require('sinon-chai');
const sinonStubPromises = require('sinon-promises');
const chaiAsPromised    = require('chai-as-promised');
const SuperSwag = require('../.');

sinonStubPromises(sinon);
chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;


describe('SuperSwag', () => {
  let superSwag, request, response, mockAPI, getOperation, getOperations, getParameters, validateRequest, controllers;

  beforeEach(() => {
    controllers = {
      "elections": {
        "upsert": sinon.stub(),
      },
    };

    superSwag = new SuperSwag({
      swaggerFileLocation: '...',
      lazyLoadSwaggerFile: true,
      controllers: controllers
     });

    //set up the mocked sway api object
    validateRequest = sinon.stub().returns({errors : []});
    getParameters = sinon.stub();
    getOperation = sinon.stub().returns({ validateRequest, getParameters });
    getOperations = sinon.stub();


    //override the _api() helper
    superSwag._api = () => {
      return new Promise(function(resolve, reject) {
        resolve({ getOperation, getOperations });
      });
    };

    request = {
      path: '/elections',
      method: 'post',
      handler: sinon.stub
    };
    response = {};
  });

  describe('#validate', () => {
    it('should error if an object is not passed in', () => {
      expect(() =>{
        superSwag.validate();
      }).to.throw('options')
    });

    it('should error if request is not pased in', () => {
      expect(() =>{
        superSwag.validate({});
      }).to.throw('request')
    });

    it('should look up the operation by path and method', () => {
      return superSwag.validate({ request, response}).then(()=> {
        expect(getOperation).to.be.calledWith({ url: request.path, method: request.method })
      });
    });

    it('promise should 404 if no operations on that path can be found', () => {
      getOperation.returns(undefined);
      getOperations.returns(undefined);
      return superSwag.validate({ request, response})
      .then(()=>{
        expect(true).to.be.false;
      })
      .catch((err) => {
        expect(err.statusCode).to.equal(404);
      });
    });

    it('promise should 405 if no path/method match is found, but the path is OK', () => {
      getOperation.returns(undefined);
      getOperations.returns([{method: 'delete'}]);
      return superSwag.validate({ request, response})
      .then(()=>{
        expect(true).to.be.false;
      })
      .catch((err) => {
        expect(err.statusCode).to.equal(405);
        expect(err.allowedMethods).to.contain('delete');
      });
    });

    it('should pass the request object to validateRequest', () => {
      return superSwag.validate({ request, response}).then(()=> {
        expect(validateRequest).to.be.calledWith(request)
      });
    });

    it('promise should fail if validationResults has any errors', () => {
      validateRequest.returns({errors : [{}]});
      return superSwag.validate({ request, response})
      .then(()=>{
        expect(true).to.be.false;
      })
      .catch((err) => {
        expect(err.statusCode).to.equal(400);
      });

    });

  });

  describe.only('#default', () => {
    it('should error if an object is not passed in', () => {
      expect(() =>{
        superSwag.default();
      }).to.throw('options')
    });

    it('should error if request is not pased in', () => {
      expect(() =>{
        superSwag.default({});
      }).to.throw('request')
    });

    it('should look up the operation by path and method', () => {
      return superSwag.default({ request, response}).then(()=> {
        expect(getOperation).to.be.calledWith({ url: request.path, method: request.method })
      });
    });

    it('should set default values', () => {
      return superSwag.default({ request, response}).then(()=> {
        expect(getOperation).to.be.calledWith({ url: request.path, method: request.method })
      });
    });

  });

  describe('#route', () => {
    beforeEach(() => {
      getOperation.returns({
        pathObject: {
          definition: {
            'x-swagger-router-controller': 'elections',
            'post': {
              operationId: 'upsert'
            }
          }
        },
        getParameters: sinon.stub()
      });
    });

    it('should error if an object is not passed in', () => {
      expect(() =>{
        superSwag.route();
      }).to.throw('options')
    });

    it('should error if request is not pased in', () => {
      expect(() =>{
        superSwag.route({});
      }).to.throw('request')
    });

    it('should look up the operation by path and method', () => {
      return superSwag.route({ request, response}).then(()=> {
        expect(getOperation).to.be.calledWith({ url: request.path, method: request.method });
      });
    });

    it('promise should 404 if no operations on that path can be found', () => {
      getOperation.returns(undefined);
      getOperations.returns(undefined);
      return superSwag.route({ request, response})
      .then(()=>{
        expect(true).to.be.false;
      })
      .catch((err) => {
        expect(err.statusCode).to.equal(404);
      });
    });

    it('promise should 405 if no path/method match is found, but the path is OK', () => {
      getOperation.returns(undefined);
      getOperations.returns([{method: 'delete'}]);
      return superSwag.route({ request, response})
      .then(()=>{
        expect(true).to.be.false;
      })
      .catch((err) => {
        expect(err.statusCode).to.equal(405);
        expect(err.allowedMethods).to.contain('delete');
      });
    });

    it('should throw an error if controllers is not defined', () =>{
      superSwag.controllers = undefined;
      expect(() => {
        superSwag.route({request, response});
      }).to.throw('controllers');
    });

    it('should reject if swagger info does not map to a controller function', () =>{
      getOperation.returns({
        pathObject: {
          definition: {
            'x-swagger-router-controller': 'elections',
            'post': {
              operationId: 'doesNotExist'
            }
          }
        }
      });

      return superSwag.route({ request, response})
      .then(()=>{
        expect(true).to.be.false;
      })
      .catch((err) => {
        expect(err.message).to.contain('controller function')
      });

    });

    it('should reject if swagger info does not map to a controller ', () =>{
      getOperation.returns({
        pathObject: {
          definition: {
            'x-swagger-router-controller': 'doesNotExist',
            'post': {
              operationId: 'doesNotExist'
            }
          }
        }
      });

      return superSwag.route({ request, response})
      .then(()=>{
        expect(true).to.be.false;
      })
      .catch((err) => {
        expect(err.message).to.contain('controller function')
      });

    });

    it('should call the controller function with request and response', () => {
      return superSwag.route({ request, response})
      .then(()=>{
        expect(controllers.elections.upsert).to.be.calledWith({request, response});
      });
    });

  });

});
