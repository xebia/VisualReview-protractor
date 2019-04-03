/**
 * To have short it descriptions names here are some subtitles:
 * CR - Check test result
 * DCR - Don't Check test result
 * UTO - Use Test Options
 * DUTO - Don't use test options
 * UM - Use Mask
 * DUM - Don't use masks
 * VS - Viewport Screenshot
 * ES - Element Screenshot
 * OP - Overrided Properties
 */
var vr = browser.params.visualreview;
var vrRun = vr.getVisualReviewRun({
  suiteName: 'Test Suite Name'
});

//Global Test Options
var ignoreMainGridRight = element(by.css('.main-body-grid div.grid-right'));
var ignoreHeaderBrand = element(by.css('.brand'));
var testGlobalOptions = {
  exclude: [ignoreMainGridRight, ignoreHeaderBrand],
  propertiesFn: (capabilities, propertiesFunction) => {
    var properties = propertiesFunction(capabilities);
    //Remove OS from the default properties
    properties.os = capabilities.get('platform');
    return properties;
  }
};

describe('AngularJS Homepage', function () {

  beforeAll(function () {
    browser.manage().window().setSize(800, 1100);
    vrRun.initRun();

    this.injectorLeftMenuLink = browser.element(by.css('[href="api/ng/function/angular.injector"]'));
    this.isArrayLeftMenuLink = browser.element(by.css('[href="api/ng/function/angular.isArray"]'));
  });

  beforeEach(function () {
    browser.get('https://docs.angularjs.org');
    browser.sleep(2000);
  });

  afterAll(function () {
    //only used to print link for the run results page
    vrRun.cleanup();
  });


  it('VS|DCR|DUTO|DUM - MainPage', function () {
    vrRun.takeScreenshot('VS|DCR|DUTO|DUM - MainPage');
  });

  it('VS|CR|DUTO|DUM - MainPage', function () {
    var result = vrRun.takeScreenshot('VS|CR|DUTO|DUM - MainPage').then(s => s.getResult());

    expect(result).toBe(true);
  });

  it('VS|CR|UTO|UM - MainPage - Ignore Main Right Grid and Brand', function () {

    var result = vrRun.takeScreenshot('VS|CR|UTO|UM - MainPage', testGlobalOptions)
      .then(s => s.getResult());

    expect(result).toBe(true);
  });

  it('VS|DCR|UTO|UM - Injector - Ignore Main Right Grid and Brand', function () {
    // Click on the Left Menu injector option
    this.injectorLeftMenuLink.click()

    vrRun.takeScreenshot('VS|DCR|UTO|UM - Injector', testGlobalOptions);
  });

  it('VS|CR|UTO|UM - Injector - Ignore Main Right Grid and Brand', function () {
    // Click on the Left Menu injector option
    this.injectorLeftMenuLink.click()

    var result = vrRun.takeScreenshot('VS|CR|UTO|UM - Injector', testGlobalOptions).then(s => s.getResult());

    expect(result).toBe(true);
  });

  it('VS|DCR|DUTO|DUM - Injector - Ignore Main Right Grid and Brand', function () {
    // Click on the Left Menu injector option
    this.injectorLeftMenuLink.click()

    vrRun.takeScreenshot('VS|DCR|DUTO|DUM - Injector');
  });

  it('VS|CR|UTO|UM - IsArray - Ignore Main Right Grid and Brand', function () {
    // Click on the Left Menu isArray option
    this.isArrayLeftMenuLink.click()

    vrRun.takeScreenshot('VS|CR|UTO|UM - IsArray', testGlobalOptions);
  });

  it('ES|CR|UTO|UM - Left Grid - Ignore Bind text', function () {

    var elementToTakeScreenshot = element(by.css('.main-body-grid div.grid-left'));
    var elementToIgnore = browser.element(by.css('[href="api/ng/function/angular.bind"]'));

    var testOptions = {
      include: elementToTakeScreenshot,
      exclude: [elementToIgnore]
    };

    var result = vrRun.takeScreenshot('ES|CR|UTO|UM - Left Grid ', testOptions)
      .then(s => s.getResult())

    expect(result).toBe(true);
  });

  it('ES|CR|UTO|DUM - Left Grid', function () {
    var elementToTakeScreenshot = element(by.css('.main-body-grid div.grid-left'));
    var testOptions = {
      include: elementToTakeScreenshot,
    };
    var result = vrRun.takeScreenshot('ES|CR|UTO|DUM - Left Grid ', testOptions)
      .then(s => s.getResult())

    expect(result).toBe(true);
  });

  it('ES|CR|UTO|DUM|OP - Left Grid - Override Properties Function', function () {
    /*
      We are changing the properties function when creating the VisualReview object on the protractor configuration
    file to have only the browserName.
      We are adding the os on the suite options
      And on this test we are going to remove the os.
      So this screenshot should not have the OS info on the Visual Review Server
    */
    var elementToTakeScreenshot = element(by.css('.main-body-grid div.grid-left'));
    var testOptions = {
      include: elementToTakeScreenshot,
      propertiesFn: (capabilities, propertiesFunction) => {
        var properties = propertiesFunction(capabilities);
        delete properties.os;
        return properties;
      }
    };
    var result = vrRun.takeScreenshot('ES|CR|UTO|DUM|OP - Left Grid ', testOptions)
      .then(s => s.getResult())

    expect(result).toBe(true);
  });
});