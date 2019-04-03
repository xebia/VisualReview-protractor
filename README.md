# VisualReview API for Protractor
Provides an API to send screenshots to [VisualReview](https://github.com/xebia/VisualReview) from your [Protractor](https://github.com/angular/protractor) tests. See [the example](example-project/README.md) for a quick demo.


## Requirements
* Requires Protractor 1.4.0 or higher.
* Requires node 6.4.0 or higher.


## Usage
### Getting started
First add visualreview-protractor to your protractor project's dependencies.

```shell
npm install visualreview-protractor --save
```

### Configure Visual Review on the Protractor config file
To configure visualreview-protractor in your protractor configuration file you will need to add the following information:

```javascript
const VisualReview = require('visualreview-protractor');
const vr = new VisualReview({
  hostname: 'localhost',
  port: 7000,
  scheme: 'https', //(optional: http|https, http is used if not specified)
  strictSSL: true //(optional: true|false, disable ssl certificate check, true if not specified)
});

exports.config = {

  [..],

  params: {
      visualreview: vr // provides API to your tests
  }
}
```

Optionally you can configure default parameters to be used in each run.

```javascript
new VisualReview({
  hostname: 'localhost',
  port: 7000,
  projectName: 'myProject'
});
```

Note that `host` and `port` should only be defined here. The remaining can be overwritten by run or by screenshot.

### Configure a run on your tests
Now you can use the visualreview-protractor API in your tests.

Start by initiating a run under the current project and the given suite. Remember to return the promises from `.initRun()` and `.cleanup()`.

```javascript
const vr = browser.params.visualreview;
const vrRun = vr.getVisualReviewRun({
  suiteName: 'mySuite'
});

describe('angularjs homepage', function () {
  beforeAll(function () {
    // Creates a new run under project name 'myProject', suite 'mySuite'.
    return vrRun.initRun();
  });

  afterAll(function () {
    return vrRun.cleanup();
  });
});
```

### Take a Screenshot

Now you can use the run instance to take screenshots.

To take a screenshot of the viewport:

```javascript
describe('angularjs homepage', function() {
  it('should open the homepage', function () {
    browser.get('https://docs.angularjs.org');
    vrRun.takeScreenshot('AngularJS-homepage');
  });
});
```

To take a screenshot of the viewport, excluding some parts:

```javascript
describe('angularjs homepage', function() {
  it('should open the homepage', function () {
    browser.get('https://docs.angularjs.org');

    vrRun.takeScreenshot('AngularJS-homepage', {
      exclude: [
        { x: 0, y: 0, height: 100, width: 100 },
        element(by.css('.main-body-grid div.grid-right')),
        element(by.css('.brand'))
      ]
    });
  });
});
```

To take a screenshot of a single element, excluding some parts:

```javascript
describe('angularjs homepage', function() {
  it('should open the homepage', function () {
    browser.get('https://docs.angularjs.org');

    vrRun.takeScreenshot('Header', {
      include: element(by.css('.main-body-grid div.grid-left')),
      exclude: [
        element(by.css('[href="api/ng/function/angular.bind"]'))
      ]
    });
  });
});
```


## API
### `VisualReview(options)`

Returns a `VisualReview` instance.

#### `options`
Accepts `options` marked with "✔ Global".

### `VisualReview.getVisualReviewRun(options)`

Returns a `VisualReviewRun` instance.

#### `options`
Accepts `options` marked with "✔ Run".

### `VisualReviewRun.takeScreenshot(name, options)`

#### `name`

Type: `string`
Default: `undefined`

The name of the project.

#### `options`
Accepts `options` marked with "✔ Screenshot".


## Options

The VisualReview accepts a config object such as:

```javascript
{
  hostname: 'localhost',
  port: 7000,
  projectName: 'myProject',
  suiteName: 'mySuite',
  disabled: false,
  compareSettings: {
    precision: 90
  },
  propertiesFn: () => ({ someProperty: 'someValue' }),
  include: element(by.css('.some-element')),
  exclude: [
    { x: 0, y: 0, height: 100, width: 100 },
    element(by.css('.some-element-child'))
  ]
}
```

### `hostname`

Type: `string`
Default: `undefined`
Support: ✔ Global | ✘ Run | ✘ Screenshot

The hostname of the VisualReview server.

### `port`

Type: `number`
Default: `undefined`
Support: ✔ Global | ✘ Run | ✘ Screenshot

The port of the VisualReview server.

### `projectName`

Type: `string`
Default: `undefined`
Support: ✔ Global | ✘ Run | ✘ Screenshot

The name of the project.

### `disabled`

Type: `boolean`
Default: `false`

The name of the project.

### `strictSSL`

Type: `boolean`
Default: `true`

Use or not strict SSL

### `scheme`

Type: `string`
Default: `http`

Scheme to use. HTTP or HTTPS

### `propertiesFn`

Type: `Function`
Default: `(capabilities) => ({ os: capabilities.get('platform'), browser: capabilities.get('browserName'), version: capabilities.get('version') });`
Support: ✔ Global | ✔ Run | ✔ Screenshot

A function to provide the properties for each screenshot.
By default uses a function to extract the `os`, `browser`, and `version` from the browser capabilities.

### `suiteName`

Type: `string`
Default: `undefined`
Support: ✘ Global | ✔ Run | ✘ Screenshot

The name of the suite.

### `include`

Type: `ElementFinder`
Default: `undefined`
Support: ✘ Global | ✘ Run | ✔ Screenshot

The page element to limit the screenshot area. If not defined, the viewport area is used.

### `exclude`

Type: `Array<ElementFinder|{ x:number, y:number, height: number, width: number x\}>`
Default: `[]`
Support: ✘ Global | ✘ Run | ✔ Screenshot

Array of areas to exclude when comparing the screenshot with the baseline.
The areas can be defined bounding boxes or as elements matching a given element finder.


## License
Copyright © 2015 Xebia

Distributed under the [Apache License 2.0](http://http://www.apache.org/licenses/LICENSE-2.0).
