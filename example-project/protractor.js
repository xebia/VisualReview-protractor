//Change this to use the package.json version after the release
var VisualReview = require('../visualreview-protractor');
var vr = new VisualReview({
  hostname: 'localhost',
  port: 80,
  projectName: 'Example Project Name',
  // Global Properties Function - Only get the Browser
  propertiesFn: (capabilities) => {
    return {
      browser: capabilities.get('browserName')
    };
  }
});

exports.config = {

  specs: [
    'spec.js'
  ],

  capabilities: {
    browserName: 'chrome',
    shardTestFiles: false,
    maxInstances: 25
  },

  framework: 'jasmine2',

  seleniumAddress: null,

  // expose VisualReview protractor api in tests
  params: {
    visualreview: vr
  }

};

