/* eslint-disable import/first */
process.env.NODE_ENV = 'test';

const chai = require("chai");
const { jestSnapshotPlugin } = require("mocha-chai-jest-snapshot");

chai.use(jestSnapshotPlugin());
