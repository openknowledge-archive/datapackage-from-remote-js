var _ = require('underscore');
var assert = require('chai').assert;
var chai = require('chai');
var fromRemote = require('./index');
var Promise = require('bluebird');
var request = require('superagent');
var requestMock = require('superagent-mock');
var should = require('chai').should();
var TEST_DATA = require('./test-data');


describe('Datapackage from remote', function() {
  // Test schema infer only in one specific test case
  var responseWithSchemaCKAN = _.extend(
    {}, TEST_DATA.CKAN_V3_ENDPOINT_RESPONSE,

    {result: _.extend({}, TEST_DATA.CKAN_V3_ENDPOINT_RESPONSE.result, {
      resources: TEST_DATA.CKAN_V3_ENDPOINT_RESPONSE.result.resources.map(function(R) {
        return _.extend({}, R, R.format == 'text/csv' && {schema: TEST_DATA.VALID_TABLE_SCHEMA});
      })
    })}
  );

  var responseWithSchemaDKAN = _.extend(
    {}, TEST_DATA.DKAN_V3_ENDPOINT_RESPONSE,

    {result: [_.extend({}, TEST_DATA.DKAN_V3_ENDPOINT_RESPONSE.result[0], {
      resources: TEST_DATA.DKAN_V3_ENDPOINT_RESPONSE.result[0].resources.map(function(R) {
        return _.extend({}, R, R.format == 'text/csv' && {schema: TEST_DATA.VALID_TABLE_SCHEMA});
      })
    })]}
  );


  it('throw exception if no url or empty url passed in params', function(done, err) {
    if(err) done(err);

    try {
      fromRemote();
    } catch(exception) {
      exception.message.should.be.not.empty;
      exception.message.should.be.a('string');

      try {
        fromRemote('');
      } catch(exception) {
        exception.message.should.be.not.empty;
        exception.message.should.be.a('string');
        done();
      }
    }

    return;
  });

  it('throw exception if url is invalid', function(done, err) {
    if(err) done(err);

    try {
      fromRemote('invalidurl');
    } catch(exception) {
      exception.message.should.be.not.empty;
      exception.message.should.be.a('string');
      done();
    }

    return;
  });

  it('return Promise object', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return TEST_DATA.CKAN_V3_ENDPOINT_RESPONSE; },
      pattern: '.*'
    }]);

    fromRemote('http://valid.url.com').should.be.an.instanceOf(Promise);
    done();
  });

  it('map CKAN versions 1.0, 2.0 and 3.0 into base datapackage', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return responseWithSchemaCKAN; },
      pattern: '.*'
    }]);

    Promise.each(['1.0', '2.0', '3.0'], function(V) {
      return new Promise(function(RS, RJ) {
        fromRemote('http://valid.url.com', {version: V}).then(function(DP) {
          DP.should.be.deep.equal(TEST_DATA.CKAN_V3_BASE_DATAPACKAGE);
          RS(true);
        });
      });
    })
      .catch(function(E) { console.log(E); })
      .then(function() { done(); });
  });

  it('map CKAN versions 1.0, 2.0 and 3.0 into tabular datapackage', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return responseWithSchemaCKAN; },
      pattern: '.*'
    }]);

    Promise.each(['1.0', '2.0', '3.0'], function(V) {
      return new Promise(function(RS, RJ) {
        fromRemote('http://valid.url.com', {datapackage: 'tabular', version: V}).then(function(DP) {
          DP.should.be.deep.equal(TEST_DATA.CKAN_V3_BASE_DATAPACKAGE);
          RS(true);
        });
      });
    })
      .catch(function(E) { console.log(E); })
      .then(function() { done(); });
  });

  it('map DKAN versions 1.0, 2.0 and 3.0 into base datapackage', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return responseWithSchemaDKAN; },
      pattern: '.*'
    }]);

    Promise.each(['1.0', '2.0', '3.0'], function(V) {
      return new Promise(function(RS, RJ) {
        fromRemote('http://valid.url.com', {source: 'dkan', version: V}).then(function(DP) {
          DP.should.be.deep.equal(TEST_DATA.DKAN_V3_BASE_DATAPACKAGE);
          RS(true);
        });
      });
    })
      .catch(function(E) { console.log(E); })
      .then(function() { done(); });
  });

  it('map DKAN versions 1.0, 2.0 and 3.0 into tabular datapackage', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return responseWithSchemaDKAN; },
      pattern: '.*'
    }]);

    Promise.each(['1.0', '2.0', '3.0'], function(V) {
      return new Promise(function(RS, RJ) {
        fromRemote('http://valid.url.com', {datapackage: 'tabular', source: 'dkan', version: V}).then(function(DP) {
          DP.should.be.deep.equal(TEST_DATA.DKAN_V3_BASE_DATAPACKAGE);
          RS(true);
        });
      });
    })
      .catch(function(E) { console.log(E); })
      .then(function() { done(); });
  });

  it('translates "latest" value of version option into certain version', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return responseWithSchemaCKAN; },
      pattern: '.*'
    }]);

    fromRemote('http://valid.url.com', {version: 'latest'}).then(function(DP) {
      DP.should.be.deep.equal(TEST_DATA.CKAN_V3_BASE_DATAPACKAGE);
      done();
    });
  });

  it('infer schema for resources with no schema specified or invalid schema', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return TEST_DATA.CKAN_V3_ENDPOINT_RESPONSE; },
      pattern: '.*'
    }]);

    // Resource with empty schema, but in csv format    
    requestMock(request, [{
      callback: function (match, data) { return {text: data}; },
      fixtures: function (match, params) { return TEST_DATA.VALID_CSV; },
      pattern: 'https://ckannet-storage.commondatastorage.googleapis.com/2015-06-04T09:12:06.147Z/populationnumber-by-governorates-age-group-gender.csv'
    }]);
    
    // Resource in csv format with invalid schema
    requestMock(request, [{
      callback: function (match, data) { return {text: data}; },
      fixtures: function (match, params) { return TEST_DATA.VALID_CSV; },
      pattern: 'https://ckannet-storage.commondatastorage.googleapis.com/2015-06-04T09:12:06.147Z/populationnumber-by-governorates-age-group-gender-3.csv'
    }]);

    fromRemote('http://valid.url.com').then(function(DP) {
      DP.should.be.deep.equal(TEST_DATA.CKAN_V3_BASE_DATAPACKAGE);
      done();
    });
  });
});