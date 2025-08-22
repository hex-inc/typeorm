import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {PostgresQueryRunner} from "../../../src/driver/postgres/PostgresQueryRunner";
import * as sinon from "sinon";
describe("postgres query runner > connection releasing safety", () => {
    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));
    it("should properly clean up connectedQueryRunners on release", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const driver = connection.driver as any;
        
        // Wait for connection to be established
        await queryRunner.connect();
        
        // Verify the query runner is tracked
        expect(driver.connectedQueryRunners.indexOf(queryRunner)).to.not.equal(-1);
        
        // Release the query runner
        await queryRunner.release();
        
        // Verify it's removed from tracking
        expect(driver.connectedQueryRunners.indexOf(queryRunner)).to.equal(-1);
        expect(queryRunner.isReleased).to.be.true;
    })));
    it("should handle race condition between connection establishment and release", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const driver = connection.driver as any;
        
        // Start connection process but don't wait
        const connectPromise = queryRunner.connect();
        
        // Immediately release - this simulates a race condition
        const releasePromise = queryRunner.release();
        
        // Wait for both to complete
        await Promise.all([connectPromise, releasePromise]);
        
        // Verify final state is clean
        expect(queryRunner.isReleased).to.be.true;
        expect(driver.connectedQueryRunners.indexOf(queryRunner)).to.equal(-1);
    })));
    it("should call release callback on connection when query runner is released early", () => Promise.all(connections.map(async connection => {
        const queryRunner = new PostgresQueryRunner(connection.driver as any, "master");
        const releaseCallbackSpy = sinon.spy();
        
        // Mock the connection promise to simulate delayed connection
        let resolveConnection: any;
        const connectionPromise = new Promise((resolve) => {
            resolveConnection = resolve;
        });
        
        // Override the connection promise
        (queryRunner as any).databaseConnectionPromise = connectionPromise.then(([mockConnection, release]) => {
            if (queryRunner.isReleased) {
                release();
                return undefined;
            }
            return mockConnection;
        });
        
        // Release the query runner before connection resolves
        await queryRunner.release();
        
        // Now resolve the connection with a mock connection and release callback
        const mockConnection = { on: sinon.spy(), removeListener: sinon.spy() };
        resolveConnection([mockConnection, releaseCallbackSpy]);
        
        // Wait for the promise to resolve
        await connectionPromise;
        
        // The release callback should have been called
        expect(releaseCallbackSpy.calledOnce).to.be.true;
    })));
});
