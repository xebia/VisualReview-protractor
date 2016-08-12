# VisualReview API for Protractor
Provides an API to send screenshots to [VisualReview](https://github.com/xebia/VisualReview) from your [Protractor](https://github.com/angular/protractor) tests. See [the example](example-project/README.md) for a quick demo.

## Requirements
Requires Protractor 1.4.0 or higher.

## Getting started
First add visualreview-protractor to your protractor project's dependencies.

```shell
npm install visualreview-protractor --save-dev
```

Then configure visualreview-protractor in your protractor configuration file. Here's an example:

```javascript
const VisualReview = require('visualreview-protractor');
var vr = new VisualReview({
  hostname: 'localhost',
  port: 7000
});

exports.config = {

  [..],

  /*
      Both .initRun and .cleanup return a q-style promise. If you have some
      other things happening in before- and afterLaunch, be sure to
      return these promise objects.
  */
  beforeLaunch: function () {
      // Creates a new run under project name 'myProject', suite 'mySuite'.
      // Since VisualReview version 0.1.1, projects and suites are created on the fly.
      return vr.initRun('myProject', 'mySuite');

      // additionally you can provide the branchName this run has been initiated on.
      // This defaults to "master". Uses this to create a baseline for a specific feature branch
      // For example:
      // return vr.initRun('myProject', 'mySuite', 'my-feature-branch');
  },

  afterLaunch: function (exitCode) {
      // finalizes the run, cleans up temporary files
      return vr.cleanup(exitCode);
  },

  params: {
      visualreview: vr // provides API to your tests
  }
}
```

Now you can use the visualreview-protractor API in your tests. For example:

```javascript
var vr = browser.params.visualreview;
describe('angularjs homepage', function() {
  it('should open the homepage', function() {
    browser.get('https://docs.angularjs.org');
    vr.takeScreenshot('AngularJS-homepage');
  });
});
```

## Config

The VisualReview accepts a config object such as:

```
{
  hostname: 'localhost',
  port: 7000
}
```

Other options are:

* disabled, default false, a boolean value whether to disable the actual calls to the VisualReview object.
* propertiesFn, a function with a capabilities argument that is used to uniquely identify a screenshot. For example the following configuration omits the browser version as a screenshot identifying property:

```
propertiesFn: function (capabilities) {
    return {
      'os': capabilities.get('platform'),
      'browser': capabilities.get('browserName')
    };
  }
```

* compareSettings, to define the precision of each pixel comparison. The value '0' will result in a failure whenever a difference has been found. Default '0'.

```
compareSettings: {
    precision: 7
}
```

## License
Copyright © 2015 Xebia

Distributed under the [Apache License 2.0](http://http://www.apache.org/licenses/LICENSE-2.0).
