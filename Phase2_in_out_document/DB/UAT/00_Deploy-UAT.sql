/*
  Run with sqlcmd, not by pasting into an SSMS query window.
  Example:
    sqlcmd -S <server> -d <database> -E -b -i DB/UAT/00_Deploy-UAT.sql

  This is the complete supported UAT schema and mock/master-data deployment.
  It deliberately excludes operational document, attachment, and audit history exports.
*/
:on error exit
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
:r $(ScriptRoot)/001_InitialCreate.sql
:r $(ScriptRoot)/002_AddNotifications.sql
:r $(ScriptRoot)/UAT/004_ReconcileMockIdentityData.sql
:r $(ScriptRoot)/UAT/05_ValidateUatIdentityData.sql
