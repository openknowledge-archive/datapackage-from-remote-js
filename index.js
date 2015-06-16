var _ = require('underscore');
var async = require('async');
var csv = require('csv');
var infer = require('json-table-schema').infer;
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
        ({
          ckan: {
            '3.0': {
              base: function(input) {
                var result = input.result;

                var datapackage = {
                  name            : result.name,
                  title           : result.title,
                  description     : result.notes,
                  homepage        : '',
                  version         : result.version,
                  licences        : [{id: result.license_id, url: result.license_url}],
                  author          : _.compact([result.author, result.author_email]).join(' '),
                  contributors    : [],
                  sources         : [],
                  image           : '',
                  base            : '',
                  dataDependencies: {},
                  keywords        : _.pluck(result.tags, 'name')
                };


                // Get each resource in async and infer it's schema
                async.map(result.resources, function(R, CB) {
                  var resource = {
                    hash     : R.hash,
                    mediatype: R.format,
                    name     : R.name,
                    url      : R.url
                  };

                  var schema = _.isObject(R.schema) && !_.isArray(R.schema) && R.schema;


                  // Not sure which exactly .resources[] property specifies mime type
                  if(!schema && _.contains([R.format, R.mimetype], 'text/csv'))
                    request.get(R.url).end(function(E, RS) {
                      csv.parse(RS.text, function(EJ, D) {
                        if(EJ)
                          CB(null, resource);

                        CB(null, _.extend(resource, {schema: infer(D[0], _.rest(D))}));
                      });
                    });

                  else
                    CB(null, _.extend(resource, schema && {schema: schema}));
                }, function(E, R) { RS(_.extend(datapackage, {resources: R})); });
              }
            }
          }
        })[that.options.source][that.options.version][
          that.options.datapackage.replace('tabular', 'base')
        ](R.body);
      });
  });
}