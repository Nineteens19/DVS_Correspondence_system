# e-Document Tracking — UAT source and database handover

This repository is the source-code handover. It contains no Docker image and UAT deployment does not require Docker. The supported UAT database baseline is SQL Server plus the scripts in `DB/UAT/`.

## What was corrected

The local SQL Server audit found 17 active application users but 25 active `AD_MOCK_USER` records. The eight mock directory accounts below had no application account and therefore could not log in: `boonchai.l`, `chutima.k`, `ekkachai.p`, `jintana.t`, `kittisak.n`, `porntip.s`, `thanaporn.r`, and `worawan.d`.

`prapat.k` also had conflicting departments: application identity `dept-admin` versus mock AD `dept-fin`. The reconciliation makes this mock identity an executive viewer in `dept-admin`. All department heads now reference active application users with matching mock AD identities.

`DB/UAT/004_ReconcileMockIdentityData.sql` now provides a repeatable baseline of 25 active application users and 25 matching mock AD users, together with the supported roles, departments and delivery methods. The application startup reconciliation in `src/Correspondence.Infrastructure/Data/DbInitializer.cs` fixes pre-existing databases that were seeded before the extra mock accounts were added.

## Scope of database data

The package includes all application schema, master data, roles, permissions seeded by the existing schema script, and the complete supported mock UAT identity data. It intentionally **does not export current operational documents, attachments, audit logs, OTP transactions, or notification history**. Those records may contain business data and file paths; approve the exact document/date range and redaction policy before creating a transactional data export for UAT.

## Prerequisites

- SQL Server 2019 or later, with `sqlcmd` available to the deployment operator.
- .NET 8 SDK to build/publish the API.
- Node.js 22 (or the project-compatible Node runtime) and npm to build the React client.
- A writable application storage path for uploaded files.

## Database deployment

1. Back up the target database before an in-place deployment. For a clean UAT baseline, create a new empty database:

   ```zsh
   sqlcmd -S <sql-server> -E -Q "CREATE DATABASE [DevesCorrespondenceUat]"
   ```

2. From the repository root, run the complete deployment using `sqlcmd`; do not execute `00_Deploy-UAT.sql` by pasting it into a query editor because it uses `:r` file includes.

   ```zsh
   sqlcmd -S <sql-server> -d DevesCorrespondenceUat -E -b -v ScriptRoot="DB" -i DB/UAT/00_Deploy-UAT.sql
   ```

   For SQL authentication, replace `-E` with `-U <user> -P '<password>'`. The `-b` flag makes the command fail on a SQL error. The master script runs, in order: `DB/001_InitialCreate.sql`, `DB/002_AddNotifications.sql`, `DB/UAT/004_ReconcileMockIdentityData.sql`, and `DB/UAT/05_ValidateUatIdentityData.sql`. Do not run `DB/003_BootstrapAdminUser.sql` for this baseline; its function is superseded by the complete reconciliation seed.

3. A successful run prints 7 active roles, 9 active departments, 25 active application users, 25 active mock AD users, and `UAT mock AD/application identity validation passed.`

## Build and deploy the source

1. Build the SPA, which emits static files into `src/Correspondence.Api/wwwroot`:

   ```zsh
   npm ci --prefix src/Correspondence.Client
   npm run build --prefix src/Correspondence.Client
   ```

2. Copy `src/Correspondence.Api/appsettings.UAT.example.json` to `src/Correspondence.Api/appsettings.UAT.json`; replace all placeholders with the UAT SQL Server connection string and a unique JWT secret. Do not commit the real file or secret. Keep `Database:AutoMigrateAndSeed` set to `false` because the SQL package already creates and seeds the schema.

3. Publish the API from source:

   ```zsh
   dotnet publish src/Correspondence.Api/Correspondence.Api.csproj --configuration Release --output ./publish
   ```

4. Place the contents of `publish/` on the UAT application host. Create a writable directory for `App_Data/uploads` (or set `Storage__BasePath` to the UAT upload location). Set at least:

   ```zsh
   export ASPNETCORE_ENVIRONMENT=UAT
   export Database__Provider=SqlServer
   export Database__AutoMigrateAndSeed=false
   export Ldap__UseMock=true
   export Storage__BasePath=/var/lib/e-document-tracking/uploads
   ```

   Start the application according to the host standard, for example `dotnet Correspondence.Api.dll`. Verify `https://<uat-host>/health` returns HTTP 200 and open `https://<uat-host>/swagger` for API verification.

## Mock UAT authentication

`Ldap__UseMock=true` is required for this package. The implementation authenticates an account only when both `[USER]` and `[AD_MOCK_USER]` have the same active username. Every one of the 25 seeded accounts is now eligible. The mock implementation accepts **any non-empty password**; it does not perform a real LDAP/Active Directory bind.

This behaviour is suitable only for isolated mock UAT. Before connecting UAT to a real directory, supply the LDAP protocol (LDAPS/LDAP), endpoint, bind/service account policy, search base, group/role mapping, certificate requirements, and account provisioning policy. Do not represent the current non-mock branch as real AD authentication.

## Rollback and support

- Re-run `DB/UAT/004_ReconcileMockIdentityData.sql` to restore the supported mock identity/master baseline.
- Restore the pre-deployment SQL Server backup to revert transactional and master data changes.
- The source reconciliation preserves transactional documents and assignments; it only corrects mock identity/master records.
- `DB/UAT/05_ValidateUatIdentityData.sql` can be rerun at any time to test the login mapping invariant.
