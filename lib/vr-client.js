/*
 * Copyright 2015 Xebia B.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var q = require('q');
var request = require('request');

var _hostname, _port, _scheme, _strictSSL;

module.exports = function (hostname, port, scheme, strictSSL) {
	_hostname = hostname;
	_port = port;
	_scheme = scheme||'http';
	_strictSSL = strictSSL === false ? false : true;

	return {
		createRun: createRun,
		sendScreenshot: sendScreenshot,
		getRunAnalysisByRunId: getRunAnalysisByRunId
	};
};


/**
 * Creates a new run in the given suiteName within the given projectName
 * @param projectName name of the project
 * @param suiteName name of the suite inside the given project
 * @param branchName (optional) name of the branch the suite was run on. Defaults to "master"
 * @returns {Promise} a promise which resolves a new Run object with the fields run_id, project_id, suite_id and branch_name.
 * 									  If an error has occurred, the promise will reject with a string containing an error message.
 *
 */
function createRun(projectName, suiteName, branchName) {
	return _callServer('post', 'runs', {
		branchName: branchName || 'master',
		projectName: projectName,
		suiteName: suiteName
	}).then(function (result) {
		if (!result) {
			return q.reject('server responded with an invalid message. ' +
				'Either something is wrong with your connection to the server or the server itself has encountered a problem.');
		}

		var createdRun = {
			run_id: result.id,
			project_id: result.projectId,
			suite_id: result.suiteId,
			branch_name: result.branchName
		};

		if (!result.id) {
			return q.reject('server returned an empty run id when creating a new run. ' +
				'Probably something went wrong on the server, check its logs for more details.');
		}

		return createdRun;
	}).catch((error) => {
		return q.reject('an error occurred while creating a new run on the VisualReview server: ' + error);
	});
}

/**
 * Uploads an new screenshot to the given run.
 * @param {String} name The name/Id of the test
 * @param {number} runId The runId where the screenshot belongs
 * @param {JSON} metaData NOT USED NOW, but can be usefull in the future
 * @param {JSON} properties Properties of the browser
 * @param {*} png Screenshot
 * @param {Array<JSON>} mask Array of Masks that we want to add to this screenshot
 * @returns {Promise} a promise. If an error has occured, the promise will reject with a string containing an error message.
 */
function sendScreenshot(name, runId, metaData, properties, compareSettings, png, mask) {
	var requestOptions = {
		meta: JSON.stringify(metaData),
		properties: JSON.stringify(properties),
		compareSettings: compareSettings ? JSON.stringify(compareSettings) : '{}',
		screenshotName: name,
		file: {
			value: new Buffer.from(png, 'base64'),
			options: {
				filename: 'file.png',
				contentType: 'image/png'
			}
		}
	};

	//Adds mask excluded zones if they are defined
	if (mask) {
		requestOptions.mask = JSON.stringify(mask);
	}
	return _callServer('post', 'runs/' + runId + '/screenshots', null, requestOptions)
		.catch(function (error) {
			return q.reject('an error occured while sending a screenshot to the VisualReview server: ' + error);
		});
}

/**
 * Extracts the run results
 * @param runId The run Id of the run that we want to get the data from
 * @returns {Promise} a promise. If an error has occured, the promise will reject with a string containing an error message.
 */
function getRunAnalysisByRunId(runId) {
	return _callServer('get', 'runs/' + runId + '/analysis', null)
		.then(function (results) {
			return results;
		})
		.catch( (error) =>{
			throw new Error('An error occured while trying to get the data from the VisualReview server: ' + error);
		});
}

/**
 * Generic function to call the Visual Review API
 * @param {String} method GET or POST
 * @param {String} path API route
 * @param {JSON} jsonBody Body parameters
 * @param {JSON} multiPartFormOptions To use on the POST calls that have multipart/form-data
 * @returns {Promise} a promise. If an error has occured, the promise will reject with a string containing an error message.
 */
function _callServer(method, path, jsonBody, multiPartFormOptions) {
	var defer = q.defer();
	var requestOptions = {
		method: method.toUpperCase(),
		uri: _scheme+'://' + _hostname + ':' + _port + '/api/' + path,
		strictSSL: _strictSSL
	};

	console.log('DEBUG: '+requestOptions.strictSSL);

	// for JSON body request
	if (jsonBody) {
		requestOptions.body = jsonBody;
		requestOptions.json = true;
	}

	// for multipart forms
	if (multiPartFormOptions) {
		requestOptions.formData = multiPartFormOptions;
	}

	try {
		request(requestOptions, function (error, response, body) {
			if (error) {
				defer.reject(error);
			} else if (parseInt(response.statusCode) >= 400 && parseInt(response.statusCode) < 600) {
				defer.reject('code ' + response.statusCode + ": " + body);
			} else {
				try {
					defer.resolve(body);
				} catch (e) {
					defer.reject("could not parse JSON response from server " + e);
				}
			}
		});
	} catch (err) {
		defer.reject('Error when trying to make the request: ' + err);
	}

	return defer.promise;
}
