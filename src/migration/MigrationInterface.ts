import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * Migrations should implement this interface and all its methods.
 */
export interface MigrationInterface {
    /**
     * Optional migration name, defaults to class name.
     */
    name?: string;

    /**
     * HEX: If true, run this migration inside of a transaction.
     * 
     * @default true
     */
    transaction?: boolean;

    /**
     * Run the migrations.
     */
    up(queryRunner: QueryRunner): Promise<any>;

    /**
     * Reverse the migrations.
     */
    down(queryRunner: QueryRunner): Promise<any>;

}
