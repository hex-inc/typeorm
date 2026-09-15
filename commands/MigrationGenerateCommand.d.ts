import { Query } from "../driver/Query";
import * as yargs from "yargs";
/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
export declare class MigrationGenerateCommand implements yargs.CommandModule {
    command: string;
    describe: string;
    aliases: string;
    builder(args: yargs.Argv): yargs.Argv<{
        c: string;
    } & {
        n: string;
    } & {
        d: unknown;
    } & {
        f: string;
    }>;
    handler(args: yargs.Arguments): Promise<void>;
}
export interface MigrationTemplateArgs {
    name: string;
    upQueries: Query[];
    downQueries: Query[];
}
export declare type MigrationTemplater = (args: MigrationTemplateArgs) => string;
export declare function defaultMigrationTemplater({ name, upQueries, downQueries }: MigrationTemplateArgs): Promise<string>;
