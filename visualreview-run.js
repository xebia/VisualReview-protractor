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

/**
* Global Options
* @typedef {Object} GlobalOptions
* @property {String} projectName The project name. Can only be defined on the VisualReview class.
* @property {String} host Host. Can only be defined on the VisualReview class.
* @property {Number} port Host port number. Can only be defined on the VisualReview class.
* @property {Boolean} strictSSL True to use strict ssl.
* @property {String} scheme Http or Https
* @property {Boolean} disabled True if we don't want to take screenshots at all.
* @property {function} propertiesFn function to use to extract properties.
*                      Can be overrided on the suite options.
*                      Can be overrided on the screenshot options.
*
* Suite Options
* @typedef {Object} SuiteOptions
* @property {String} suiteName The suite name. Can only be defined here.
* @property {Boolean} disabled True if we don't want to take screenshots on this suite.
*                      It will be overrided if the global options disabled is true.
* @property {function} propertiesFn function to use to extract properties.
*                      Can be overrided on the screenshot options.
*                      It will override the global options property.
*
* Screenshot Options
* @typedef {Object} ScreenshotOptions
* @property {Array<Mask,ElementFinder>} exclude Masks or ElementFinder to exclude from the screenshot
* @property {ElementFinder} include ElementFinder to reach the element that will be the screenshot target
* @property {function} propertiesFn function to use to extract properties
*
* Mask of an element
* @typedef {Object} Mask
* @property {Number} x X coordinate of the element
* @property {Number} y Y coordinate of the element
* @property {Number} width width of the element
* @property {Number} height heigh of the element
*/

var q = require('q');
var VrClient = require('./lib/vr-client.js');

/**
 * This class contains the suite options for the Visual Review
 * Its main purpose is to store the options for the suite run .
 * The host, port and projectName properties should not be defined here, although they can.If
 * they are defined here they will override the global options.
 * Even so, they can be override by the test options when taking the screenshot.
 *
 * @class VisualReviewRun
 */
module.exports = class VisualReviewRun {


  /**
   * Contructor of the class
   * @param {GlobalOptions} globalOptions
   * @param {SuiteOptions} suiteOptions
   * @example
   * {
   *     globalOptions:{
   *       hostname: 'localhost',
   *       port: 7000,
   *       projectName: 'EXAMPLE PROJECT',
   *       disabled: false,
   *       propertiesFn: (capabilities) => {
   *           return {
   *             os: capabilities.get('platform'),
   *             browser: capabilities.get('browserName')
   *           };
   *       }
   *     },
   *     suiteOptions: {
   *        suiteName: 'My Suite',
   *        propertiesFn: (capabilities, defaultFn) => {
   *          var defaultCapabiolities = defaultFn;
   *          return def;
   *        }
   *     }
   * }
   */
  constructor(globalOptions, suiteOptions) {

    if (!suiteOptions.suiteName) {
      throw new Error('Suite Name must by defined must be defined!!');
    }

    // Options that are set on the global Options only
    this.projectName = globalOptions.projectName;
    this.hostname = globalOptions.hostname;
    this.port = globalOptions.port;
    this.branchName = globalOptions.branchName;
    this.scheme = globalOptions.scheme;
    this.strictSSL = globalOptions.strictSSL;

    //Get Properties Function. If not defined uses the global
    this.propertiesFn = suiteOptions.propertiesFn || globalOptions.propertiesFn;

    //Run specific options
    this.suiteName = suiteOptions.suiteName;
    //create the VRClient
    this.client = new VrClient(this.hostname, this.port, this.scheme, this.strictSSL);

    //Disabled special case
    this.disabled = !!(globalOptions.disabled || suiteOptions.disabled);

    // To be filled after the run starts
    this.projectId;
    this.suiteId;
    this.runId;

    //Capabilities to not make a second request to browser.getCapabilities
    this.capabilities;
  }

  /**
   * Starts a Run on the Visual Review Server
   * @returns {Promise} a promise which resolves when the run is created successfuly on the server
   * 									  If an error has occurred, the promise will reject with a string containing an error message.
   */
  initRun() {
    //check disabled scenario
    if (this.disabled) {
      return;
    }

    return browser.driver.controlFlow().execute(() => {
      return this.client.createRun(this.projectName, this.suiteName, this.branchName).then((createdRun) => {
        if (createdRun) {
          this.projectId = createdRun.project_id;
          this.suiteId = createdRun.suite_id;
          this.runId = createdRun.run_id;

          //Log run creation into console
          this._logMessage('Created run with ID ' + createdRun.run_id);
        }
      }).catch((err) => {
        this._throwError(err);
      });

    });
  }

  /**
   * Takes the screenshot and sends it to the VisualReview Server
   * @param {String} name Name of the screenshot
   * @param {ScreenshotOptions} options options of the screenshot
   */
  takeScreenshot(name, options) {
    var elementToTakeScreenshot = options && options.include ? options.include : null;
    var masksToAdd = options && options.exclude ? options.exclude : null;
    var propertiesFn = options && options.propertiesFn ? options.propertiesFn : this.propertiesFn;

    if (options && options.disabled) {
      this._logMessage("Test screenshot is disabled. No Screenshot will be taken!.");
      return {
        getResult: () => { return true; }
      };
    }

    return browser.driver.controlFlow().execute(() => {
      return this._getMasks(masksToAdd, elementToTakeScreenshot).then(masks => {
        // send screenshot of an element
        return this._takeScreenshotAndSendToClient(name, elementToTakeScreenshot, masks, propertiesFn).then((result) => {
          return result;
        }).catch(err => {
          this._throwError(err);
        });
      });
    });
  }

  /**
   * Returns all the masks for the screenshot in the correct format
   *
   * NOTES: 1 - You can pass an array with masks or ElementFinders.
   *        2 - If we are taking a screenshot to an element, the masks coordinates
   *      will be corrected regarding the element screenshot mask.
   * @param {Array<Mask,ElementFinder>} masks Masks or elements to extract masks from
   * @param {ElementFinder} relatedElement element that will have masks
   * @return {Promise<Array<Mask>>} All the masks that the screenshot will have
   */
  _getMasks(masks, relatedElement) {
    var defer = q.defer();
    var testMasks = [];
    var mask = {
      excludeZones: []
    };

    //Check masks (Elements to Exclude)
    if (masks && masks.length > 0) {
      var promises = [];

      masks.forEach(mk => {
        if (mk.x && mk.y && mk.width && mk.height) {
          testMasks.push(mk);
        } else {
          promises.push(this._getMaskForElement(mk));
        }
      });

      q.all(promises).then((masksProcessed) => {
        //add the elements maks to the mask array
        masksProcessed.forEach(m => testMasks.push(m));

        if (relatedElement) {

          // Get the element mask to fix all the others that will be defined for the viewport screenshot
          this._getMaskForElement(relatedElement).then((screenshotElementMask) => {

            testMasks.forEach(m => {
              var correctedMask = {
                height: m.height,
                x: m.x - screenshotElementMask.x,
                width: m.width,
                y: m.y - screenshotElementMask.y
              };

              mask.excludeZones.push(correctedMask);
            });

            defer.resolve(mask);
          });
        } else {
          mask.excludeZones = testMasks;
          defer.resolve(mask);
        }
      });
    } else {
      defer.resolve({});
    };

    return defer.promise;
  };

  /**
   * Instructs Protractor to take a screenshot and sends it to the VisualReview server.
   * @param {String} name the screenshot's name.
   * @param {ElementFinder} element ElementFinder if you don't want to take a picture of the entire screen
   * @param {Array<Mask>} mask Array of masks that you want to add to the screenshot.
   * @returns {Promise} Promise that will be solved when the screenshot is sent to the server.
   *                    It returns a function that enables the user to get the result of the screenshot if he wants to.
   */
  _takeScreenshotAndSendToClient(name, element, masks, propertiesFn) {

    return this._getProperties(propertiesFn).then(properties => {
      var maskToUse = masks ? Object.assign(masks) : {};
      var elementToTakeScreenShot = element ? element : browser;

      return elementToTakeScreenShot.takeScreenshot().then((png) => {

        if (!this.runId) {
          return q.reject('VisualReview-protractor: Could not send screenshot to VisualReview server, could not find any run ID. Was initRun called before starting this test? See VisualReview-protractor\'s documentation for more details on how to set this up.');
        }

        return this.client.sendScreenshot(name, this.runId, {}, properties, this.compareSettings, png, maskToUse)
          .then(() => {
            return {
              getResult: () => { return this._getTestResult(name); }
            };
          })
          .catch((err) => {
            return q.reject('Something went wrong while sending a screenshot to the VisualReview server. ' + err);
          });
      });
    }).catch((err) => {
      return q.reject('Something went wrong while trying to get the capabilities for this test ' + err);
    });;
  }

  /**
   * Extracts the mask from an element
   * @param {ElementFinder} elem Element that we want to extract the mask from
   * @returns {Promise<Mask>} Promise that will be solkved into the mask of the element.
   * If something goes wrong we throw an error.
   * @example
   *  {
   *    height: 200,
   *    x: 0,
   *    width: 45,
   *    y: 0
   *  }
   */
  _getMaskForElement(elem) {
    var defer = q.defer();
    elem.getSize().then((size) => {
      elem.getLocation().then((location) => {
        defer.resolve({
          height: size.height,
          x: location.x,
          width: size.width,
          y: location.y
        })
      }).catch((err) => {
        defer.reject('Error trying to get the mask location for the element ', err);
      });
    }).catch((err) => {
      defer.reject('Error trying to get the mask size for the element ', err);
    });

    return defer.promise;
  }


  /**
   * Gets the test result from the analysis of the run.
   * @param {String} testName
   * @returns {Promise<boolean>} Promise that will be resolved into a boolean. True if the test passed.
   */
  _getTestResult(testName) {
    return browser.driver.controlFlow().execute(() => {
      return this.client.getRunAnalysisByRunId(this.runId)
        .then((results) => {
          return this._extractResultsforTest(results, testName);
        })
        .catch((err) => {
          this._throwError('Something went wrong while getting the test results. ' + err);
        });
    });
  }


  /**
   * Returns the test result
   * Everything that is not "accepted" will be considered a failure
   * @param {Object} results results of the run.
   * @param {String} testName test name
   * @returns {boolean} True if the screenshot was accepted.
   */
  _extractResultsforTest(results, testName) {
    var parsedResults = JSON.parse(results);
    var tests = parsedResults.diffs.filter((test) => {
      return test.after.screenshotName == testName;
    });

    if (tests.length !== 1) {
      this._logMessage(`There are 0 or more than 1 screenshot with this name: ${testName}`);
      return false;
    }

    return tests[0].status === "accepted";
  }

  /**
   * Returns the system capabilities if they are not defined
   * @returns {Object} Object that represents the system properties
   */
  _getProperties(propertiesFn) {
    return browser.manage().window().getSize().then((size) => {
      return this._getCapabilities().then(() => {
        var properties = propertiesFn(this.capabilities, this.propertiesFn);
        properties.resolution = size.width + 'x' + size.height;
        return properties;
      });
    });
  }

  /**
   * Gets the current browser Capabilities.
   * Note: It will only extract the capabilities from the browser once.
   * @returns {Promise} Browser Capabilities
   */
  _getCapabilities() {
    var defer = q.defer();

    if (!this.capabilities) {
      browser.getCapabilities().then((capabilities) => {
        this.capabilities = capabilities;
        defer.resolve();
      });
    } else {
      defer.resolve();
    }

    return defer.promise;
  }

  /**
   * Logs the pretended message on the console
   * @param {String} message Message to log
   */
  _logMessage(message) {
    console.log(`[Visual Review][${this.projectName}][${this.suiteName}][${this.runId}] ${message}`);
  }

  /**
   * Throws an error with the pretended message
   * @param {String} message Pretended Message
   */
  _throwError(message) {
    throw `[Visual Review][${this.projectName}][${this.suiteName}][${this.runId}] ${message}`;
  }

  /**
   * Prints the location results
   * NOTE: Can be used in the future to present more complete logs
   * @returns {Promise}
   */
  cleanup() {
    if (!this.disabled) {
      this._logMessage('Tests finished. Your results can be viewed at: ' +
        'http://' + this.hostname + ':' + this.port + '/#/' + this.projectId + '/' + this.suiteId + '/' + this.runId + '/rp');
    }
  }
};

