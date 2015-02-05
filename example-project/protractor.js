const VisualReview = require('visualreview-protractor');
var vr = new VisualReview({
  hostname: 'localhost',
  port: 1337
});

exports.config = {
  // ---------------------------------------------------------------------------
  // ----- How to setup Selenium -----------------------------------------------
  // ---------------------------------------------------------------------------
  //
  // There are three ways to use the Selenium Server. Specify one of the
  // following:
  //
  // 1. seleniumServerJar - to start a standalone Selenium Server locally.
  // 2. seleniumAddress - to connect to a Selenium Server which is already
  //    running.
  // 3. sauceUser/sauceKey - to use remote Selenium Servers via Sauce Labs.
  //
  // You can bypass a Selenium Server if you only want to test using Chrome.
  // Set chromeOnly to true and ChromeDriver will be used directly (from the
  // location specified in chromeDriver).

  // The location of the standalone Selenium Server jar file, relative
  // to the location of this config. If no other method of starting Selenium
  // Server is found, this will default to
  // node_modules/protractor/selenium/selenium-server...
  //seleniumServerJar: './node_modules/selenium/lib/runner/selenium-server-standalone-2.20.0.jar',

  //chromeDriver: '/usr/local/bin/chromedriver',

  seleniumAddress: 'http://localhost:4444/wd/hub',

  // The port to start the Selenium Server on, or null if the server should
  // find its own unused port.
  seleniumPort: null,
  // Additional command line options to pass to selenium. For example,
  // if you need to change the browser timeout, use
  // seleniumArgs: ['-browserTimeout=60'],
  seleniumArgs: ['-browserTimeout=60'],

  // If true, only ChromeDriver will be started, not a Selenium Server.
  // Tests for browsers other than Chrome will not run.
  //chromeOnly: true,

  // Spec patterns are relative to the location of this config.
  specs: [
    'spec.js'
  ],

  // ---------------------------------------------------------------------------
  // ----- How to set up browsers ----------------------------------------------
  // ---------------------------------------------------------------------------
  //
  // Protractor can launch your tests on one or more browsers. If you are
  // testing on a single browser, use the capabilities option. If you are
  // testing on multiple browsers, use the multiCapabilities array.

  //multiCapabilities: [
  //  {
  //    browserName: 'firefox'
  //  },
  //  {
  //    browserName: 'chrome'
  //  }
  //],

  // For a list of available capabilities, see
  // https://code.google.com/p/selenium/wiki/DesiredCapabilities
  //
  // In addition, you may specify count, shardTestFiles, and maxInstances.
  //multiCapabilities: [
  //  //{
  //  //  browserName: 'internet explorer'
  //  //},
  //  {
  //    browserName: 'chrome'
  //  }
  //  //,
  //  //{
  //  //  browserName: 'chrome'
  //  //}
  //],
  capabilities: {
    browserName: 'chrome'
  },
  //
  //  // Number of times to run this set of capabilities (in parallel, unless
  //  // limited by maxSessions). Default is 1.
  //  count: 1,
  //
  //  // If this is set to be true, specs will be sharded by file (i.e. all
  //  // files to be run by this set of capabilities will run in parallel).
  //  // Default is false.
  //  shardTestFiles: false,
  //
  //  // Maximum number of browser instances that can run in parallel for this
  //  // set of capabilities. This is only needed if shardTestFiles is true.
  //  // Default is 1.
  //  maxInstances: 1
  //},


  // ---------------------------------------------------------------------------
  // ----- Global test information ---------------------------------------------
  // ---------------------------------------------------------------------------
  //
  // A base URL for your application under test. Calls to protractor.get()
  // with relative paths will be prepended with this.
  //baseUrl: 'https://docs.angularjs.org',

  // Selector for the element housing the angular app - this defaults to
  // body, but is necessary if ng-app is on a descendant of <body>.
  rootElement: 'body',

  // A callback function called once configs are read but before any environment
  // setup. This will only run once, and before onPrepare.
  // You can specify a file containing code to run by setting beforeLaunch to
  // the filename string.
  beforeLaunch: function() {
    return vr.initRun('dev6', 'mySuite3');
    // At this point, global variable 'protractor' object will NOT be set up,
    // and globals from the test framework will NOT be available. The main
    // purpose of this function should be to bring up test dependencies.
  },

  // A callback function called once protractor is ready and available, and
  // before the specs are executed.
  // If multiple capabilities are being run, this will run once per
  // capability.
  // You can specify a file containing code to run by setting onPrepare to
  // the filename string.
  onPrepare: function() {
    // At this point, global variable 'protractor' object will be set up, and
    // globals from the test framework will be available. For example, if you
    // are using Jasmine, you can add a reporter with:
    // jasmine.getEnv().addReporter(new jasmine.JUnitXmlReporter(
    // 'outputdir/', true, true));
    //
    // If you need access back to the current configuration object,
    // use a pattern like the following:
    // browser.getProcessedConfig().then(function(config) {
    // // config.capabilities is the CURRENT capability being run, if
    // // you are using multiCapabilities.
    // console.log('Executing capability', config.capabilities);
    // });
  },

  // A callback function called once tests are finished.
  onComplete: function() {
    // At this point, tests will be done but global objects will still be
    // available.
  },

  // A callback function called once the tests have finished running and
  // the WebDriver instance has been shut down. It is passed the exit code
  // (0 if the tests passed). This is called once per capability.
  onCleanUp: function(exitCode) {},

  // A callback function called once all tests have finished running and
  // the WebDriver instance has been shut down. It is passed the exit code
  // (0 if the tests passed). This is called only once before the program
  // exits (after onCleanUp).
  afterLaunch: function(exitCode) {
    return vr.cleanup(exitCode);
  },

  // ---------------------------------------------------------------------------
  // ----- The test framework --------------------------------------------------
  // ---------------------------------------------------------------------------

  // Test framework to use. This may be jasmine, cucumber, or mocha.
  //
  // Jasmine is fully supported as a test and assertion framework.
  // Mocha and Cucumber have limited beta support. You will need to include your
  // own assertion framework (such as Chai) if working with Mocha.
  framework: 'jasmine',

  // Options to be passed to minijasminenode.
  //
  // See the full list at https://github.com/juliemr/minijasminenode/tree/jasmine1
  jasmineNodeOpts: {
    silent: false,
    showColors: true
  },

  params: {
    visualreview: vr
  }

};

