"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ConnectionOptionsReader_1 = require("../connection/ConnectionOptionsReader");
var CommandUtils_1 = require("./CommandUtils");
var index_1 = require("../index");
var StringUtils_1 = require("../util/StringUtils");
var chalk_1 = tslib_1.__importDefault(require("chalk"));
/**
 * Generates a new migration file with sql needs to be executed to update schema.
 */
var MigrationGenerateCommand = /** @class */ (function () {
    function MigrationGenerateCommand() {
        this.command = "migration:generate";
        this.describe = "Generates a new migration file with sql needs to be executed to update schema.";
        this.aliases = "migrations:generate";
    }
    MigrationGenerateCommand.prototype.builder = function (args) {
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
    };
    MigrationGenerateCommand.prototype.handler = function (args) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var timestamp, filename, directory, connectionOptionsReader, connectionOptions, err_1, connectionOptionsReader, connectionOptions, connection, sqlInMemory, migrationName, templater, fileContent, path, err_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (args._[0] === "migrations:generate") {
                            console.log("'migrations:generate' is deprecated, please use 'migration:generate' instead");
                        }
                        timestamp = new Date().getTime();
                        filename = timestamp + "-" + args.name + ".ts";
                        directory = args.dir;
                        if (!!directory) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        return [4 /*yield*/, connectionOptionsReader.get(args.connection)];
                    case 2:
                        connectionOptions = _a.sent();
                        directory = connectionOptions.cli ? connectionOptions.cli.migrationsDir : undefined;
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        _a.trys.push([4, 18, , 19]);
                        connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({
                            root: process.cwd(),
                            configName: args.config
                        });
                        return [4 /*yield*/, connectionOptionsReader.get(args.connection)];
                    case 5:
                        connectionOptions = _a.sent();
                        Object.assign(connectionOptions, {
                            synchronize: false,
                            migrationsRun: false,
                            dropSchema: false,
                            logging: false
                        });
                        return [4 /*yield*/, index_1.createConnection(connectionOptions)];
                    case 6:
                        connection = _a.sent();
                        sqlInMemory = void 0;
                        _a.label = 7;
                    case 7:
                        _a.trys.push([7, , 9, 11]);
                        return [4 /*yield*/, connection.driver.createSchemaBuilder().log()];
                    case 8:
                        sqlInMemory = _a.sent();
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, connection.close()];
                    case 10:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 11:
                        if (!sqlInMemory.upQueries.length) return [3 /*break*/, 16];
                        if (!args.name) return [3 /*break*/, 14];
                        migrationName = StringUtils_1.camelCase(args.name, true) + timestamp;
                        templater = connection.options.migrationTemplater || defaultMigrationTemplater;
                        return [4 /*yield*/, templater({
                                name: migrationName,
                                upQueries: sqlInMemory.upQueries,
                                downQueries: sqlInMemory.downQueries,
                            })];
                    case 12:
                        fileContent = _a.sent();
                        path = process.cwd() + "/" + (directory ? (directory + "/") : "") + filename;
                        return [4 /*yield*/, CommandUtils_1.CommandUtils.createFile(path, fileContent)];
                    case 13:
                        _a.sent();
                        console.log(chalk_1.default.green("Migration " + chalk_1.default.blue(path) + " has been generated successfully."));
                        return [3 /*break*/, 15];
                    case 14:
                        console.log(chalk_1.default.yellow("Please specify a migration name using the `-n` argument"));
                        _a.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        console.log(chalk_1.default.yellow("No changes in database schema were found - cannot generate a migration. To create a new empty migration use \"typeorm migration:create\" command"));
                        process.exit(1);
                        _a.label = 17;
                    case 17: return [3 /*break*/, 19];
                    case 18:
                        err_2 = _a.sent();
                        console.log(chalk_1.default.black.bgRed("Error during migration generation:"));
                        console.error(err_2);
                        process.exit(1);
                        return [3 /*break*/, 19];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    return MigrationGenerateCommand;
}());
exports.MigrationGenerateCommand = MigrationGenerateCommand;
function defaultMigrationTemplater(_a) {
    var name = _a.name, upQueries = _a.upQueries, downQueries = _a.downQueries;
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var templateQuery;
        return tslib_1.__generator(this, function (_b) {
            templateQuery = function (_a) {
                var query = _a.query, parameters = _a.parameters;
                return "        await queryRunner.query(`" + query.replace(new RegExp("`", "g"), "\\`") + "`" + (parameters && parameters.length ? ", " + JSON.stringify(parameters) : "") + ");";
            };
            return [2 /*return*/, "import { MigrationInterface, QueryRunner } from \"typeorm\";\n\nexport class " + name + " implements MigrationInterface {\n    name = '" + name + "'\n\n    public async up(queryRunner: QueryRunner): Promise<void> {\n" + upQueries.map(templateQuery).join("\n") + "\n    }\n\n    public async down(queryRunner: QueryRunner): Promise<void> {\n" + downQueries.map(templateQuery).join("\n") + "\n    }\n}\n"];
        });
    });
}
exports.defaultMigrationTemplater = defaultMigrationTemplater;

//# sourceMappingURL=MigrationGenerateCommand.js.map
