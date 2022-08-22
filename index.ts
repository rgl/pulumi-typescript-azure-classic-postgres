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
    // NB sku_name is <TIER>_<NAME>, e.g. B_Standard_B1ms, GP_Standard_D2s_v3, MO_Standard_E4s_v3.
    // see az postgres flexible-server list-skus --output table --location northeurope
    // see https://docs.microsoft.com/en-us/azure/templates/microsoft.dbforpostgresql/2021-06-01/flexibleservers#sku
    skuName: "B_Standard_B1ms", // 1 vCores, 2 GiB RAM.
    storageMb: 32*1024,
});

new azure.postgresql.FlexibleServerFirewallRule("all", {
    serverId: postgres.id,
    startIpAddress: "0.0.0.0",
    endIpAddress: "255.255.255.255",
});

export const fqdn = postgres.fqdn;
export const password = postgresUserPassword.result;
