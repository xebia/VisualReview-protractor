
const VrClient = require('../lib/vr-client');


describe("Test vr-client", function() {

        it("Client with all parameters should be created", function() {

            let hostname = 'localhost';
            port = 7000;
            scheme = 'http';
            strictSSL = true;
            catchErrors = false;

            let vr = new VrClient(hostname, port, scheme, strictSSL, catchErrors);

            expect(vr).toBeDefined();

        });


    it("Client with required parameters should be created", function() {

        let hostname = 'localhost';
        port = 7000;

        let vr = new VrClient(hostname, port);

        expect(vr).toBeDefined();

    });

    xit("strictSSL = false param should set disable certificate check in http-request-options", function() {

        let hostname = 'localhost';
        port = 7000;
        scheme = 'http';
        strictSSL = false;
        catchErrors = false;

        let vr = new VrClient(hostname, port, scheme, strictSSL, catchErrors);

        vr.createRun('TestProject', 'TestSuite', 'TestBranch');

        expect(requestOptions.method).toContain('PAUL');

        //TODO
        // https://lazamar.github.io/testing-http-requests-with-jasmine/

    });

});
