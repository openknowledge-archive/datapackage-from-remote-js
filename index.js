var _ = require('underscore');
var Promise = require('promise-polyfill');
var request = require('superagent');
var validator = require('validator');


// Query remote endpoint url and map response according passed options
module.exports = function(url, options) {
  var that = this;


  if(_.isUndefined(url) || _.isEmpty(url))
    throw new Error('URL is required');

  if(!validator.isURL(url))
    throw new Error('URL "' + url + '" is invalid');

  // Default options
  this.options = _.extend({
    datapackage: 'base',
    source: 'ckan',
    version: '3.0'
  }, options);

  return new Promise(function(RS, RJ) {
    request.get(url)
      .end(function(E, R) {
        if(E)
          RJ('End point request failed: ' + E);

        // Mapping routines
        RS({
          ckan: {
            '3.0': {
              base: function(input) { return {
                name            : '',
                title           : '',
                description     : '',
                homepage        : '',
                version         : '',
                licences        : [],
                author          : '',
                contributors    : [],
                resources       : [],
                keywords        : [],
                sources         : [],
                image           : '',
                base            : '',
                dataDependencies: {}
              }; }
            }
          }
        }[that.options.source][that.options.version][
          that.options.datapackage.replace('tabular', 'base')
        ](R.body));
      });
  });
}