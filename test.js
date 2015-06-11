var assert = require('chai').assert;
var chai = require('chai');
var fromRemote = require('./index');
var Promise = require('promise-polyfill');
var request = require('superagent');
var requestMock = require('superagent-mock');
var should = require('chai').should();
var TEST_DATA = require('./test-data');


describe('Datapackage from remote', function() {
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

  it('map CKAN version 3 into base datapackage', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return TEST_DATA.CKAN_V3_ENDPOINT_RESPONSE; },
      pattern: '.*'
    }]);

    fromRemote('http://valid.url.com').then(function(DP) {
      DP.should.be.deep.equal(TEST_DATA.CKAN_V3_BASE_DATAPACKAGE);
      done();
    });
  });

  it('map CKAN version 3 into tabular datapackage', function(done, err) {
    if(err) done(err);

    requestMock(request, [{
      callback: function (match, data) { return {body: data}; },
      fixtures: function (match, params) { return TEST_DATA.CKAN_V3_ENDPOINT_RESPONSE; },
      pattern: '.*'
    }]);

    fromRemote('http://valid.url.com', {datapackage: 'tabular'}).then(function(DP) {
      DP.should.be.deep.equal(TEST_DATA.CKAN_V3_BASE_DATAPACKAGE);
      done();
    });
  });
});