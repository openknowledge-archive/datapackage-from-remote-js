var assert = require('chai').assert;
var chai = require('chai');
var fromRemote = require('./index');
var request = require('superagent');
var requestMock = require('superagent-mock');
var should = require('chai').should();

var ENDPOINT_RESPONSE = {};


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
    false.should.be.true;
    done();
  });

  it('map CKAN version 3 into base datapackage', function(done, err) {
    if(err) done(err);
    false.should.be.true;
    done();
  });

  it('map CKAN version 3 into tabular datapackage', function(done, err) {
    if(err) done(err);
    false.should.be.true;
    done();
  });
});