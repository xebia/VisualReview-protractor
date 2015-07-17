var vr = browser.params.visualreview;

describe('angularjs homepage', function() {

  beforeAll(function () {
    browser.manage().window().setSize(800, 1100);
  });

  it('should open the homepage', function() {
    browser.get('https://docs.angularjs.org');
    vr.takeScreenshot('AngularJS-homepage');
  });

  it('should to go the docs', function () {
    element(by.css('[href="api/ng/function/angular.injector"]')).click()
    vr.takeScreenshot('Injector');
  });

  it('should edit the source', function () {
    element(by.css('[href="guide/di"]')).click()
    vr.takeScreenshot('Guide');
  });
});
