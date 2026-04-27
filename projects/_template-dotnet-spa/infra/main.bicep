// Azure Bicep — App Service + SQL Database
// Deploy: az deployment group create -g <rg> -f main.bicep -p @main.parameters.json

@description('Environment: dev | staging | prod')
param environment string = 'dev'

@description('Azure region')
param location string = resourceGroup().location

@description('Base name — all resources will be prefixed with this')
param appName string = 'myapp'

var planName = '${appName}-plan-${environment}'
var siteName = '${appName}-web-${environment}'
var sqlServerName = '${appName}-sql-${environment}'
var dbName = '${appName}-db-${environment}'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: planName
  location: location
  sku: {
    name: environment == 'prod' ? 'S1' : 'B1'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: siteName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|9.0'
      appSettings: [
        {
          name: 'ASPNETCORE_ENVIRONMENT'
          value: environment == 'prod' ? 'Production' : 'Staging'
        }
      ]
      connectionStrings: [
        {
          name: 'Default'
          // Injected at deploy time via Key Vault reference or pipeline variable
          connectionString: '@Microsoft.KeyVault(SecretUri=https://${appName}-kv-${environment}.vault.azure.net/secrets/DbConnectionString/)'
          type: 'SQLAzure'
        }
      ]
    }
    httpsOnly: true
  }
}

// SQL Server
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: 'sqladmin'
    // Admin password injected via pipeline — NEVER hardcode here
    administratorLoginPassword: ''
    minimalTlsVersion: '1.2'
  }
}

// SQL Database
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: dbName
  location: location
  sku: {
    name: environment == 'prod' ? 'S2' : 'Basic'
  }
}

output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
