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
              base: function(input) {
                var result = input.result;


                return {
                  name            : result.name,
                  title           : result.title,
                  description     : result.notes,
                  homepage        : '',
                  version         : result.version,
                  licences        : [{id: result.license_id, url: result.license_url}],
                  author          : _.compact([result.author, result.author_email]).join(' '),
                  contributors    : [],
                  resources       : [],
                  sources         : [],
                  image           : '',
                  base            : '',
                  dataDependencies: {},
                  keywords        : _.pluck(result.tags, 'name'),

                  resources: result.resources.map(function(R) { return {
                    hash     : R.hash,
                    mediatype: R.format,
                    name     : R.name,
                    schema   : R.schema,
                    url      : R.url
                  }; })
                };
              }
            }
          }
        }[that.options.source][that.options.version][
          that.options.datapackage.replace('tabular', 'base')
        ](R.body));
      });
  });
}