import {ConnectionOptionsReader} from "../connection/ConnectionOptionsReader";
import {CommandUtils} from "./CommandUtils";
import {createConnection} from "../index";
import {Query} from "../driver/Query";
import {SqlInMemory} from "../driver/SqlInMemory";
import {camelCase} from "../util/StringUtils";
import * as yargs from "yargs";
import chalk from "chalk";

/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
export class MigrationGenerateCommand implements yargs.CommandModule {

    command = "migration:generate";
    describe = "Generates a new migration file with sql needs to be executed to update schema.";
    aliases = "migrations:generate";

    builder(args: yargs.Argv) {
        return args
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("n", {
                alias: "name",
                describe: "Name of the migration class.",
                demand: true,
                type: "string"
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where migration should be created."
            })
            .option("f", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(args: yargs.Arguments) {
        if (args._[0] === "migrations:generate") {
            console.log("'migrations:generate' is deprecated, please use 'migration:generate' instead");
        }

        const timestamp = new Date().getTime();
        const filename = timestamp + "-" + args.name + ".ts";
        let directory = args.dir;

        // if directory is not set then try to open tsconfig and find default path there
        if (!directory) {
            try {
                const connectionOptionsReader = new ConnectionOptionsReader({
                    root: process.cwd(),
                    configName: args.config as any
                });
                const connectionOptions = await connectionOptionsReader.get(args.connection as any);
                directory = connectionOptions.cli ? connectionOptions.cli.migrationsDir : undefined;
            } catch (err) { }
        }

        try {
            const connectionOptionsReader = new ConnectionOptionsReader({
                root: process.cwd(),
                configName: args.config as any
            });
            const connectionOptions = await connectionOptionsReader.get(args.connection as any);
            Object.assign(connectionOptions, {
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false
            });

            const connection = await createConnection(connectionOptions);
            let sqlInMemory: SqlInMemory;
            try {
                sqlInMemory = await connection.driver.createSchemaBuilder().log();
            } finally {
                await connection.close();
            }

            if (sqlInMemory.upQueries.length) {
                if (args.name) {
                    const migrationName = camelCase(args.name as any, true) + timestamp;
                    const templater = connection.options.migrationTemplater || defaultMigrationTemplater;
                    const fileContent = await templater({
                        name: migrationName,
                        upQueries: sqlInMemory.upQueries,
                        downQueries: sqlInMemory.downQueries,
                    });
                    const path = process.cwd() + "/" + (directory ? (directory + "/") : "") + filename;
                    await CommandUtils.createFile(path, fileContent);

                    console.log(chalk.green(`Migration ${chalk.blue(path)} has been generated successfully.`));
                } else {
                    console.log(chalk.yellow("Please specify a migration name using the `-n` argument"));
                }
            } else {
                console.log(chalk.yellow(`No changes in database schema were found - cannot generate a migration. To create a new empty migration use "typeorm migration:create" command`));
                process.exit(1);
            }
        } catch (err) {
            console.log(chalk.black.bgRed("Error during migration generation:"));
            console.error(err);
            process.exit(1);
        }
    }
}

export interface MigrationTemplateArgs {
    name: string;
    upQueries: Query[];
    downQueries: Query[];
}
export type MigrationTemplater = (args: MigrationTemplateArgs) => string;
export async function defaultMigrationTemplater({ name, upQueries, downQueries }: MigrationTemplateArgs): Promise<string> {
    const templateQuery = ({ query, parameters }: Query): string => 
        "        await queryRunner.query(`" + query.replace(new RegExp("`", "g"), "\\`") + "`" + (parameters && parameters.length ? `, ${JSON.stringify(parameters)}` : "") + ");";
    return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${name} implements MigrationInterface {
    name = '${name}'

    public async up(queryRunner: QueryRunner): Promise<void> {
${upQueries.map(templateQuery).join("\n")}
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
${downQueries.map(templateQuery).join("\n")}
    }
}
`;
}