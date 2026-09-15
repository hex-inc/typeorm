import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";

describe("postgres query runner > multiline check constraint", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load a multiline check expression and restore a dropped constraint", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        try {
            await queryRunner.query(`CREATE TABLE multiline_check (
                value integer,
                CONSTRAINT positive_value CHECK (CASE WHEN value > 0 THEN 1 ELSE 0 END = 1)
            )`);
            const table = await queryRunner.getTable("multiline_check");
            expect(table!.checks).to.have.lengthOf(1);
            expect(table!.checks[0].expression).to.contain("\n");
            expect(table!.checks[0].expression).not.to.match(/^\s*CHECK\b/i);

            queryRunner.clearSqlMemory();
            await queryRunner.dropCheckConstraint(table!, table!.checks[0]);
            expect((await queryRunner.getTable("multiline_check"))!.checks).to.have.lengthOf(0);
            await queryRunner.executeMemoryDownSql();
            expect((await queryRunner.getTable("multiline_check"))!.checks).to.have.lengthOf(1);

            await queryRunner.query("INSERT INTO multiline_check VALUES (1)");
            await expect(queryRunner.query("INSERT INTO multiline_check VALUES (-1)"))
                .to.be.rejectedWith('violates check constraint "positive_value"');
        } finally {
            await queryRunner.release();
        }
    })));

});
