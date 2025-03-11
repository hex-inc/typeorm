import { MigrationInterface } from "./MigrationInterface";
/**
 * Represents entity of the migration in the database.
 */
export declare class Migration {
    /**
     * Migration id.
     * Indicates order of the executed migrations.
     */
    id: number | undefined;
    /**
     * Timestamp of the migration.
     */
    timestamp: number;
    /**
     * Name of the migration (class name).
     */
    name: string;
    /**
     * HEX: If true, run this migration inside of a transaction.
     *
     * @default true
     */
    transaction?: boolean;
    /**
     * Migration instance that needs to be run.
     */
    instance?: MigrationInterface;
    constructor(id: number | undefined, timestamp: number, name: string, instance?: MigrationInterface);
}
