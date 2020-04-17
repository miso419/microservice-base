const { expect } = require('chai');
const request = require('superagent');
const { Router } = require('express');
const Server = require('../../src/server');

describe('server integration tests', () => {

    let server;
    let router = Router();
    let baseUrl = 'http://localhost:3333';
    let name = 'TEST_SERVICE';
    let version = '2.1.0';
    let localPort = 3333;
    let logConfig = { level: 'info', logGroupName: 'local', logStreamName: 'test-service' };
    let response = {foo: 'bar'};
    let testPath = '/test';
    let testErrorPath = '/error';

    before(() => {
        router.get(testPath, (req, res) => {
            res.json(response);
        });

        router.get(testErrorPath, (req, res) => {
            res.status('500')
                .send('something bad');
        });

        server = new Server({
            name,
            version,
            localPort,
            logConfig,
            routes: router
        });

        server.start();
    });

    after(() => {
        if (server) server.stop();
    });

    it('invalid page should return 404', (done) => {
        request.get(baseUrl + '/notfound')
            .end((err, res) => {
                expect(res.statusCode).to.equal(404);
                done();
            });
    });

    it('custom route should return 200', (done) => {
        request.get(baseUrl + testPath)
            .end((err, res) => {
                expect(res.body).to.deep.equal(response);
                done();
            });
    });

    it('GET home page returns service name', (done) => {
        request.get(baseUrl + '/')
            .end((err, res) => {
                expect(res.text).to.equal(`${name} Ver. ${version}`);
                done();
            });
    });

    it('error should return 500', (done) => {
        request.get(baseUrl + testErrorPath)
            .end((err, res) => {
                expect(res.statusCode).to.equal(500);
                done();
            });
    });
});