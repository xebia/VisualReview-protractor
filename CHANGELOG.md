# Changelog

## 0.3.0

### Features and improvements
* Added support for branchnames, slated for a future VisualReview server release. Thanks [@mikewoudenberg](https://github.com/mikewoudenberg) !
* Added support for compare precision, slated for a future VisualReview server release. Thanks [@FinKingma](https://github.com/finkingma) !

### Bugfixes
* Changed retrieval of browser capabilities to use supported Selenium API, fixing compatibility with more recent Selenium/Protractor versions. Thanks [@mcherryleigh](https://github.com/mcherryleigh) !

## 0.2.0

### Features and improvements
* Added new `disabled` configuration parameter which prevents `visualreview-protractor` to send data to the VisualReview server. 
 This is useful when writing and test-running test-scripts.
 
### Bugfixes
* Added Protractor peer-dependency. This should remove any dependency-related warnings logged by `npm`
