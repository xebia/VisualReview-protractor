var vr = browser.params.visualreview;

describe('angularjs homepage', function() {

  it('should resize', function () {
    browser.manage().window().setSize(800, 1100);
  });

  it('should open the homepage', function() {
    browser.get('https://docs.angularjs.org');
    vr.takeScreenshot('AngularJS-homepage');
  });

  it('should to go the docs', function () {
    expect(element(by.css('[href="api/ng/function/angular.injector"]')).click()).toBeNull();
    vr.takeScreenshot('Injector');
  });

  it('should edit the source', function () {
    expect(element(by.css('[href="guide/di"]')).click()).toBeNull();
    vr.takeScreenshot('Source');
  });
});
