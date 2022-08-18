import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";
import * as random from "@pulumi/random";

const config = new pulumi.Config("example");
const zone = config.require("zone");

const postgresUserPassword = new random.RandomPassword("postgres", {
    // NB must be between 8-128.
    length: 16,
    minLower: 1,
    minUpper: 1,
    minNumeric: 1,
    minSpecial: 1,
});

const example = new azure.core.ResourceGroup("example");

const postgres = new azure.postgresql.FlexibleServer("postgres", {
    resourceGroupName: example.name,
    location: example.location,
    zone: zone,
    version: "14",
    administratorLogin: "postgres",
    administratorPassword: postgresUserPassword.result,
    backupRetentionDays: 7,
    // Development (aka Burstable) sku.
    // 1 vCores, 2 GiB RAM, 32 GiB storage.
    // see https://docs.microsoft.com/en-us/azure/templates/microsoft.dbforpostgresql/2021-06-01/flexibleservers#sku
    skuName: "B_Standard_B1ms",
    storageMb: 32*1024,
});

// TODO how to directly get the fqdn like in terraform?
export const fqdn = postgres.name.apply(v => `${v}.postgres.database.azure.com`);
export const password = postgresUserPassword.result;
