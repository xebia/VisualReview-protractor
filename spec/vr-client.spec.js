
const VrClient = require('../lib/vr-client');
const nock = require('nock');

describe("Test vr-client", function() {

    it("Client with all parameters should be created", function() {

        hostname = 'localhost';
        port = 7000;
        scheme = 'http';
        strictSSL = true;
        catchErrors = false;

        vr = new VrClient(hostname, port, scheme, strictSSL, catchErrors);

        expect(vr).toBeDefined();

    });


    it("Client with required parameters should be created", function() {

        hostname = 'localhost';
        port = 7000;

        vr = new VrClient(hostname, port);

        expect(vr).toBeDefined();

    });

    it("Scheme http should call http api endpoint", function() {

        requestMockHttp = nock('http://localhost:7000')
            .post('/api/runs')
            .reply(200, {
                id: 1,
                projectId: 1,
                suiteId: 1,
                branchName: 'Test'
            });


        hostname = 'localhost';
        port = 7000;
        scheme = 'http';
        strictSSL = false;
        catchErrors = false;

        vr = new VrClient(hostname, port, scheme, strictSSL, catchErrors);

        vr.createRun('TestProject', 'TestSuite', 'TestBranch');

        requestMockHttp.isDone();


    });

    it("Scheme https should call https api endpoint", function() {

        requestMockHttps = nock('https://localhost:443')
            .post('/api/runs')
            .reply(200, {
                id: 1,
                projectId: 1,
                suiteId: 1,
                branchName: 'Test'
            });


        hostname = 'localhost';
        port = 443;
        scheme = 'https';
        strictSSL = false;
        catchErrors = false;

        vr = new VrClient(hostname, port, scheme, strictSSL, catchErrors);

        vr.createRun('TestProject', 'TestSuite', 'TestBranch');

        requestMockHttps.isDone();

    });

});
