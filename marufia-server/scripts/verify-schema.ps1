#Requires -Version 7.4

[CmdletBinding()]
param(
    [switch]$RequireEmptyData
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Assert-ExactLines {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][string[]]$Expected,
        [AllowEmptyString()][string]$Actual
    )

    $actualLines = if ([string]::IsNullOrWhiteSpace($Actual)) { @() } else { @($Actual -split "`r?`n") }
    $expectedLines = @($Expected | Sort-Object)
    $actualLines = @($actualLines | Sort-Object)
    if (($expectedLines -join "`n") -ne ($actualLines -join "`n")) {
        throw "$Label diverge do contrato esperado."
    }
}

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady

    $tables = @("campaign_events", "campaign_members", "campaign_presence", "campaign_sessions", "campaigns", "characters", "profiles", "rolls")
    $tableSql = "select tablename from pg_catalog.pg_tables where schemaname = 'public' order by tablename;"
    Assert-ExactLines -Label "Tabelas públicas" -Expected $tables -Actual (Invoke-MarufiaDatabaseSql -TuplesOnly -Sql $tableSql)

    $rlsSql = "select c.relname from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity order by c.relname;"
    Assert-ExactLines -Label "Tabelas com RLS" -Expected $tables -Actual (Invoke-MarufiaDatabaseSql -TuplesOnly -Sql $rlsSql)

    $policies = @(
        "campaign_events.campaign_events_select_campaign_gm:SELECT",
        "campaign_members.campaign_members_select_by_campaign_role:SELECT",
        "campaign_presence.campaign_presence_select_campaign_gm:SELECT",
        "campaign_sessions.campaign_sessions_select_campaign_gm:SELECT",
        "campaigns.campaigns_insert_owned:INSERT",
        "campaigns.campaigns_select_member:SELECT",
        "characters.characters_insert_owned:INSERT",
        "characters.characters_select_campaign_gm:SELECT",
        "characters.characters_select_owned:SELECT",
        "characters.characters_update_owned:UPDATE",
        "profiles.profiles_select_own:SELECT",
        "profiles.profiles_update_own:UPDATE",
        "rolls.rolls_select_by_campaign_visibility:SELECT"
    )
    $policySql = "select tablename || '.' || policyname || ':' || upper(cmd) from pg_catalog.pg_policies where schemaname='public' order by 1;"
    Assert-ExactLines -Label "Policies RLS" -Expected $policies -Actual (Invoke-MarufiaDatabaseSql -TuplesOnly -Sql $policySql)

    $realtimeTables = @("campaign_events", "campaign_presence", "campaign_sessions", "campaigns", "characters", "rolls")
    $realtimeSql = "select tablename from pg_catalog.pg_publication_tables where pubname='supabase_realtime' and schemaname='public' order by tablename;"
    Assert-ExactLines -Label "Publicação Realtime" -Expected $realtimeTables -Actual (Invoke-MarufiaDatabaseSql -TuplesOnly -Sql $realtimeSql)

    $triggers = @(
        "marufia_add_campaign_owner_after_insert",
        "marufia_campaign_event_session_before_insert",
        "marufia_character_history_after_update",
        "marufia_create_profile_after_signup",
        "marufia_prepare_campaign_before_insert",
        "marufia_prepare_character_before_write",
        "marufia_roll_history_after_insert",
        "marufia_version_character_before_write",
        "campaigns_set_updated_at",
        "characters_set_updated_at",
        "profiles_set_updated_at"
    )
    $triggerSql = "select t.tgname from pg_catalog.pg_trigger t where not t.tgisinternal and (t.tgname like 'marufia_%' or t.tgname in ('campaigns_set_updated_at','characters_set_updated_at','profiles_set_updated_at')) order by 1;"
    Assert-ExactLines -Label "Gatilhos" -Expected $triggers -Actual (Invoke-MarufiaDatabaseSql -TuplesOnly -Sql $triggerSql)

    $rpcSignatures = @(
        "public.join_campaign(text)",
        "public.save_character_state(uuid,jsonb,bigint)",
        "public.record_roll(uuid,uuid,text,text,text,text,jsonb,integer,integer,integer,text,text)",
        "public.touch_campaign_presence(uuid,boolean)",
        "public.gm_set_character_hp(uuid,integer,bigint)",
        "public.gm_set_character_pm(uuid,integer,bigint)",
        "public.gm_add_character_condition(uuid,text,integer,integer,bigint)",
        "public.gm_remove_character_condition(uuid,text,bigint)",
        "public.gm_add_character_item(uuid,text,text,text,integer,text,text,text,text,bigint)",
        "public.gm_remove_character_item(uuid,text,text,bigint)",
        "public.start_campaign_session(uuid,text)",
        "public.end_campaign_session(uuid)",
        "public.update_campaign(uuid,text,text)",
        "public.delete_campaign(uuid,text)",
        "public.clear_campaign_roll_history(uuid)"
    )
    foreach ($signature in $rpcSignatures) {
        $safeSignature = $signature.Replace("'", "''")
        $exists = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql "select case when to_regprocedure('$safeSignature') is null then '0' else '1' end;"
        if ($exists -ne "1") { throw "RPC ausente: $signature" }
    }

    $serverRoot = Split-Path -Parent $PSScriptRoot
    $manifestPath = Join-Path $serverRoot "schema\MIGRATIONS.sha256"
    $expectedVersions = @([System.IO.File]::ReadAllLines($manifestPath) | ForEach-Object { ($_ -split "  ")[1].Substring(0, 14) })
    $historySql = "select version from supabase_migrations.schema_migrations order by version;"
    Assert-ExactLines -Label "Histórico de migrations" -Expected $expectedVersions -Actual (Invoke-MarufiaDatabaseSql -TuplesOnly -Sql $historySql)

    $anonymousGrants = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql @"
select grantee || ':' || table_name || ':' || privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'PUBLIC')
order by 1;
"@
    if (-not [string]::IsNullOrWhiteSpace($anonymousGrants)) {
        throw "Foram encontrados privilégios de tabela para anon ou PUBLIC."
    }

    if ($RequireEmptyData) {
        $nonEmpty = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql @"
select source from (
  select 'auth.users' as source, count(*) as rows from auth.users
  union all select 'profiles', count(*) from public.profiles
  union all select 'campaigns', count(*) from public.campaigns
  union all select 'campaign_members', count(*) from public.campaign_members
  union all select 'characters', count(*) from public.characters
  union all select 'rolls', count(*) from public.rolls
  union all select 'campaign_events', count(*) from public.campaign_events
  union all select 'campaign_presence', count(*) from public.campaign_presence
  union all select 'campaign_sessions', count(*) from public.campaign_sessions
) counts where rows <> 0 order by source;
"@
        if (-not [string]::IsNullOrWhiteSpace($nonEmpty)) {
            throw "A fase de schema encontrou dados inesperados no banco experimental."
        }
    }

    Write-MarufiaMessage -Level INFO -Message "Schema aprovado: 8 tabelas, 13 policies, 15 RPCs, 11 gatilhos e 6 publicações Realtime."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
