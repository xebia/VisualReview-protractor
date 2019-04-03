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
 * @property {String} projectName The project name. Can only be defined here.
 * @property {String} host Host. Can only be defined here.
 * @property {Number} port Host port number. Can only be defined here.
 * @property {Boolean} disabled True if we don't want to take screenshots at all.
 * @property {Boolean} strictSSL True to use strict ssl.
 * @property {String} scheme Http or Https
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
 */

var VisualReviewRun = require('./visualreview-run');

/**
 * This class contains the global options for the Visual Review
 * Its main purpose is to store the global options and provide the instances for the runs.
 * This should be the only one to have the host, port and projectName properties.
 * Even so, they can be override by the suite options.
 *
 * @class VisualReview
 */
module.exports = class VisualReview {

  /**
   * Contructor of the class
   * @param {GlobalOptions} options of the project
   * @example
   *     {
   *       hostname: 'localhost',
   *       port: 7000,
   *       projectName: 'EXAMPLE PROJECT',
   *       disabled: false,
   *       propertiesFn: function (capabilities) {
   *           return {
   *             os: capabilities.get('platform'),
   *             browser: capabilities.get('browserName')
   *           };
   *       }
   *     }
   */
  constructor(options) {

    if (!options.projectName) {
      throw new Error('Project Name must be defined.');
    }
    if (!options.hostname) {
      throw new Error('Hostname must be defined.');
    }
    if (!options.port) {
      throw new Error('Port must be defined.');
    }

    //Get Properties Function. If not defined uses the default
    this.propertiesFn = options.propertiesFn || function (capabilities) {
      return {
        os: capabilities.get('platform'),
        browser: capabilities.get('browserName'),
        version: capabilities.get('version')
      }
    };


    this.globalOptions = options;
  }


  /**
   * Retrieves a VisualReviewRun instance that will be used individually for each test suite
   * @param {SuiteOptions} suiteOptions All the suite options that the user wants to add or override
   * @returns {VisualReviewRun} VisualReviewRun with the suite specific options
   * @example
   *     {
   *        suiteName: 'My Suite',
   *        propertiesFn: (capabilities, defaultFn) => {
   *          var defaultCapabiolities = defaultFn;
   *          return def;
   *     }
   */
  getVisualReviewRun(suiteOptions) {
    return new VisualReviewRun(this.globalOptions, suiteOptions);
  }

};

