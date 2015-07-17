# VisualReview-protractor example project

Example on how to use the test visual regression using the VisualReview protractor API.
This demo opens a few pages and takes a few screenshots so changes to these pages can be evaluated over time.

## Try it out

First install the dependencies:

```shell
npm install
```

Start the [VisualReview server](https://github.com/xebia/VisualReview/releases).
Download the latest release, extract it and run `./start.sh`.

Next start the [Selenium server](http://www.seleniumhq.org/download/).
Download the standalone jar and run `java -jar java -jar selenium-server-standalone-*.jar`

### Run

Now send the screenshots for the end to end test by running:

```shell
node_modules/.bin/protractor protractor.js
```

Finally, to see the screenshots, open the VisualReview web app ([http://localhost:7000](http://localhost:7000)).
Navigate to `myProject` -> `mySuite` and open the latest run.

Try changing the `spec.js` test a bit and run the test again to view and evaluate changes between runs.
