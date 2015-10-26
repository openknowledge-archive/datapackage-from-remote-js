var _ = require('underscore');
var CKAN_LATEST_VER = '3.0';
var csv = require('csv');
var DKAN_LATEST_VER = '3.0';
var infer = require('json-table-schema').infer;
var MAX_CSV_ROWS = 100;
var Promise = require('bluebird');
//var request = require('superagent');
var validator = require('validator');
require('es6-promise').polyfill();
require('isomorphic-fetch');

function fromOpenData(input, callback) {
  var datapackage = {
    name            : input.name || input.id,
    title           : input.title,
    description     : input.notes,
    homepage        : input.url,
    version         : input.version || null,
    licences        : [{id: input.license_id || null, url: input.license_url}],
    author          : _.compact([input.author, input.author_email]).join(' '),
    contributors    : [],
    sources         : [],
    image           : '',
    base            : '',
    dataDependencies: {},
    keywords        : _.pluck(input.tags, 'name')
  };

  // Get each resource and infer it's schema
  Promise.map(input.resources, function(R) {
    var resource = {
      hash     : R.hash,
      mediatype: R.format,
      name     : R.name,
      url      : R.url
    };

    var schema = _.isObject(R.schema) && !_.isArray(R.schema) && R.schema;


    // Not sure which exactly .resources[] property specifies mime type
    if(!schema && _.contains([R.format, R.mimetype], 'text/csv'))
      return new Promise(function(RS, RJ) {
        fetch('http://crossorigin.me/' + R.url).then(function(response) {
          return response.text();
        }).then(function (text){
          csv.parse(
              _.first((text || '').split('\n'), MAX_CSV_ROWS).join('\n'),
              function(EJ, D) {
                if(EJ){
                  return RJ(EJ);
                }
                return RS(_.extend(resource, {schema: infer(D[0], _.rest(D))}));
              }
          );
        });
      });

    else
      return _.extend(resource, schema && {schema: schema});
  }).then(function(R) { callback(_.extend(datapackage, {resources: R})); });
}

// Query remote endpoint url and map response according passed options
module.exports = function(url, options) {
  var that = this;
  var version = _.result(options, 'version');
  var latestVersion = (_.result(options, 'source') === 'dkan') ? DKAN_LATEST_VER : CKAN_LATEST_VER;


  if(_.isUndefined(url) || _.isEmpty(url))
    throw new Error('URL is required');

  if(!validator.isURL(url))
    throw new Error('URL "' + url + '" is invalid');

  // Default options
  this.options = _.extend({
    datapackage: 'base',
    source: 'ckan',

    // Translate alias into certain version
    version: version || latestVersion
  }, options);

  // Replace alias with certain version
  this.options.version = (version === 'latest') ? latestVersion : this.options.version;

  return new Promise(function(RS, RJ) {
    fetch(url).then(function(response) {
      if (response.status != 200){
        RJ('End point request failed: status = ' + response.status);
      }
      return response.json();
    }).then(function (json){
      // Mapping routines
      ({
        ckan:
            _.chain(['1.0', '2.0', '3.0'])
              .map(
                function(V) {
                  return [
                    V,
                    {
                      base: function(input) {
                        fromOpenData(input.result, RS);
                      }
                    }
                  ];
                }).object().value(),

        dkan:
            _.chain(['1.0', '2.0', '3.0'])
                .map(
                  function(V) {
                    return [
                      V,
                      {
                        base: function(input) {
                          fromOpenData(
                              input.result[0],
                              function(DP) {
                                // For DKAN description is in .description, not in .notes in CKAN
                                RS(_.extend(DP, {description: input.result[0].description}))
                              }
                          );
                        }
                      }
                    ];
                  }).object().value()
      })[that.options.source][that.options.version][
          that.options.datapackage.replace('tabular', 'base')
          ](json);
    });
  });
}