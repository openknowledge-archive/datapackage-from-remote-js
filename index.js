var _ = require('underscore');
var async = require('async');
var csv = require('csv');
var infer = require('json-table-schema').infer;
var Promise = require('bluebird');
var request = require('superagent');
var validator = require('validator');


function fromOpenData(input, callback) {
  var datapackage = {
    name            : input.name,
    title           : input.title,
    description     : input.notes,
    homepage        : '',
    version         : input.version,
    licences        : [{id: input.license_id, url: input.license_url}],
    author          : _.compact([input.author, input.author_email]).join(' '),
    contributors    : [],
    sources         : [],
    image           : '',
    base            : '',
    dataDependencies: {},
    keywords        : _.pluck(input.tags, 'name')
  };


  // Get each resource in async and infer it's schema
  async.map(input.resources, function(R, CB) {
    var resource = {
      hash     : R.hash,
      mediatype: R.format,
      name     : R.name,
      url      : R.url
    };

    var schema = _.isObject(R.schema) && !_.isArray(R.schema) && R.schema;


    // Not sure which exactly .resources[] property specifies mime type
    if(!schema && _.contains([R.format, R.mimetype], 'text/csv'))
      request.get('http://crossorigin.me/' + R.url).end(function(E, RS) {
        csv.parse(_.first(RS.text.split('\n'), MAX_CSV_ROWS).join('\n'), function(EJ, D) {
          if(EJ)
            CB(null, resource);

          CB(null, _.extend(resource, {schema: infer(D[0], _.rest(D))}));
        });
      });

    else
      CB(null, _.extend(resource, schema && {schema: schema}));
  }, function(E, R) { callback(_.extend(datapackage, {resources: R})); });
}

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
              base: function(input) { fromOpenData(input.result, RS); }
            }
          },

          dkan: {
            '3.0': {
              base: function(input) { fromOpenData(input.result[0], RS); }
            }
          }
        })[that.options.source][that.options.version][
          that.options.datapackage.replace('tabular', 'base')
        ](R.body);
      });
  });
}