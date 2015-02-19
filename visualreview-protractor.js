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

const RUN_ID_FILE = '.visualreview-runid.pid';

module.exports = VisualReview;

function VisualReview(options) {
  var hostname = options.hostname || 'localhost';
  var port = options.port || 1337;

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
      } else if (parseInt(response.statusCode) >= 400 || parseInt(response.statusCode < 600)) {
        defer.reject('The VisualReview server returned status ' + response.statusCode + ": " + body);
      } else {
        try {
          defer.resolve(body);
        } catch (e) {
          defer.reject("Could not parse JSON response from server " + e);
        }
      }
    });

    return defer.promise;
  };

  this._writeRunIdFile = function (runId) {
    var defer = q.defer();
    fs.writeFile(RUN_ID_FILE, runId, function (err) {
      if (err) {
        defer.reject("VisualReview-protractor: could not write temporary runId file. " + err)
      } else {
        defer.resolve(runId);
      }
    });

    return defer.promise;
  };

  this._readRunIdFile = function () {
    var defer = q.defer();

    fs.readFile(RUN_ID_FILE, function (err, data) {
      if (err) {
        defer.reject("VisualReview-protractor: could not read temporary runId file + " + err);
      } else {
        defer.resolve(data);
      }
    });

    return defer.promise;
  };

  this.initRun = function (projectName, suiteName) {
    return this._callServer('post', 'runs', {
      'projectName': projectName,
      'suiteName': suiteName
    }).then(
      function (result) {
        var createdRunId = result.id;
        if (createdRunId) {
          console.log("VisualReview-protractor: created run with ID", createdRunId);
          return this._writeRunIdFile(createdRunId);
        } else {
          throw new Error('VisualReview-protractor: VisualReview server returned an empty run id when creating a new run. Probably something went wrong with the server.');
        }
      }.bind(this),
      function (err) {
        throw new Error('VisualReview-protractor: an error occurred while creating a new run on the VisualReview server. ' + err);
      });
  };

  this._getMetaData = function (browser) {
    return browser.getCapabilities().then(function (caps) {
      return {
        'os': caps.caps_.platform,
        'browser': caps.caps_.browserName,
        'version': caps.caps_.version
      }
    }).then(function (metadata) {
      return browser.manage().window().getSize().then(function (size) {
        metadata.resolution = size.width + 'x' + size.height;
        return metadata;
      });
    });
  };

  this.takeScreenshot = function (name) {
    return browser.driver.controlFlow().execute(function () {

      return q.all([this._getMetaData(browser), browser.takeScreenshot(), this._readRunIdFile()]).then(function (results) {
        var metaData = results[0],
          png = results[1],
          runId = results[2];

        if (!runId) {
          throw Error('VisualReview-protractor: Could not send screenshot to VisualReview server, could not find any run ID. Was initRun called before starting this test? See VisualReview-protractor\'s documentation for more details on how to set this up.');
        }

        return this._callServer('post', 'runs/' + runId + '/screenshots', null, {
          meta: JSON.stringify(metaData),
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
          throw Error('VisualReview-protractor: Something went wrong while sending a screenshot to the VisualReview server. ' + err);
        });
    }.bind(this));
  };

  this.cleanup = function () {
    var defer = q.defer();

    fs.unlink(RUN_ID_FILE, function (err) {
      if (err) {
        defer.reject(err);
      } else {
        defer.resolve();
      }
    });

    return defer.promise;
  }
}
