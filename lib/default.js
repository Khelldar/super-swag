'use strict';
const _ = require('lodash');
const helpers = require('./helpers');

module.exports = function (api, options) {
  const request = options.request;
  const body = request.body || {};

  const operation = helpers.getOperation(api, request.path, request.method);

  _.forEach(operation.definitionFullyResolved.parameters, (parameter) => {
    if (parameter.schema != null && parameter.schema.type === 'object' ) { //TODO: open this up to more than just objects
      _setDefaults(body, parameter.schema);
    }
  });
}

function _setDefaults(body, definition, property, chain) {
  chain = chain || [];
  if (definition.default != null && get(body, chain) === undefined) {
    set(body, chain, definition.default);
    return;
  }

  if(definition.properties != null){
    _.forEach(definition.properties, (definition, property) => {
      _setDefaults(body, definition, property, chain.concat(property));
    });
  }
}

function set(obj, chain, value) {
    var o = obj;  // ref to properties as we go down the chain
    var len = chain.length;
    for(var i = 0; i < len-1; i++) {
        var elem = chain[i];
        if( !o[elem] ){
          o[elem] = {}
        }
        o = o[elem];
    }

    o[chain[len-1]] = value;
}

function get(obj, chain) {
  var o = obj;  // ref to properties as we go down the chain
  var len = chain.length;
  for(var i = 0; i < len-1; i++) {
      var elem = chain[i];
      if( o[elem] == null ){
        return o[elem];
      }
  }

  return o[chain[len-1]];
}
