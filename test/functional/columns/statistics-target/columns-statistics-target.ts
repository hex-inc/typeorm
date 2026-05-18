import {expect} from "chai";
import "reflect-metadata";
import {Connection} from "../../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Test} from "./entity/Test";

describe("columns > statistics target", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Test],
        // postgres-only feature; other drivers ignore the option.
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should round-trip statistics target through createTable and loadTables", () => Promise.all(connections.map(async connection => {
        const table = (await connection.createQueryRunner().getTable("test"))!;

        expect(table.findColumnByName("a")!.statisticsTarget).to.be.equal(undefined);
        expect(table.findColumnByName("b")!.statisticsTarget).to.be.equal(1000);
        expect(table.findColumnByName("c")!.statisticsTarget).to.be.equal(5000);
    })));

    it("should emit ALTER ... SET STATISTICS when target changes on changeColumn", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const table = (await queryRunner.getTable("test"))!;
        const oldColumn = table.findColumnByName("b")!;
        const newColumn = oldColumn.clone();
        newColumn.statisticsTarget = 2500;

        queryRunner.enableSqlMemory();
        await queryRunner.changeColumn(table, oldColumn, newColumn);
        const memory = queryRunner.getMemorySql();
        queryRunner.disableSqlMemory();

        const ups = memory.upQueries.map(q => q.query);
        const downs = memory.downQueries.map(q => q.query);

        expect(ups.some(sql => /ALTER TABLE .*"test".* ALTER COLUMN "b" SET STATISTICS 2500/.test(sql))).to.be.true;
        expect(downs.some(sql => /ALTER TABLE .*"test".* ALTER COLUMN "b" SET STATISTICS 1000/.test(sql))).to.be.true;

        await queryRunner.release();
    })));

    it("should emit SET STATISTICS -1 when clearing the target", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const table = (await queryRunner.getTable("test"))!;
        const oldColumn = table.findColumnByName("c")!;
        const newColumn = oldColumn.clone();
        newColumn.statisticsTarget = undefined;

        queryRunner.enableSqlMemory();
        await queryRunner.changeColumn(table, oldColumn, newColumn);
        const memory = queryRunner.getMemorySql();
        queryRunner.disableSqlMemory();

        const ups = memory.upQueries.map(q => q.query);
        const downs = memory.downQueries.map(q => q.query);

        expect(ups.some(sql => /ALTER TABLE .*"test".* ALTER COLUMN "c" SET STATISTICS -1/.test(sql))).to.be.true;
        expect(downs.some(sql => /ALTER TABLE .*"test".* ALTER COLUMN "c" SET STATISTICS 5000/.test(sql))).to.be.true;

        await queryRunner.release();
    })));

    it("should emit SET STATISTICS on addColumn when the new column has a target", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const table = (await queryRunner.getTable("test"))!;
        const newColumn = table.findColumnByName("b")!.clone();
        newColumn.name = "d";
        newColumn.statisticsTarget = 750;

        queryRunner.enableSqlMemory();
        await queryRunner.addColumn(table, newColumn);
        const memory = queryRunner.getMemorySql();
        queryRunner.disableSqlMemory();

        const ups = memory.upQueries.map(q => q.query);

        expect(ups.some(sql => /ALTER TABLE .*"test".* ADD "d" /.test(sql))).to.be.true;
        expect(ups.some(sql => /ALTER TABLE .*"test".* ALTER COLUMN "d" SET STATISTICS 750/.test(sql))).to.be.true;

        await queryRunner.release();
    })));

});
