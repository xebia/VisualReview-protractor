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

const util = require('util');
const q = require('q');
const request = require('request');

var _hostname, _port, _scheme, _strictSSL, _catchErrors;

module.exports = function (hostname, port, scheme, strictSSL, catchErrors) {
	_hostname = hostname;
	_port = port;
	_scheme = scheme||'http';
	_strictSSL = strictSSL === false ? false : true;
	_catchErrors = catchErrors

	return {
		createRun: createRun,
		sendScreenshot: sendScreenshot
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
function createRun (projectName, suiteName, branchName) {
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
	}).catch(function (error) {
		return q.reject('an error occurred while creating a new run on the VisualReview server: ' + error);
	});
}

/**
 * Uploads an new screenshot to the given run.
 * @param name
 * @param runId
 * @param metaData
 * @param properties
 * @param png
 * @returns {Promise} a promise. If an error has occured, the promise will reject with a string containing an error message.
 */
function sendScreenshot (name, runId, metaData, properties, compareSettings, png) {
	return _callServer('post', 'runs/' + runId + '/screenshots', null, {
		meta: JSON.stringify(metaData),
		properties: JSON.stringify(properties),
		compareSettings: JSON.stringify(compareSettings),
		screenshotName: name,
		file: {
			value: new Buffer(png, 'base64'),
			options: {
				filename: 'file.png',
				contentType: 'image/png'
			}
		}
	}).catch(function (error) {
		return q.reject('an error occured while sending a screenshot to the VisualReview server: ' + error);
	});
}

function _callServer (method, path, jsonBody, multiPartFormOptions) {
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

	return defer.promise;
}
