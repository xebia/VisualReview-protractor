/*
 Copyright 2015 Xebia

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const q = require('q');
const request = require('request');

const RUN_PID_FILE = '.visualreview-runid.pid';
const API_VERSION = "1";

module.exports = VisualReview;

function VisualReview(options) {
  function defaultMetaDataFn() {
    return {};
  }

  function defaultPropertiesFn(capabilities) {
    return {
      'os': capabilities.caps_.platform,
      'browser': capabilities.caps_.browserName,
      'version': capabilities.caps_.version
    }
  }

  var hostname = options.hostname || 'localhost';
  var port = options.port || 7000;
  var metaDataFn = options.metaDataFn || defaultMetaDataFn;
  var propertiesFn = options.propertiesFn || defaultPropertiesFn;

  this._callServer = function (method, path, jsonBody, multiPartFormOptions) {
    var defer = q.defer();

    var requestOptions = {
      method: method.toUpperCase(),
      uri: 'http://' + hostname + ':' + port + '/api/' + path
    };

    // for JSON body request
    if (jsonBody) {
      requestOptions.body = jsonBody;
      requestOptions.json = true;
    }

    // for multipart forms
    if (multiPartFormOptions) {
      requestOptions.formData = multiPartFormOptions;
    }

    request(requestOptions, function (error, response, body) {
      if (error) {
        defer.reject(error);
      } else if (parseInt(response.statusCode) >= 400 && parseInt(response.statusCode) < 600) {
        defer.reject('VisualReview server returned status ' + response.statusCode + ": " + body);
      } else {
        try {
          defer.resolve(body);
        } catch (e) {
          defer.reject("could not parse JSON response from server " + e);
        }
      }
    });

    return defer.promise;
  };

  this._writeRunIdFile = function (run) {
    var defer = q.defer();
    fs.writeFile(RUN_PID_FILE, run, function (err) {
      if (err) {
        defer.reject("could not write temporary runId file. " + err)
      } else {
        defer.resolve(run);
      }
    });

    return defer.promise;
  };

  this._readRunIdFile = function () {
    var defer = q.defer();

    fs.readFile(RUN_PID_FILE, function (err, data) {
      if (err) {
        defer.reject("could not read temporary run pid file + " + err);
      } else {
        defer.resolve(JSON.parse(data));
      }
    });

    return defer.promise;
  };

  this._checkServerApiVersion = function () {
    return this._callServer('get', 'version').then(function (result) {
      if (result !== API_VERSION) {
        throw new Error('server\'s API version (' + result + ') is not compatible with this version of VisualReview-protractor. ' +
          'Please visit VisualReview-protractor\'s website for more information.');
      }
    });
  };

  this._createRun = function (projectName, suiteName) {
    return this._callServer('post', 'runs', {
      'projectName': projectName,
      'suiteName': suiteName
    }).then(
      function (result) {
        var createdRun = {
          run_id: result.id,
          project_id: result.projectId,
          suite_id: result.suiteId
        };

        if (result.id) {
          console.log("created run with ID", createdRun.run_id);
          return this._writeRunIdFile(JSON.stringify(createdRun));
        } else {
          throw new Error('VisualReview server returned an empty run id when creating a new run. Probably something went wrong with the server.');
        }
      }.bind(this),
      function (err) {
        throw new Error('received error response from VisualReview server: ' + err);
      });
  };

  this.initRun = function (projectName, suiteName) {
    return this._checkServerApiVersion()
      .then(function () { return this._createRun(projectName, suiteName);}.bind(this))
      .catch(function (error) {
        throw new Error('VisualReview-protractor: an error occured while initializing a run: ' + error);
      });
  };

  this._getProperties = function (browser) {
    return browser.getCapabilities()
      .then(propertiesFn)
      .then(function (properties) {
        return browser.manage().window().getSize().then(function (size) {
          properties.resolution = size.width + 'x' + size.height;
          return properties;
        });
      });
  };

  this._getMetaData = function (browser) {
    return browser.getCapabilities().then(metaDataFn);
  };

  this.takeScreenshot = function (name) {
    return browser.driver.controlFlow().execute(function () {

      return q.all([this._getProperties(browser), this._getMetaData(browser), browser.takeScreenshot(), this._readRunIdFile()]).then(function (results) {
        var properties = results[0],
            metaData = results[1],
            png = results[2],
            run = results[3];

        if (!run) {
          throw new Error('VisualReview-protractor: Could not send screenshot to VisualReview server, could not find any run ID. Was initRun called before starting this test? See VisualReview-protractor\'s documentation for more details on how to set this up.');
        }

        return this._callServer('post', 'runs/' + run.run_id + '/screenshots', null, {
          meta: JSON.stringify(metaData),
          properties: JSON.stringify(properties),
          screenshotName: name,
          file: {
            value: new Buffer(png, 'base64'),
            options: {
              filename: 'file.png',
              contentType: 'image/png'
            }
          }
        })
      }.bind(this)).then(
        function (response) {
          return response;
        },
        function (err) {
          throw new Error('VisualReview-protractor: Something went wrong while sending a screenshot to the VisualReview server. ' + err);
        });
    }.bind(this));
  };

  this.cleanup = function () {
    var defer = q.defer();

    this._readRunIdFile().then(function (run) {
      console.log('test finished. Your results can be viewed at: ' +
      'http://' + hostname + ':' + port + '/#/' + run.project_id + '/' + run.suite_id + '/' + run.run_id + '/rp');
      fs.unlink(RUN_PID_FILE, function (err) {
        if (err) {
          defer.reject(err);
        } else {
          defer.resolve();
        }
      });
    });

    return defer.promise;
  }
}
