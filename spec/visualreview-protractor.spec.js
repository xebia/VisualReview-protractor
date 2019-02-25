
const vrProtractor = require('../visualreview-protractor');

describe("Test vr-client", function() {

    it("CatchErrors = true should log to console", function(done) {

        console.log = jasmine.createSpy('log');

        options = {};
        options.hostname = 'localhost';
        options.port = 7000;
        options.scheme = 'http';
        options.strictSSL = true;
        options.catchErrors = true;
        options.disabled = false;

        vrp = new vrProtractor(options);

        //will throw error
        vrp.initRun('TestProject', 'TestSuite', 'TestBranch').then(
            () => {
                expect(console.log).toHaveBeenCalledWith('VisualReview-protractor: an error occurred while creating a new run on the VisualReview server: Error: connect ECONNREFUSED 127.0.0.1:7000');
                done();
            }
        );


    });

    it("CatchErrors = false should throw error", function(done) {

        console.log = jasmine.createSpy('log');

        options = {};
        options.hostname = 'localhost';
        options.port = 7000;
        options.scheme = 'http';
        options.strictSSL = true;
        options.catchErrors = false;
        options.disabled = false;

        vrp = new vrProtractor(options);

        //will throw error
        vrp.initRun('TestProject', 'TestSuite', 'TestBranch').then(
            () => {
                expect(console.log).not.toHaveBeenCalled();
                done();
            }
        ).catch((error)=> {
            expect(console.log).not.toHaveBeenCalled();
            expect(error).toEqual(new Error('VisualReview-protractor: an error occurred while creating a new run on the VisualReview server: Error: connect ECONNREFUSED 127.0.0.1:7000'));
            done();
        });
    });

});
