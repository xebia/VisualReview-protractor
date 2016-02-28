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
const q = require('q');
const request = require('request');

const VrClient = require('./lib/vr-client.js');

const RUN_PID_FILE = '.visualreview-runid.pid';
const LOG_PREFIX = 'VisualReview-protractor: ';

var _hostname, _port, _client, _metaDataFn, _propertiesFn;

module.exports = function (options) {
  _hostname = options.hostname || 'localhost';
  _port = options.port || 7000;
  _client = new VrClient(_hostname, _port);
  _metaDataFn = options.metaDataFn || function () { return {}; };
  _propertiesFn = options.propertiesFn || function (capabilities) {
    return {
      'os': capabilities.caps_.platform,
      'browser': capabilities.caps_.browserName,
      'version': capabilities.caps_.version
    }
  };

  return {
    initRun: initRun,
    takeScreenshot: takeScreenshot,
    cleanup: cleanup
  };
};

/**
 * Initializes a run on the given project's suite name.
 * @param projectName
 * @param suiteName
 * @returns {Promise} a promise which resolves a new Run object with the fields run_id, project_id, suite_id.
 * 									  If an error has occurred, the promise will reject with a string containing an error message.
 */
function initRun (projectName, suiteName) {
  return _client.createRun(projectName, suiteName).then( function (createdRun) {
      if (createdRun) {
        _logMessage('created run with ID ' + createdRun.run_id);
        return _writeRunIdFile(JSON.stringify(createdRun));
      }
    }.bind(this),
    function (err) {
      _throwError(err);
    });
}

/**
 * Instructs Protractor to create a screenshot of the current browser and sends it to the VisualReview server.
 * @param name the screenshot's name.
 * @returns {Promise}
 */
function takeScreenshot (name) {
  return browser.driver.controlFlow().execute(function () {

    return q.all([_getProperties(browser), _getMetaData(browser), browser.takeScreenshot(), _readRunIdFile()]).then(function (results) {
      var properties = results[0],
        metaData = results[1],
        png = results[2],
        run = results[3];

      if (!run || !run.run_id) {
        _throwError('VisualReview-protractor: Could not send screenshot to VisualReview server, could not find any run ID. Was initRun called before starting this test? See VisualReview-protractor\'s documentation for more details on how to set this up.');
      }

      return _client.sendScreenshot(name, run.run_id, metaData, properties, png)
        .catch(function (err) {
          _throwError('Something went wrong while sending a screenshot to the VisualReview server. ' + err);
        });
    });
  }.bind(this));
}

/**
 * Cleans up any created temporary files.
 * Call this in Protractor's afterLaunch configuration function.
 * @param exitCode Protractor's exit code, used to indicate if the test run generated errors.
 * @returns {Promise}
 */
function cleanup (exitCode) {
  var defer = q.defer();

  _readRunIdFile().then(function (run) {
    _logMessage('test finished. Your results can be viewed at: ' +
      'http://' + _hostname + ':' + _port + '/#/' + run.project_id + '/' + run.suite_id + '/' + run.run_id + '/rp');
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

function _writeRunIdFile (run) {
  var defer = q.defer();
  fs.writeFile(RUN_PID_FILE, run, function (err) {
    if (err) {
      defer.reject("VisualReview-protractor: could not write temporary runId file. " + err)
    } else {
      defer.resolve(run);
    }
  });

  return defer.promise;
}

function _readRunIdFile () {
  var defer = q.defer();

  fs.readFile(RUN_PID_FILE, function (err, data) {
    if (err) {
      defer.reject("VisualReview-protractor: could not read temporary run pid file + " + err);
    } else {
      defer.resolve(JSON.parse(data));
    }
  });

  return defer.promise;
}

function _getProperties (browser) {
  return browser.getCapabilities()
    .then(_propertiesFn)
    .then(function (properties) {
      return browser.manage().window().getSize().then(function (size) {
        properties.resolution = size.width + 'x' + size.height;
        return properties;
      });
    });
}

function _getMetaData (browser) {
  return browser.getCapabilities().then(_metaDataFn);
}

function _logMessage (message) {
  console.log(LOG_PREFIX + message);
}

function _throwError (message) {
  throw new Error(LOG_PREFIX + message);
}
