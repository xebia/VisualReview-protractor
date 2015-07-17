# VisualReview-protractor example project

Example on how to use the test visual regression using the VisualReview protractor API.
This demo opens a few pages and takes a few screenshots so changes to these pages can be evaluated over time.

### Prerequisites
* Install [NodeJS](http://nodejs.org/)
* Install a [Java JRE](http://java.com/nl) (or [JDK](http://www.oracle.com/technetwork/java/javase/downloads/index.html))

## Try it

First install the dependencies:

```shell
npm install
```

Install selenium server used by protractor:

```shell
node node_modules/protractor/bin/webdriver-manager update
```

Start the [VisualReview server](https://github.com/xebia/VisualReview) by downloading the [latest release](https://github.com/xebia/VisualReview/releases), extracting it and run `./start.sh`.

### Run

Now send the screenshots for the end to end test by running:

```shell
node_modules/.bin/protractor protractor.js
```

To see the screenshots, open the VisualReview web app ([http://localhost:7000](http://localhost:7000)).
Navigate to `myProject` -> `mySuite` and open the latest run.

Try changing the `spec.js` test a bit and run the test again to view and evaluate changes between runs.
