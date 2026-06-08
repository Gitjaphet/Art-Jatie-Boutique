--
-- PostgreSQL database dump
--

\restrict VQujfDgK3pWMXZ8tFg349l2Yk2mx11xpSEFV8RZvQuFRZ9SnAncV80COXFDkeIX

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(c.column_name order by c.ordinal_position),
            '{}'::text[]
        )
        from
            information_schema.columns c
        where
            format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                format('%I.%I', c.table_schema, c.table_name)::regclass,
                c.column_name,
                'SELECT'
            );
    table_col_names text[] = coalesce(
            array_agg(pa.attname),
            '{}'::text[]
        )
        from
            pg_attribute pa
        where
            pa.attrelid = new.entity
            and pa.attnum > 0;
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        -- Filtered column is valid
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        -- Type is sanitized and safe for string interpolation
        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;
        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        else
            -- raises an exception if value is not coercable to type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    -- Validate that selected_columns reference columns the role can SELECT
    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint on
    -- (subscription_id, entity, filters) can't be tricked by a different filter order
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value),
        '{}'
    ) from unnest(new.filters) f;

    -- Normalize selected_columns order so ARRAY['a','b'] and ARRAY['b','a'] are
    -- treated as the same subscription group in apply_rls
    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: agentsession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agentsession (
    id integer NOT NULL,
    client_whatsapp character varying NOT NULL,
    messages_json character varying NOT NULL,
    channel character varying NOT NULL,
    total_messages integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: agentsession_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agentsession_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agentsession_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agentsession_id_seq OWNED BY public.agentsession.id;


--
-- Name: client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying,
    whatsapp character varying NOT NULL,
    total_spent integer NOT NULL,
    total_orders integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    favorite_categories character varying DEFAULT ''::character varying,
    favorite_colors character varying DEFAULT ''::character varying
);


--
-- Name: client_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_id_seq OWNED BY public.client.id;


--
-- Name: color; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.color (
    id integer NOT NULL,
    name character varying NOT NULL,
    hex_code character varying NOT NULL
);


--
-- Name: color_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.color_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: color_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.color_id_seq OWNED BY public.color.id;


--
-- Name: order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."order" (
    id integer NOT NULL,
    client_name character varying NOT NULL,
    client_email character varying NOT NULL,
    client_whatsapp character varying NOT NULL,
    client_message character varying,
    product_id integer,
    product_name character varying,
    product_image character varying,
    product_price_ar integer,
    selected_size character varying,
    selected_color character varying,
    status character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    cart_items_json text,
    delivery_zone character varying,
    delivery_cost integer DEFAULT 0,
    delivery_label character varying,
    subtotal_ar integer,
    discount_ar integer DEFAULT 0,
    total_ar integer,
    payment_method character varying DEFAULT 'whatsapp'::character varying,
    mvola_phone character varying,
    mvola_correlation_id character varying,
    mvola_transaction_ref character varying,
    mvola_status character varying,
    mvola_account_name character varying,
    om_phone character varying,
    om_account_name character varying,
    payment_proof_text character varying,
    payment_proof_image character varying,
    planning_status character varying,
    planning_note text,
    acompte integer DEFAULT 0,
    progress integer DEFAULT 0,
    client_id integer,
    is_pos boolean DEFAULT false,
    amount_tendered integer DEFAULT 0,
    change_ar integer DEFAULT 0
);


--
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_id_seq OWNED BY public."order".id;


--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id integer NOT NULL,
    name character varying NOT NULL,
    tag character varying NOT NULL,
    genre character varying NOT NULL,
    category character varying NOT NULL,
    price_ar integer NOT NULL,
    old_price_ar integer,
    image character varying NOT NULL,
    colors character varying NOT NULL,
    sizes character varying NOT NULL,
    badge character varying NOT NULL,
    is_hot boolean NOT NULL,
    on_order boolean NOT NULL,
    stock_quantity integer NOT NULL,
    created_at timestamp without time zone NOT NULL,
    images text DEFAULT ''::text,
    description text,
    slug character varying
);


--
-- Name: product_embedding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_embedding (
    id integer NOT NULL,
    product_id integer,
    contenu text,
    embedding public.vector(1024)
);


--
-- Name: product_embedding_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_embedding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_embedding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_embedding_id_seq OWNED BY public.product_embedding.id;


--
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;


--
-- Name: productcolorlink; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productcolorlink (
    product_id integer NOT NULL,
    color_id integer NOT NULL
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    exchange_rate_eur double precision NOT NULL,
    available_colors character varying NOT NULL,
    available_sizes character varying NOT NULL,
    available_categories character varying NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    available_genres character varying DEFAULT 'Femme,Homme,Enfant,Unisexe'::character varying
);


--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    is_admin boolean NOT NULL
);


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: agentsession id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agentsession ALTER COLUMN id SET DEFAULT nextval('public.agentsession_id_seq'::regclass);


--
-- Name: client id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client ALTER COLUMN id SET DEFAULT nextval('public.client_id_seq'::regclass);


--
-- Name: color id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.color ALTER COLUMN id SET DEFAULT nextval('public.color_id_seq'::regclass);


--
-- Name: order id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order" ALTER COLUMN id SET DEFAULT nextval('public.order_id_seq'::regclass);


--
-- Name: product id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);


--
-- Name: product_embedding id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_embedding ALTER COLUMN id SET DEFAULT nextval('public.product_embedding_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: agentsession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agentsession (id, client_whatsapp, messages_json, channel, total_messages, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client (id, name, email, whatsapp, total_spent, total_orders, created_at, favorite_categories, favorite_colors) FROM stdin;
\.


--
-- Data for Name: color; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.color (id, name, hex_code) FROM stdin;
7	Rouge	#CCCCCC
\.


--
-- Data for Name: order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."order" (id, client_name, client_email, client_whatsapp, client_message, product_id, product_name, product_image, product_price_ar, selected_size, selected_color, status, created_at, cart_items_json, delivery_zone, delivery_cost, delivery_label, subtotal_ar, discount_ar, total_ar, payment_method, mvola_phone, mvola_correlation_id, mvola_transaction_ref, mvola_status, mvola_account_name, om_phone, om_account_name, payment_proof_text, payment_proof_image, planning_status, planning_note, acompte, progress, client_id, is_pos, amount_tendered, change_ar) FROM stdin;
\.


--
-- Data for Name: product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product (id, name, tag, genre, category, price_ar, old_price_ar, image, colors, sizes, badge, is_hot, on_order, stock_quantity, created_at, images, description, slug) FROM stdin;
16	Robe Marié	Traphilo	Femme	TENUES	500000	700000	https://pub-2449c7dfae184401ab5b703fc65cd4a1.r2.dev/aaaaaaaaaaaabbbbbbbbbbbbccccccccccccccddddddddd.png	Rouge	XL,S,XS	Promo	f	f	6	2026-05-29 16:20:03.311211	https://pub-2449c7dfae184401ab5b703fc65cd4a1.r2.dev/aaaaaaaaaaaabbbbbbbbbbbbccccccccccccccddddddddd.png,https://pub-2449c7dfae184401ab5b703fc65cd4a1.r2.dev/aaaaaaabbbbbbbcccccc.png,https://pub-2449c7dfae184401ab5b703fc65cd4a1.r2.dev/art_jatie_agent_architecture.jpg	C'est une robe fait en main	robe-marie
17	Robe Rouge	Raphia	Femme	TENUES	225000	300000	https://pub-2449c7dfae184401ab5b703fc65cd4a1.r2.dev/aaaaaaaaa-capture.png	Rouge	XS,S	Sur commande	t	t	0	2026-05-30 05:59:16.848289	https://pub-2449c7dfae184401ab5b703fc65cd4a1.r2.dev/aaaaaaaaa-capture.png,https://pub-2449c7dfae184401ab5b703fc65cd4a1.r2.dev/aaaaa.jpg	Bonjour bonjour	robe-rouge
19	Robe Rouge Élégance	Raphia	Femme	TENUES	180000	220000	https://test.com/1.jpg	Rouge	S,M,L	Nouveau	t	f	5	2026-06-04 13:32:57.164007		Robe rouge élégante pour cérémonie	\N
20	Robe Mariée Prestige	Traphilo	Femme	TENUES	750000	900000	https://test.com/2.jpg	Blanc	M,L,XL	Best Seller	t	t	2	2026-06-04 13:32:57.164007		Robe de mariée haut de gamme	\N
21	Sac à Main Chic	Cuir	Femme	ACCESSOIRES	95000	120000	https://test.com/3.jpg	Noir	Unique	Nouveau	f	f	10	2026-06-04 13:32:57.164007		Sac élégant pour sorties	\N
22	Pochette Soirée	Raphia	Femme	ACCESSOIRES	45000	60000	https://test.com/4.jpg	Doré	Unique	Promo	f	f	15	2026-06-04 13:32:57.164007		Pochette pour événements	\N
23	Robe Bleue Royale	Soie	Femme	TENUES	240000	280000	https://test.com/5.jpg	Bleu	S,M,L	Nouveau	t	f	4	2026-06-04 13:32:57.164007		Robe longue élégante	\N
24	Robe Rose Romantique	Dentelle	Femme	TENUES	195000	240000	https://test.com/6.jpg	Rose	S,M	Nouveau	f	f	6	2026-06-04 13:32:57.164007		Robe légère et raffinée	\N
25	Panier Décoration	Raphia	Unisexe	MAISON	35000	45000	https://test.com/7.jpg	Beige	Unique	Nouveau	f	f	20	2026-06-04 13:32:57.164007		Panier décoratif artisanal	\N
26	Lampe Artisanale	Raphia	Unisexe	MAISON	120000	150000	https://test.com/8.jpg	Beige	Unique	Tendance	t	f	3	2026-06-04 13:32:57.164007		Lampe décorative faite main	\N
27	Robe Verte Nature	Coton	Femme	TENUES	160000	190000	https://test.com/9.jpg	Vert	S,M,L	Promo	f	f	8	2026-06-04 13:32:57.164007		Robe confortable pour tous les jours	\N
28	Sac Bandoulière	Cuir	Femme	ACCESSOIRES	85000	100000	https://test.com/10.jpg	Marron	Unique	Nouveau	f	f	12	2026-06-04 13:32:57.164007		Sac pratique et élégant	\N
\.


--
-- Data for Name: product_embedding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_embedding (id, product_id, contenu, embedding) FROM stdin;
1	16	Nom : Robe Marié | Catégorie : TENUES | Genre : Femme | Couleurs : Rouge | Tailles : XL,S,XS | Description : C'est une robe fait en main | Badge : Promo	[-0.02733471,0.10211912,0.01077036,-0.02020263,-0.04719249,0.13490914,-0.00466409,-0.01531675,0.12668708,-0.08023104,0.00516465,0.0551192,-0.02020476,0.0412201,0.01408852,-0.06114491,0.03469193,0.0136893,0.05215834,-0.06990856,-0.0055267,0.03447226,0.03736653,-0.10833476,0.11462618,-0.05585126,0.05528932,-0.02119373,0.01660872,0.05462338,-0.07729579,-0.02455211,-0.02678045,0.06948272,0.00157503,-0.03572576,-0.04049715,0.02585872,0.08000654,-0.06807263,-0.02908379,0.01393605,0.02411942,-0.04713601,0.00703052,-0.10154384,-0.00144102,0.00446829,-0.04800329,0.08484998,-0.00284125,-0.05102097,-0.07300358,0.00977755,-0.06779219,0.04233291,-0.00041428,-0.00380015,-0.07791805,0.00181638,-0.01480612,-0.06316307,-0.01325005,0.00301875,0.01098504,-0.04554457,0.0186056,0.03407735,0.11086032,-0.05068529,-0.01357195,0.08178986,-0.01875065,0.04155374,-0.03974124,-0.03472944,-0.01483847,0.00183067,-0.04500824,-0.0099377,-0.15222597,-0.01439387,-0.02049517,-0.00974346,-0.00232043,0.0074334,-0.0129636,-0.01925414,-0.02113274,-0.01088932,-0.03332802,0.09370904,-0.04185534,-0.00039229,-0.0095955,-0.03216223,0.02013168,-0.01635141,-0.04516188,-0.01829001,0.04860469,-0.00267173,-0.01961693,-0.00919742,0.04435633,-0.03750789,-0.06065488,-0.02223681,0.12190959,0.0223475,-0.07664476,0.04182272,0.03672764,0.02574682,-0.06240312,-0.00883933,-0.01414973,0.00401409,-0.05604699,-0.02942493,-0.01263037,0.03632031,0.00892764,-0.0218099,-0.00733973,-0.0522413,0.02264627,-0.03586887,-0.05435575,-0.02821607,0.01209483,-0.01110129,0.05892945,-0.05550224,-0.01058773,-0.03894881,0.00534411,-0.03779789,0.08813319,-0.06999876,-0.00191205,-0.01625428,-0.00305258,0.07176624,-0.02718717,-0.03789987,0.06944905,-0.00899627,-0.05616112,-0.03091376,-0.00513952,0.07460528,0.04647359,0.01523659,-0.02723312,-0.00754448,-0.00988111,-0.02856184,0.01806174,0.03306155,0.03405868,0.05159343,0.06881767,-0.00199181,-0.03489876,-0.01147305,-0.00960339,0.05748146,-0.04035136,0.05189865,-0.03494669,-0.0375249,-0.00090455,0.02177068,0.00678406,-0.05737356,0.03562022,-0.07093259,0.01209159,0.04246213,0.01831478,-0.03673887,-0.00012808,-0.04877902,0.00866136,0.05829034,0.00494464,-0.01568698,-0.03311037,-0.01445052,0.04039087,0.03247153,-0.00171873,-0.05528283,0.00049529,-0.05246404,0.01173823,0.02401618,-0.01969497,0.06467296,-0.00761768,0.00110602,0.01112469,-0.0870437,0.00285605,-0.05060018,-0.0711531,0.0317952,0.0520073,0.00992786,0.00188182,-0.02642319,-0.04088651,0.04090703,0.06070715,-0.01731771,0.05418557,-0.01203592,-0.04221479,-0.00794456,-0.03368063,-0.02294074,0.04603915,0.00460272,0.01385447,0.00459694,0.02059128,-0.00793456,-0.03312004,0.01107909,-0.00622723,0.05005091,-0.01688916,0.02235537,0.01456005,0.00213402,0.00876567,-0.04039114,0.03223635,-0.07391401,-0.02221044,-0.04915942,0.01326261,-0.02099554,0.03317263,0.03044723,0.01869703,0.02992414,0.0178773,-0.01389691,-0.04807274,-0.0163759,-0.00715907,0.01589585,0.02841566,-0.00633079,-0.00946517,0.01042871,0.01769737,-0.020998,0.00980882,-0.02717191,-0.00928689,0.01281273,-0.00405995,-0.01044424,0.02112031,0.04514223,0.0147349,0.04726404,0.01646849,0.01876727,0.02143637,-0.01925198,0.02188988,0.0202427,0.00759496,-0.03079941,-0.00298431,0.04551107,0.00470937,-0.00604036,0.01422024,-0.01197986,0.00069295,0.01427522,0.06329584,-0.0090151,0.0396776,-0.01810221,-0.05485866,-0.02793028,0.01934429,-0.02560503,-0.01956944,-0.03673058,0.06448741,0.01352293,0.00042309,0.01742107,0.03233385,-0.02082445,-0.05073685,-0.01134561,-0.03112325,0.05343559,0.00424996,-0.00339046,-0.01122062,-0.0125623,0.00529966,0.01081155,0.04348624,-0.03538169,0.04535462,0.00324169,0.03909688,-0.04764047,-0.05733484,0.00148569,-0.00252467,-0.06932066,0.00169836,-0.016145,0.0600456,0.04067526,-0.0230037,-0.02481991,-0.02987264,0.00812846,0.0607759,0.01436252,-0.03215653,-0.05584968,0.01407489,-0.01590569,0.00321454,-0.03045254,-0.04026233,0.01932263,0.01499068,0.00789854,-0.02549435,0.02539508,-0.04227705,-0.03774361,-0.00497125,-0.02764922,-0.02910764,-0.0395613,0.08188386,-0.03822521,-0.03629723,0.02851869,0.01818983,-0.01074581,0.02830491,0.00890751,-0.01078947,-0.01850621,-0.006715,0.03615944,0.02477711,0.02744008,-0.03069865,0.00520538,-0.01248142,0.01348862,-0.00550258,0.01997761,0.04003905,-0.00223952,-0.0231665,-0.04690135,-0.02808479,0.02028026,-0.00395713,-0.07199775,-0.00505302,-0.00745512,0.0333994,0.01791473,0.04541031,0.00891645,-0.01839688,-0.00382916,-0.0403793,-0.01175859,-0.00267318,0.03159451,0.01190664,0.01858637,0.03597046,0.01225474,0.01048727,0.0259113,0.00719641,0.03882885,-0.0173873,-0.0066083,-0.0067113,0.02041298,-0.02096522,-0.02506257,-0.04770917,-0.01834532,0.00370319,-0.00889089,0.01711159,-0.01730945,0.00113134,-0.01925921,0.03416364,-0.00986084,-0.00499328,0.05626288,0.0078296,-0.04348923,-0.01987466,-0.03107686,-0.02426762,-0.00152172,0.03414549,-0.03218645,-0.03659609,0.00420749,-0.02725956,-0.03199856,-0.0094715,0.03938837,-0.03174824,-0.01854361,0.06533591,0.00643712,0.00736723,0.01414561,-0.02113081,-0.0437702,-0.04274963,-0.04134865,0.01505316,0.00328491,0.0167229,0.02123372,0.06128522,0.02145005,-0.01441159,-0.06678741,0.00482196,0.01102132,0.00599519,-0.00202704,0.03415189,0.01210164,0.00540434,0.04709094,0.02745851,0.02022915,-0.0249154,0.00086907,0.03549587,-0.00389243,0.04173222,-0.05606435,-0.0265964,0.04325491,-0.03579157,-0.00921518,-0.00516378,-0.00082674,-0.02307754,0.01730016,-0.00794839,-0.01772043,-0.0167943,-0.01392462,-0.02589379,-0.02888578,-0.01708779,0.06650609,0.06465331,0.03027027,-0.0182341,0.00641428,-0.00108523,0.0799427,0.0119796,0.02872249,0.02211358,-0.00945561,0.00300466,0.00159161,-0.03547171,-0.0472772,-0.04598426,0.01349397,0.00581095,-0.02116966,-0.07918539,0.0034739,0.04919907,0.02252611,0.00828344,0.03148824,0.00701074,-0.01747977,0.01110945,-0.02108902,0.03412506,-0.00939074,-0.0320257,-0.01747727,0.02609101,-0.00038888,-0.02443792,-0.00796556,0.01377511,-0.00045522,-0.00411309,0.02491527,-0.03229877,0.01157016,0.00949834,0.02898662,-0.03349122,-0.02274343,-0.01825375,0.02239946,0.00087962,-0.01933982,-0.03782893,0.01652892,0.04756062,0.02291066,0.01873575,-0.01784036,0.01102779,0.06285772,0.03295314,-0.02268573,-0.00705027,-0.00870016,0.01477864,-0.0158889,0.0223651,-0.00067133,-0.03140957,0.0043276,-0.04811519,0.00496652,0.04359042,-0.04246831,0.00053164,0.02323644,-0.00401972,-0.00242641,-0.05470616,0.00505726,-0.00393479,-0.0074822,0.03795346,-0.01872378,0.01715854,-0.04711953,0.01780141,0.0067602,0.00250737,-0.04757027,-0.01795682,-0.01149997,-0.0013,0.0197696,-0.0123822,-0.00982685,-0.04658864,-0.00772138,0.06300855,-0.0297057,-0.01232908,0.02605901,0.01252295,-0.03797819,0.01640764,0.02190145,0.03366976,-0.03550069,0.06047704,-0.01550764,0.01805617,0.03171812,0.01069714,-0.01568839,0.01780266,0.03187048,0.01946794,-0.01268227,-0.02854921,0.01943128,0.01332665,0.02208556,0.01376919,-0.00723043,-0.02701389,-0.00700835,-0.0291535,0.01489249,-0.01885626,-0.02374839,0.00414045,0.05345111,0.02064714,-0.01418016,0.00467467,-0.01622254,-0.01834346,-0.03953909,0.01441255,0.07612421,0.03183124,-0.02338716,0.03382059,0.02869198,-0.0478444,0.02193254,0.00964994,-0.03802466,0.01331961,-0.00648785,-0.00401805,-0.024603,0.00011216,-0.05729222,-0.00544462,-0.0330622,-0.0191422,0.00171505,0.0182619,-0.01812028,-0.04864864,-0.01001472,0.01855177,0.02756135,0.00436383,-0.00680691,0.02198235,0.03465508,0.02617992,0.01952634,0.01493226,-0.02185116,0.01965174,-0.0108075,0.00705097,-0.02283494,-0.02962285,0.0249254,0.06322288,-0.00507451,0.03154356,-0.00076126,0.00887111,0.00452367,-0.06911021,0.05001146,-0.01015697,-0.00755739,-0.04973099,0.01869063,-0.05678694,0.02762937,-0.00157428,-0.00573336,0.00560401,-0.04498,0.01570575,-0.01154096,0.00294581,0.00794218,-4.982e-05,-0.01409479,0.02089136,0.02760838,-0.00931141,0.02839671,0.01263412,-0.01411994,0.01111379,-0.00212151,-0.01205559,0.0210158,0.01419402,-0.01642141,0.00804624,0.04225557,0.01767568,0.04695528,-0.04637344,0.02321831,-0.02912377,-0.03965881,-0.00676702,-0.00102622,0.01249971,0.00525268,-0.00143817,-0.04709515,-0.02164052,-0.03260131,-0.00250471,-0.02854588,0.01784229,0.00509553,0.0122589,-0.00628414,0.02465355,-0.00592333,-0.00942354,-0.03681442,-0.02242252,0.0014229,0.01448912,0.01641466,-0.00366962,-0.0120922,-0.01542589,-0.00117083,-0.05629291,-0.01324501,-0.05386011,-0.01678948,-0.02745963,0.00913836,-0.00324507,0.03694841,-0.06838481,0.04519051,0.01162085,0.0058448,-0.0006833,0.04395672,0.00320525,0.00422319,-0.01236891,-0.03633816,-0.00886888,0.04383963,0.02049622,-0.01053833,0.00397272,-0.01404929,0.00062502,0.00137686,0.01300482,-0.00270025,0.01728053,0.00284777,0.01810743,0.01479681,-0.04388788,-0.01484215,-0.00592359,-0.01917003,-0.01673155,-0.02064938,0.01738997,0.00871112,0.00844927,-0.02661182,0.01849166,0.02622413,0.05609206,0.01330007,-0.01332187,-0.00439042,0.01746434,-0.06048967,0.01991622,-0.03035059,-0.0044315,0.02555423,-0.01002116,0.02923054,0.00037754,-0.004566,0.04022496,0.00876438,-0.03130083,-0.00825766,0.00782455,-0.01262879,-0.00885191,0.00230871,0.01545539,0.01325136,0.03705224,0.01978977,0.01254112,-0.00836866,-0.00695347,-0.00958603,-0.00141035,-0.00920235,-0.01676132,0.02944723,-0.0167578,-0.02139604,-0.02638684,0.01538773,0.01004979,0.03039049,-0.01320305,0.02796338,0.03281434,0.02835837,0.04136707,0.03203569,0.03042759,-0.01373056,0.02667206,-0.00842489,-0.02762668,-0.00431518,0.03076975,0.00142932,-0.00154327,-0.00330095,0.04614105,0.00691483,0.04073533,-0.01557645,0.01853739,-0.03402062,0.0043309,-0.00767534,0.00637204,0.03172472,0.02008435,0.01406375,-0.01833635,-0.00622046,0.00253269,0.031777,-0.00346478,0.00922918,0.01489775,-0.00717887,0.00041503,0.00447824,-0.02640662,0.01363559,0.00989043,0.00553167,-0.00081028,0.00062165,0.00274894,0.00430693,0.00804887,-0.02111625,-0.01573539,-0.02597806,0.01416192,0.03180313,-0.01801446,0.03500707,0.0089815,-0.04697518,-0.00346202,-0.02608312,0.02901433,-0.02038218,0.02802209,-0.01954726,-0.03522341,-0.03617952,-0.01692537,0.03762575,0.01310137,-0.02535571,0.02196551,0.01093632,-0.02322837,-0.00560676,-0.01060735,0.00167703,-0.01201205,-0.00029513,-0.01068951,-0.01557798,0.01456316,0.00798409,0.01323251,0.01675972,-0.0237141,0.01391976,-0.01117493,0.01646859,-0.03012869,-0.00929569,-0.01636451,0.0408381,-0.00738697,-0.04214858,-0.03088464,0.00592408,-0.0058329,0.01898547,0.0172284,0.04239272,-0.01986038,-0.0004781,0.02611583,-0.00368127,0.01717521,0.00023675,0.01977679,-0.05385029,0.04392068,0.00514243,-0.01102434,-0.01361152,-0.01438865,-0.05548348,0.0051688,0.00753736,-0.00575229,0.01042375,-0.0489402,0.01045932,-0.00170018,0.02771571,0.01419161,-0.02077675,0.02242664,-0.01941146,0.06448705,0.02826072,-0.02603541,-0.04316582,-0.01930722,0.01278988,0.04506945,-0.01774301,-0.00512477,-0.01977754,-0.00504443,0.01303784,0.01020457,-0.05061197,0.0422671,0.02819191,0.01172301,-0.01097055,0.02342226,-0.01098771,-0.00469353,0.03586462,8.09e-05,0.00981043,0.01603701,0.01884949,-0.00543445,-0.01518664,-0.01531319,0.00313091,0.00280529,0.03855312,0.02589776,-0.00849259,0.02383942,0.01782954,0.03221633,-0.01557313,-0.01313616,-0.01601206,0.0097957,0.00486413,-0.00381199,-0.00447728,-0.01823314,0.01359604,0.01252251,0.02532082,-0.01532911,-0.0471632,-0.00021337,0.01598677,-0.0179021,-0.03938065,-0.01232046,0.0034306,0.01696703,-0.00268147,0.04462432,-0.03185338,0.03848829,0.03490798,0.01846162,-0.01864648,0.03408402,0.00925807,0.01159542,0.02375874,-0.00284563,0.0267605,0.00616583,-0.00635929,-0.01355066,0.01490695,-0.00796547,-0.0131973,-0.01814531,-0.02027301,0.01523673,0.00688586,-0.01895055,0.01425597,-0.03992365,0.01863593,-0.00693158,0.04967331,-0.0107368,-0.00768212,0.01852963,0.02545204]
2	17	Nom : Robe Rouge | Catégorie : TENUES | Genre : Femme | Couleurs : Rouge | Tailles : XS,S | Description : Bonjour bonjour | Badge : Sur commande	[-0.06442109,0.10621332,-0.02869248,-0.0056584,-0.066128,0.06248336,0.00468458,-0.03921824,0.11763664,-0.08817722,-0.04462429,0.0672182,-0.00082339,0.03841738,-0.00089485,-0.0554577,-0.0252033,0.01223776,0.02113011,-0.00805688,-0.01913244,0.00343656,0.02105406,-0.06851032,0.11112099,-0.0187767,0.09721537,-0.05792807,-0.02776282,0.10157952,-0.04719485,-0.04833927,-0.04621248,0.05966083,0.02259194,-0.05402758,-0.01566575,0.00450342,0.07394332,-0.07008585,-0.04630921,0.02623221,0.06645074,-0.04399272,-0.00482989,-0.07166284,0.01285468,0.00335526,0.02591433,0.09749677,-0.01771293,-0.05224321,-0.05979063,0.00703719,-0.06714816,0.03635526,0.06081028,-0.05086304,-0.06393787,0.01048255,0.02126461,-0.08763453,-0.00616442,0.01101985,0.00691301,-0.04272033,0.0275508,0.06404423,0.10378796,-0.09703112,0.01251864,0.03083726,-0.04678118,0.01919795,-0.08521587,-0.03076924,0.01143132,0.06651769,-0.0309583,0.02086481,-0.13790631,0.02862914,-0.00631039,-0.01823537,0.00887452,0.02571427,-0.01651186,-0.01857452,0.01033854,-0.03178526,0.00691765,0.05383878,-0.01774853,0.04614422,-0.0031211,0.00924438,0.02171601,-0.03100413,-0.02191973,-0.02912377,0.07807443,-0.0280271,-0.0108238,-0.02392028,0.09650351,-0.02224093,0.01183451,-0.06458399,0.14976259,0.05920586,-0.07985261,0.01171768,0.06447135,0.03994808,-0.06625519,0.06461205,-0.0038282,0.03109668,-0.01438257,-0.02093919,-0.0324933,0.06385202,0.01058854,-0.00849148,0.00223132,-0.06674135,0.01697999,0.02255376,-0.06445459,-0.05107974,-0.00502198,-0.02130198,0.04467737,-0.00708147,-0.00227817,-0.0809514,0.00626648,-0.01267172,0.09850175,-0.06254251,0.00111592,-0.05651355,0.01033023,0.05093242,-0.01815521,-0.05495332,0.09090743,0.00537576,-0.00233093,-0.0006478,-0.03794565,0.09645452,0.03392428,0.02768566,-0.00983805,0.0039368,-0.00015195,-0.00704985,0.00990623,0.0190214,0.02494375,0.10535825,0.0306768,-0.00212695,-0.03187637,0.02702377,0.00113657,0.03124681,-0.01218029,0.06219171,-0.07733345,-0.03321742,0.00012225,-0.00636774,0.0050024,-0.0437777,0.03883412,-0.05522691,0.03414867,0.03100389,0.0214298,-0.02890002,0.02341129,-0.0130697,-0.01162703,0.04264102,0.03777418,0.0058837,-0.01239521,-0.0535342,-0.00687754,0.01147837,-0.01557431,-0.05386406,-0.01472122,-0.0580314,0.03719757,0.04863302,-0.01327419,0.02538289,0.00037682,0.02952068,-0.00081435,-0.06868819,0.01403213,0.0097653,-0.06544843,0.0181693,0.03611721,-0.00145429,0.00876607,-0.00684959,-0.02171926,0.03179631,0.01937293,-0.04250286,-0.01045361,-0.05129706,-0.06479555,-0.01365678,-0.05104268,-0.0584314,-0.00602278,-0.00564977,0.00857103,0.0096212,0.02699845,0.01655909,-0.01116552,0.03340187,0.03543246,0.05483984,0.01925006,0.00124325,-0.00172215,0.00358852,0.01138285,-0.02190193,0.03679937,-0.04903146,-0.02211411,-0.03767012,-0.01430002,-0.04795235,0.03747436,0.02429798,0.02518833,-0.00263714,0.00686189,-0.01369028,-0.03515347,-0.01994344,-0.02861166,-0.01630952,0.00870467,-0.01090721,0.02679369,0.02227874,-0.0093148,0.00366887,0.00504488,-0.03391944,-0.02613522,0.02944684,0.02617563,-0.03277418,0.02592968,0.04904108,-0.0253953,0.04024795,0.02090213,-0.00096743,0.0073865,-0.01725309,-0.01956629,0.02831159,0.01657943,-0.00609276,0.0076742,0.0425022,-0.01031259,-0.0094409,-0.0078408,-0.00863405,0.00583887,0.00556142,0.02593673,-0.01113018,0.02446909,-0.03754983,-0.04722824,-0.0157485,0.01096531,-0.03269556,-0.01430645,-0.04319868,0.03646295,0.0053116,-0.01463884,-0.00513557,0.02839477,-0.00959121,-0.02236569,-0.02385186,-0.04473756,0.07324149,0.00033615,0.03793217,-0.00766582,0.01322704,-0.00253947,0.03095306,0.0350453,-0.0451384,0.04718962,0.02952494,0.0367581,-0.04544408,-0.03145116,0.0120251,-0.01141525,-0.08364476,-0.00311805,-0.02594364,0.02350551,0.00342207,0.00072747,-0.01615292,-0.03659144,0.01425601,0.04465475,0.02294199,-0.0346714,-0.05292283,0.00940803,-0.03061597,-0.03431913,-0.01634336,-0.01021365,0.01060187,0.00231628,-0.00646446,-0.04021503,0.04955237,-0.02784159,-0.03663131,-0.02042974,-0.0141978,-0.02360831,-0.05884679,0.02000963,-0.03450861,-0.04079703,0.02768436,-0.02228357,-0.01854162,0.03122734,-0.00457659,-0.01272508,0.00563356,-0.01991649,0.04406433,0.0119873,0.05492777,-0.03659709,-0.00871239,0.0079364,-0.00834704,0.01350854,-0.00391877,0.00409149,-0.00871934,-0.02563775,-0.03016321,0.00737058,0.00064394,-0.01871642,-0.04788829,-0.03624849,-0.03659144,0.02895194,0.02652841,0.05742558,-0.00347007,-0.00221837,0.00023293,-0.03542545,0.00738983,-0.02276015,-0.00063069,-0.00120349,0.01236627,0.01936964,0.00616014,-0.00102875,0.00898094,-0.02398202,0.02140269,-0.01920206,-0.00317899,0.00276022,0.03960665,-0.03552537,-0.02864977,-0.04400712,0.00647402,0.00627293,-0.00133254,0.00487406,-0.05717182,-0.01370053,0.02774811,0.03719233,0.01326991,0.01503444,0.04128864,-0.00069302,-0.02561071,-0.03072904,-0.05783427,-0.04488548,-0.03135255,0.01420151,-0.04280265,0.00247417,0.02259511,-0.02257046,-0.0227067,-0.00637233,-0.00166585,-0.02778883,-0.01301369,0.04577112,0.0323981,0.01861263,0.02509694,-0.0377769,-0.04282641,-0.01444555,-0.07118296,-0.0087238,-0.0018392,0.01138987,-0.00634932,0.03971903,0.04255727,-0.02323464,-0.04929484,0.00418712,0.03011411,-0.00074498,-0.01210387,0.02801244,0.00931449,-0.00073152,0.03431264,-0.02229712,0.03006261,-0.03135621,0.01338905,0.03003242,0.00526373,0.02298637,-0.03113035,-0.01475232,0.05127749,-0.0182775,0.00583835,-0.02811315,-0.01282234,0.00895419,-0.0008534,-0.00982366,-0.02703384,-0.01990024,-0.00611524,0.01062937,-0.04449574,-0.01935315,0.0552121,0.04765547,0.03125602,-0.01482932,-0.01719966,0.00644761,0.06797372,0.05135967,0.01040891,-0.01808192,0.00025119,0.00546083,-0.00318419,-0.02724439,-0.02406532,-0.03951761,-0.00824934,0.00880606,-0.01149697,-0.08111722,-0.00487914,0.04534573,0.01169277,-0.000702,0.01571626,0.01587374,-0.04739491,0.03473557,-0.01439021,0.01942015,-0.00024158,-0.03244337,0.00498548,0.00381644,-0.01580524,-0.01444831,0.00856246,-0.0055094,-0.00994808,-0.00772798,0.03855136,-0.04435614,-0.00484206,-0.00161102,0.00465441,-0.06253257,-0.00798468,-0.00445383,0.00223651,-0.00586902,0.01433308,-0.02921243,0.01698861,0.03677158,0.03026214,0.01638165,-0.02281843,0.01131061,0.05050878,0.06068088,-0.01239259,0.01012489,-0.01877497,0.01575887,-0.0114404,0.02813995,-0.00454106,-0.01972139,0.00208079,-0.03413312,0.00740395,0.06141704,-0.04731504,-0.01216825,0.01864668,-0.01674155,0.00343645,-0.02731989,0.02621499,0.01587612,-0.01601598,0.03204666,-0.02914857,0.01292906,-0.03914545,0.05018384,0.02308195,0.03024916,-0.03051569,-0.02898199,-0.01882517,0.00976261,0.02045376,-0.02210691,-0.00370705,-0.02149617,-0.00616829,0.06160379,-0.04037688,-0.03787002,0.0091304,0.01634655,-0.04186235,0.04994823,0.01226621,0.0163124,-0.04677903,0.05739208,-0.01022822,0.0109417,0.03531385,0.00817187,-0.03246232,0.03119886,0.02003958,0.02750304,-0.01322197,-0.01174757,0.02624283,0.02378816,0.01468838,0.02488825,-0.02110412,-0.00757903,0.01368295,-0.03576316,-0.01051427,-0.03442549,-0.00679015,0.01162378,0.03646414,-0.01580952,-0.00380917,-0.00122277,0.00580524,-0.00717192,-0.04461968,0.00036069,0.10921487,-0.00977917,-0.00961434,0.02571302,0.02146288,-0.04425527,0.01182386,-0.0125715,-0.00915287,-0.01942057,0.00357455,0.02064811,-0.02914367,0.01909395,-0.05987397,0.01440937,-0.01903014,-0.00500983,0.0063367,-0.0170222,-0.02260458,-0.0493876,-0.00809477,-0.00694483,0.02146519,0.03250346,0.00125832,0.03236663,0.0262891,0.00641095,0.01606275,0.01753235,-0.01109355,-0.00410236,-0.00815408,0.02338089,-0.02510951,0.00174344,0.01303029,0.05506722,-0.01213322,0.03041958,0.02117332,0.0017611,0.00662985,-0.07684772,0.04097358,0.00153464,-0.02229414,-0.06968889,-0.01464876,-0.03901429,0.01773125,-0.01849948,0.0025738,0.0089766,-0.06358947,-0.00318203,-0.01213245,-0.00131238,-0.00313409,-0.0074737,-0.02084,0.01070391,0.01427788,0.00373676,-0.02183797,-0.00090768,-0.0106133,-0.01352069,-0.02061639,-0.00436252,0.02413127,0.01784971,-0.02031218,-0.00759647,0.02064267,0.04416106,0.06447554,-0.03793351,0.00379067,-0.00855785,0.01192569,-0.01736635,0.01238431,0.00817554,-0.00080215,-0.00607135,-0.03509171,-0.01880606,-0.03544534,0.00430554,-0.01672764,0.01847201,0.00137795,0.0092625,-0.02680897,0.00820448,0.00629512,0.00479026,-0.03971924,-0.02262437,-0.00709314,0.01488317,0.0206943,0.00534724,-0.02041745,-0.02300427,-0.00820715,-0.05454735,-0.02172891,-0.05167288,-0.01204786,-0.03618557,-0.01118892,0.01924637,0.01367977,-0.01815732,0.02692476,0.02207592,0.01186404,0.00972981,0.02470552,0.01415896,0.0134628,0.0074716,-0.03839329,-0.01752806,0.0420129,-0.0040864,-0.01094505,0.01106574,-0.02215428,-0.00534771,0.00133472,0.03120884,0.00707923,0.01887941,-0.01827941,0.00159813,0.02222803,-0.02400381,-0.01072851,0.00116483,-0.01881156,-0.01624503,0.00069506,-0.00224293,0.01719332,0.01990076,-0.01913959,-0.00588491,0.0008948,0.05393514,0.03451196,-0.02925297,-0.0160846,0.02826494,-0.02398874,0.01916565,-0.02764871,-0.00875251,0.01951347,-0.01347274,0.03144435,0.01160646,0.00510636,0.05841967,0.00584366,-0.02601839,0.01033696,-0.00916239,-0.00698824,-0.02129392,-0.02310705,0.02587049,0.01700685,0.03743102,0.02317031,0.0290884,-0.00544423,0.0088671,-0.02092417,-0.01364704,-0.01045045,0.00057187,0.00960118,-0.00249649,0.00117892,0.00577407,0.00129292,0.00211445,0.0211773,-0.01176848,0.04336115,0.01491594,0.02144961,0.02638133,0.05906286,0.03577274,-0.00809315,0.02476886,-0.0151662,-0.02894561,-0.00629365,0.02801883,-0.00737335,-0.00289776,-0.01505104,0.05696245,-0.01857952,0.03045371,-0.03212366,0.01396791,0.00188644,0.02151855,-0.01202211,0.01393702,0.03650381,0.00864819,0.03841799,-0.02985096,0.0060947,0.00405322,0.02710759,0.01468771,0.00070134,-0.00548064,-0.0237997,0.0189253,0.00265792,-0.01719736,0.02084419,0.00573188,0.00011712,0.01690308,-0.00132444,-0.00316383,0.02184077,-0.01171891,-0.01063241,-0.00977681,-0.00182436,0.0091449,0.00479507,-0.02717893,0.03381046,-0.01361103,-0.04945187,-0.00897574,-0.04839832,0.0226787,-0.00989666,0.0329557,-0.02318122,-0.02203834,-0.02975012,-0.00557025,0.02349682,0.02373749,-0.02671146,0.0232014,-0.00668123,-0.00742552,-0.02223402,-0.00023968,0.0072392,-0.00166429,-0.00099289,-0.02826955,0.00102411,0.02281437,0.00702177,0.02322328,0.02489888,0.00114987,0.00744242,0.01361564,0.00823771,-0.05119552,-0.00894477,0.00424297,0.03010574,-0.02205143,-0.01188194,-0.03214198,-0.0073984,-0.01420565,0.0278284,0.01572526,0.03140991,-0.03071176,0.01155591,0.03375937,0.01003575,0.02510647,0.0207589,0.01269498,-0.0319928,0.0137352,0.00727876,-0.01892362,0.01115379,0.00392922,-0.02719118,0.00764199,0.01672391,-0.00018693,0.0035205,-0.02325073,0.00588787,0.00332087,0.01497068,0.02561549,-0.0141991,0.03574139,-0.01772565,0.04504,0.03700385,-0.01955441,-0.03351643,-0.01148725,0.01875267,0.0270594,-0.00479529,-0.01246969,-0.0208836,0.01581215,0.02110628,0.00305616,-0.04626943,0.03732152,0.00301134,0.03133454,-0.01148124,0.02123781,-0.00982306,0.0199363,0.04240516,-0.01184043,-0.00279052,0.02962146,0.02469851,0.01066486,-0.04215092,0.00800074,0.0089885,0.02167958,0.03952146,0.02406024,0.01312644,0.02243536,-0.00068635,0.00338983,-0.0296112,0.00050079,-0.00362567,0.00880965,0.00724493,-0.01004355,-0.02154098,-0.0341755,0.01659667,0.00443763,0.01588776,0.00881474,-0.04649052,-0.00058723,0.02592354,-0.02644111,-0.03496357,-0.01167785,0.02315062,0.01046623,-0.00121899,0.01768645,-0.01140954,0.01875304,0.01923559,-0.01506612,-0.00835272,0.03346484,-0.00433912,0.01552818,0.00700055,0.007529,0.0293901,-0.01109805,-0.0055115,-0.04563964,0.02047891,0.00662059,-0.00248693,-0.0145151,-0.04525706,0.01424386,0.01459802,0.03023199,0.01607638,-0.02611114,0.0017806,0.00923108,0.04794105,-0.0035863,0.02626933,0.01739113,-0.01705238]
3	19	Nom : Robe Rouge Élégance | Catégorie : TENUES | Genre : Femme | Couleurs : Rouge | Tailles : S,M,L | Description : Robe rouge élégante pour cérémonie | Badge : Nouveau	[-0.05055016,0.12229352,-0.02818707,-0.02555578,-0.0921821,0.05140547,-0.02000112,-0.06022538,0.08770964,-0.1029887,0.01435871,0.08328642,-0.02505928,0.01520549,0.05120004,-0.08366722,0.02498965,-0.01452176,0.02989381,-0.03632544,0.0017644,0.0611863,0.03038428,-0.0624538,0.05856862,-0.04200025,0.04043735,-0.05040606,0.03261228,0.09047787,-0.00537574,-0.07464877,-0.02206197,0.0898987,-0.00995579,-0.05969692,0.00127357,-0.03083958,0.0591963,0.02122271,-0.01862231,-0.02472114,0.07029527,-0.07154274,-0.0237192,-0.07001469,0.00594298,0.04371783,0.01124211,0.06084434,0.05146946,-0.01097634,-0.10652789,0.01869442,-0.0502415,0.0201214,0.0241593,-0.03086826,-0.0261974,-0.01949081,0.06925795,-0.05462195,0.04342165,-0.04954007,0.02322518,-0.06968895,0.02660302,0.00980274,0.09027497,-0.04616814,-0.00092438,0.02806421,-0.04789238,-0.00221874,-0.0360698,-0.03470458,-0.03328474,0.06631926,-0.02457998,0.01694115,-0.13226779,0.02058239,0.00093782,-0.02744914,-0.00546208,0.00396523,0.02160094,-0.04032026,0.0174859,-0.04594678,-0.02892629,0.07657773,-0.05418282,0.03812291,-0.00301508,0.01871172,0.04470814,-0.01237078,-0.04306825,-0.02501246,0.00179381,-0.02797042,-0.02302211,0.03587212,0.10394727,-0.01961283,-0.06876965,-0.02964285,0.09452289,0.03536344,-0.06327479,0.07164261,0.06175438,0.05667014,-0.03437164,-0.0149131,-0.03947508,0.02169054,-0.03201091,-0.04911085,-0.02729403,0.07324592,0.04113132,-0.02386391,-0.0131689,-0.04610457,0.05238912,-0.00593349,-0.05687684,-0.00042905,-0.00951174,-0.05715949,0.02002134,-0.02552157,-0.01814529,-0.04282375,0.02782838,-0.05046181,0.09409232,-0.08486024,-0.0393423,-0.04173095,-0.0095881,0.0506451,-0.01015512,-0.05889597,0.05405294,0.03388342,0.00287657,-0.00907901,-0.02709228,0.08459268,0.04514356,0.01332305,-0.02880318,-0.02877361,-0.0358559,-0.0451942,0.01523445,0.05843679,-0.01421201,0.08911352,0.05066339,0.00342232,-0.0132129,-0.02457834,-0.01004877,0.03070235,0.01051599,0.03713982,-0.01328146,-0.05116735,-0.02880784,0.02554533,0.01909668,-0.0579471,0.04109386,-0.04972965,0.05268516,-0.00889442,0.06787522,-0.04268329,-0.01993305,-0.02189481,-0.00910613,0.04769149,0.00066867,-0.03043535,-0.04120181,-0.02871795,-0.00900349,0.0357894,0.02540557,-0.04340674,-0.0106149,-0.02439392,0.02266056,-0.00755801,0.00490539,0.03639937,-0.01046811,-0.03354893,-0.04706801,-0.0967364,-0.0199553,0.00882109,-0.02941016,0.04169974,0.0619361,-0.03339642,-0.02510109,0.00523952,-0.00672736,0.05497701,0.04133394,-0.05603548,0.04179078,-0.01106874,-0.05185864,0.00682557,-0.04156067,-0.04178349,0.0101414,-0.00181559,0.01287588,0.01809698,0.02424306,-0.00251494,-0.00430038,0.02951479,-0.01250341,0.04293685,0.04916864,-0.0002039,-0.01866974,0.01091567,0.00354958,0.01108749,0.02297685,-0.05035646,-0.04277815,-0.02716977,-0.02218292,-0.00564503,0.05829494,0.04895899,0.01064347,-0.01809804,0.03836828,-0.03110257,-0.03644002,-0.07704106,-0.00216104,-0.02556935,-0.00420793,-0.01586794,0.00201737,0.02318685,0.01956797,-0.00896437,0.00294881,-0.04605012,-0.03405032,0.02002845,-0.00404987,-0.0034023,0.05152756,0.05337337,0.01334026,0.03048647,0.02449684,-0.01821834,0.02451257,-0.04655855,-0.02654479,0.04127108,-0.0219728,0.00082638,-0.00289248,0.04148767,-0.01661614,0.00468393,0.01535911,-0.03333234,0.00887153,0.00454455,0.04444994,-0.0055872,-0.0073451,-0.01261348,-0.05953063,0.02020706,0.0218815,-0.01443146,-0.01583166,-0.01163309,0.02733938,0.00991476,-0.02162523,-0.00814813,0.02710485,-0.00437692,-0.03386119,-0.01294134,-0.03052413,0.03539725,-0.00997288,0.03218475,-0.02260143,-0.02897207,-0.00939479,0.04566573,0.03098804,-0.01954775,0.04468846,0.00509466,0.03227067,-0.05336235,-0.02797257,-0.00230595,-0.02811285,-0.09461115,-0.02958532,-0.02186078,0.03160024,-0.00755031,-0.00849721,-0.01248369,0.00698003,0.01010322,0.04524761,0.02567762,-0.01933982,-0.04435969,-0.00292411,-0.0240407,-0.0073399,-0.02567213,-0.01838429,0.01862127,0.0195877,-0.01815517,-0.04655942,0.04954666,-0.03054772,-0.01053418,-0.03403446,-0.03285054,-0.01478728,-0.05620819,0.05270714,-0.03100204,-0.00953242,0.03087984,-0.01879641,0.00986709,0.01046919,-0.00407736,-0.0202325,-0.00328776,0.02169253,0.05018549,-0.00144542,0.02532753,-0.08421517,0.0060563,0.02912469,-0.01287554,0.01181693,0.03089305,-0.0033911,0.01612929,-0.00137972,-0.05819957,-0.00413519,0.04825792,0.02468923,-0.05237664,-0.00991198,-0.0192128,0.04707252,0.02348346,0.03895665,-0.01268128,-0.00272387,-0.00476118,-0.0538967,0.03314498,0.00255686,0.0078353,-0.01155272,-0.01656187,0.02615825,0.05034086,0.00851192,0.01986944,-0.03473614,0.02187656,-0.03275672,0.00995717,-0.02551188,0.01397046,-0.04571823,-0.01430834,-0.05126962,0.02204428,-0.00534688,-0.01558304,0.00192402,-0.04528471,-0.01236265,0.01931541,0.03868899,0.01377083,-0.0042727,0.0332733,-0.01228041,-0.0278701,-0.01854983,-0.03731953,-0.04031042,-0.00990626,0.02375172,-0.00827697,-0.01851593,0.01070281,-0.02042468,-0.03016229,-0.02699508,0.02428134,-0.01138426,0.00971025,0.02534453,0.01307651,-0.0075412,0.04225117,0.00242228,-0.02363553,-0.0363384,-0.06625111,0.01630808,0.00387127,0.01062565,-0.00428449,0.00580044,0.03685069,-0.00058263,-0.06454273,0.0155144,0.01883461,0.00416974,0.01817068,0.0232361,0.00739013,0.02566784,0.03810887,0.00185006,0.0240374,0.00872943,0.00561217,0.03876434,0.00805655,0.0331745,-0.00395293,-0.02252722,0.00892342,0.00401463,-0.00501283,-0.01806952,-0.02057971,-0.00872632,-0.00885844,0.02554871,-0.04141319,-0.01656867,0.00516099,-0.01716267,-0.04200398,-0.00720264,0.08155861,0.07222006,0.01572988,0.00655078,-0.01286,0.01173757,0.04835086,0.03541052,-0.00392281,-0.01381882,-0.03623714,0.03166484,0.0073424,-0.02116976,-0.04646144,-0.0524668,0.03848689,0.00807044,-0.00990624,-0.06300254,0.01903477,0.05766132,0.01573997,0.02806872,0.00194608,-0.01566601,-0.00904428,0.02257858,0.00756757,0.0268365,0.01456359,-0.04161778,-0.0018071,0.02537656,0.00100055,-0.03629189,0.02655195,0.00208431,0.01192862,-0.0155924,0.02363111,-0.00789021,0.00024635,-0.00697153,0.02443294,-0.06053915,-0.01347983,-0.00885267,-0.00396187,-0.01784602,0.00644969,-0.03694359,0.01950711,0.02013362,0.04242908,0.04459769,-0.02759654,-0.00379778,0.0529071,0.04047762,-0.02856977,-0.0129265,-0.00597705,0.03376033,-0.02061993,0.03209553,-0.01164816,-0.03445219,0.00138017,-0.02863714,0.01306489,0.04510056,-0.0230698,-0.00389312,0.02022769,-0.02236959,-0.01175227,-0.01984508,0.04000419,0.0111102,0.00285513,0.03277428,-0.01272485,0.01741214,-0.02457652,0.02159985,0.01112347,0.0449868,-0.04861765,-0.0270406,-0.02640283,-0.00129547,0.00052234,0.00377858,-0.01005112,-0.03214825,0.00023819,0.04051781,-0.05018948,-0.05118795,0.029099,0.02419932,-0.02002314,0.03539508,0.04411423,0.02671616,-0.05427715,0.05548535,-0.02550562,0.02245762,0.01995679,0.0134039,-0.02287741,-0.00990024,0.00771134,0.00735173,-0.01247518,-0.010478,0.02963907,0.00358527,0.02118745,-0.00714573,-0.02649932,-0.02343543,0.0338034,-0.0259967,0.01866444,-0.0070345,-0.02916976,0.02891403,0.01609285,-0.00278736,0.02453682,-0.024797,0.00507348,0.00203239,-0.01838301,0.00142294,0.07929932,0.0158563,-0.01306806,0.01441699,0.03012218,-0.02677106,0.02167825,-0.00578648,-0.01308276,-0.0137798,0.00790706,0.01584544,-0.03032348,0.0295838,-0.02888385,0.02450889,-0.03509596,-0.00831456,0.00153836,-0.00175337,0.01112003,-0.05059069,-0.01788878,-0.01366562,-0.01678404,-0.00197752,-0.00316775,0.02359908,0.0496077,-0.01877201,0.02210758,0.01282893,-0.02220195,0.01685195,-0.03280103,0.01424864,-0.02003768,-0.011667,0.01932772,0.03849972,0.01905173,0.04248041,0.00155067,0.02317501,0.02702076,-0.06788182,0.03136922,-0.01043691,-0.03385524,-0.04192724,-0.0048241,-0.0406444,0.02965052,-0.0532062,-0.00950741,-0.00761283,-0.06178628,0.02879806,0.01537968,-0.00161248,0.01316018,0.02979627,0.01129794,-0.00131879,0.02812733,-0.02016041,-0.00793309,0.0188558,-0.02247866,-0.00302878,-0.01781143,-0.02571735,0.00913072,0.01750523,0.01054609,0.04052579,0.03582877,0.03782657,0.04451558,-0.03009591,0.01586618,-0.00376601,-0.01092967,-0.01075455,0.00611013,0.00084026,-0.01767639,-0.00833693,-0.04516229,0.00389718,-0.04049544,0.01009459,-0.00812092,0.00945287,-0.0139624,0.01539771,-0.02170632,0.04002135,0.00949892,-0.00398129,-0.06765015,-0.03124603,-0.01148453,0.01644057,0.0359635,-0.01975275,0.0200751,0.00594575,-0.0251563,-0.03757166,-0.03087615,-0.01357063,-0.01363367,-0.02951734,-0.01402341,0.0268235,-0.00984199,-0.04685958,0.03721757,0.01058265,0.01093394,0.00626842,0.02470726,-0.00803244,-0.00330077,-0.00785776,-0.03041266,-0.02414352,0.04317039,-0.01092456,-0.00851325,0.01253731,0.00460789,0.00573262,0.00986482,0.01594561,-0.01260485,0.02943147,-0.02019249,-0.00753277,-0.00873875,-0.06253522,-0.01871935,0.00760818,-0.00777903,0.01835188,-0.01401564,0.02565067,-0.00196424,0.01793094,-0.04266025,0.02294729,0.0250124,0.05028381,0.0343902,-0.01512626,-0.00638064,0.01701885,-0.04371158,6.839e-05,-0.02272601,0.00077744,0.00926947,-0.00679193,0.03298302,0.00133804,0.02923623,0.0499989,0.03103325,-0.0329036,-0.00759612,-0.02967723,-0.0229391,-0.01286058,-0.00521351,0.02470041,0.01244357,0.03289388,-0.00618278,0.01760533,-0.0115969,-0.00540952,-0.01290465,-0.00253585,-0.00564815,-0.01205522,0.02232511,-0.00123039,0.01557298,-0.01587505,-0.01648048,0.02661142,0.01125546,-0.0159236,0.05358457,0.03408431,0.01270266,0.01987603,0.03284898,0.01294009,0.00451776,0.02964023,-0.00851288,-0.02073763,0.00402798,0.02138465,0.01406202,0.00858077,-0.00205283,0.0464441,-0.01981232,0.00079584,-0.026151,-0.00011731,0.00632685,-0.02015608,-0.02587133,0.03462466,0.03008026,-0.00467949,0.00712814,-0.03480626,0.01166322,0.02070282,0.03250217,0.02112751,-0.01983204,0.02442123,-0.01042699,-0.01182424,0.00486444,-0.02244173,0.02590775,0.00529345,0.00657565,0.01383011,-0.00984372,-0.01055304,0.01627681,0.02532207,0.0019756,-0.02951127,-0.00971883,0.03423031,0.00514211,-0.00730338,0.05344342,-0.0155311,-0.05597514,0.00200738,-0.04972423,0.00742754,-0.02194945,0.02352542,0.00145313,-0.02803074,-0.01410719,-0.00030114,0.01985674,0.00250816,-0.01735023,0.0073235,-0.00315689,-0.02996332,-0.01801305,0.0020332,-0.01225069,-0.02688883,0.01073638,-0.01782222,0.00021791,0.01522123,0.00288104,0.00067432,0.03241303,-0.01636926,0.00146967,0.01117222,0.01538961,-0.06196246,-0.0273751,0.00671205,0.01397857,-0.01486501,-0.04036584,-0.02862147,0.00216157,-0.02645579,0.03954882,0.01272013,0.02181626,-0.03351953,0.03310024,0.04141189,0.02222857,0.00900197,-0.02710112,0.02040665,-0.05037623,0.0027277,0.00280608,0.01159199,0.00561382,-0.00299366,-0.04481756,-0.00796283,0.00914663,0.01009464,-0.01426508,-0.01883573,0.02612468,-0.00306001,-0.00477653,0.01450619,-0.01271458,0.02501367,-0.04848993,0.05918382,0.03413948,-0.03968954,-0.01486488,-0.00764972,0.02098239,0.04738534,-0.01113349,-0.00210346,-0.02578385,0.00826528,0.02760698,-0.00895651,-0.02749752,0.03982003,-0.00207098,0.01983373,-0.01549855,0.01473908,-0.00369689,0.01269977,0.03956079,-0.01588667,0.00902456,0.01201523,0.01884285,0.00384747,-0.02507558,0.00435994,-0.00214707,0.03608939,0.03380522,0.02102039,0.01920586,0.03993846,-0.00206434,-0.00700122,-0.03271667,0.00634527,-0.02435456,-0.00861395,-0.01608182,0.00157391,-0.02577958,-0.03383365,0.03560958,0.02479986,0.01719112,0.00803756,-0.02632255,0.03516064,0.00505492,-0.03342251,-0.01762692,-0.00030342,0.00903631,0.00566632,0.01962665,0.02015735,-0.01452088,0.01609944,0.02263668,0.02259517,-0.01443218,0.0424094,-0.01408118,-0.00809281,0.03388894,0.01129727,-0.01257468,-0.01022647,-0.01577968,-0.03493521,0.00121349,-0.0142166,0.01283466,0.01326492,-0.01529675,0.02680111,0.00199173,0.01602444,0.01249736,-0.02948821,0.00658376,-0.00529978,0.04044576,0.0058587,0.00569705,0.01463855,0.02622555]
4	20	Nom : Robe Mariée Prestige | Catégorie : TENUES | Genre : Femme | Couleurs : Blanc | Tailles : M,L,XL | Description : Robe de mariée haut de gamme | Badge : Best Seller	[-0.06794168,0.05292124,-0.04581348,-0.04545027,-0.0581321,0.1124,0.0191923,-0.03582347,0.10897202,-0.07359262,0.04218915,0.05790391,0.00252592,-0.00011233,0.03499847,-0.07610915,0.00469545,0.00524976,0.07081797,-0.1015891,-0.01132087,0.06933251,0.08922687,-0.09777666,0.0675177,-0.05924619,-0.00929335,0.00621371,0.06468894,0.05920922,-0.00725036,-0.0726153,0.0107543,0.04801033,0.01668769,-0.08125649,-0.03518197,-0.00546321,0.03697443,0.00966589,0.01206093,0.02344585,-0.01465762,-0.03621039,-0.01305597,-0.09537438,-0.03938073,0.05678141,-0.03123261,0.05072036,-0.01326757,-0.05020205,-0.07212707,0.03879462,-0.08285622,0.04010867,-0.00198161,-0.01042617,-0.03541453,-0.02559615,-0.03660491,-0.0494694,0.05967099,-0.00126436,0.04254632,-0.0768661,0.01178323,-0.02685143,0.11009049,-0.00505167,-0.06615064,0.08217062,0.00019892,0.03412542,-0.00394526,-0.0225684,-0.03113625,0.01478386,0.00693936,-0.01246621,-0.13587962,0.02769116,-0.01105342,0.00695274,0.00489243,0.02203181,-0.00643519,-0.02351256,0.0143809,-0.03882058,0.00424078,0.10172084,-0.04467763,0.00206797,-0.05086513,-0.0886784,-0.04009931,0.02580367,-0.0039908,-0.01992654,0.01190134,-0.00242084,-0.00530825,0.005106,0.09317107,-0.04298952,-0.10589894,0.01958477,0.07121145,0.03453388,-0.05169263,0.03435219,0.04215731,-0.01039786,0.02626847,-0.00192731,-0.01971045,-0.04713628,-0.04946806,-0.02363199,0.04760372,-0.04491406,0.01339591,-0.03568087,0.05417224,-0.09302454,0.07228494,0.01057602,-0.04797789,0.0116927,0.01011881,-0.0192846,0.05008139,-0.00051075,0.02974173,-0.04396935,0.02967813,-0.05356197,0.08153141,-0.07901554,-0.02140246,-0.01934305,0.01918886,0.02827399,-0.03007848,-0.06190254,0.05693175,-0.0015646,-0.04177796,-0.04199893,-0.02323832,0.09695125,0.07466806,0.05156467,-0.0170418,-0.02466093,-0.00042055,-0.06110671,0.01653403,0.04173307,-0.01599319,0.03705122,0.04892731,-4.928e-05,-0.02194342,-0.02593197,-0.00741727,0.02091591,-0.04341264,0.03566877,-0.02336834,-0.00718212,-0.0029803,0.00402754,0.00351489,-0.06496184,0.02746627,-0.06582116,0.01748369,0.01570961,0.02520176,-0.04092484,-0.00696963,-0.02523293,-0.0061331,0.0361912,0.00437806,-0.03052185,-0.06277499,-0.00765031,0.05799469,0.04463343,0.0008956,-0.01796451,0.01018546,-0.02835991,-0.05467157,-0.0104665,-0.00199546,0.05991432,-0.04193794,0.00277948,0.02279361,-0.07814443,-0.00970386,-0.02480962,-0.0340015,0.05165457,0.02271513,0.01118739,-0.00431232,0.0018493,0.01337886,0.05870578,0.03515407,-0.03593503,0.05331748,0.01522553,-0.08218138,0.06644764,-0.03813422,-0.03022719,0.04893303,-0.02208491,-0.01640229,0.01036072,0.02513997,-0.0242514,-0.01584397,0.02632039,-0.04644035,0.03996446,0.0081283,0.02431016,0.00505803,-0.00322,-0.00889881,0.00992399,0.0290529,-0.0802402,-0.0740359,-0.03610701,0.01193553,-0.01417699,0.0140056,0.01918579,-0.02012661,0.01256878,0.00792455,0.01411356,-0.02029337,-0.07131788,0.01302631,0.01368477,-0.00375987,0.0015044,-0.03021224,-0.00334732,0.00936678,-0.02805444,0.0077284,-0.03908734,-0.0029821,-0.00364748,-0.00749908,0.02081496,0.0219822,0.04224528,0.02315901,0.03168215,0.01071108,-0.01192801,0.03629807,-0.02894263,0.01775095,0.00827928,0.00967935,-0.02286309,-0.0214724,0.01370893,-0.01578197,0.0107541,0.02417749,-0.02791915,0.01016587,0.00600098,0.05574562,-0.04705701,0.00161842,0.0068605,-0.06169417,0.04697864,0.02113028,-0.01860588,-0.00985573,-0.00469895,0.04473308,0.01241402,0.0504494,0.00250368,0.03514382,-0.0096871,-0.06110201,-0.01932509,-0.00032686,0.00074651,0.00428833,0.01023944,-0.00282144,0.00800103,-0.01559898,-0.01258297,0.0207269,-0.01319044,0.02312977,-0.02053862,0.02696911,-0.05304043,-0.02816637,-0.00415432,-0.02183873,-0.04511822,0.01073551,-0.001127,0.05256097,-0.01079561,-0.02723755,0.01541418,-0.02372101,0.00498725,0.03201894,0.04415385,-0.00979351,-0.04283988,0.00507047,-5.7e-07,0.00995046,-0.02114923,-0.02082135,0.01405269,0.01179921,0.00279601,-0.02680178,0.03443739,-0.02514574,-0.0187707,-0.01554201,-0.01103309,-0.03002303,-0.00096793,0.06774186,-0.01314679,-0.01884091,0.05649978,0.01562983,0.01014489,-0.00234968,0.03852811,-0.02168666,0.00459489,0.00642435,0.02083225,0.01183027,-0.01489221,-0.04637792,0.01980312,0.00605929,0.003936,0.03481346,0.00508597,0.01232744,0.00841508,-0.01678181,-0.04361109,-0.05535628,0.03618431,0.0152211,-0.04026764,0.00345669,0.01046037,0.0546385,0.03134147,0.02904265,-0.01791706,0.01314234,-0.02672411,-0.04079343,0.00338097,-0.00358795,0.03349352,-0.02207306,0.00254788,0.06156848,0.01068722,0.02426382,0.04107456,-0.01980396,-0.00947377,0.00398265,0.00724722,-0.02893465,0.01871658,-0.01176531,-0.03485866,-0.01420191,0.01574391,-0.00962963,-0.0086271,-0.0114461,-0.03921488,-0.02798317,-0.03615625,0.03046253,0.00068807,0.00417448,0.02668613,-0.00477479,-0.02825258,-0.05265036,-0.0442693,-0.02119313,0.00467146,0.03236162,-0.05313028,-0.04502581,-0.00658166,0.00487186,-0.02856221,-0.05639089,0.05510792,-0.03391462,-0.01463909,0.0455158,0.01397329,-0.00310414,0.05991163,-0.01754682,-0.01561161,-0.08319498,-0.02311288,0.05882677,0.02019421,0.03783881,0.00786023,0.03665851,0.03457131,0.02803645,-0.06274945,0.0190783,-0.02009206,-0.01087297,0.00850899,0.06336447,0.00067035,0.01761726,0.02147275,0.02423546,0.02211188,-0.02554486,-0.01082449,0.03201168,-0.02628116,0.04126666,-0.02654285,-0.01591852,0.00943792,-0.03635821,-0.00466545,-0.03599577,-0.01673676,-0.04942739,0.01551046,-0.008128,-0.03175382,-0.00202928,0.00195727,-0.04643304,-0.01606478,-0.01388598,0.05866911,0.07533214,0.0063224,-0.00842263,0.02281865,0.03015872,0.05721629,-0.00272037,0.00706804,0.03237119,-0.0201728,-0.00992878,-7.921e-05,-0.02093759,-0.04462487,-0.03386841,0.03042304,-0.00688603,-0.02440157,-0.07614612,0.00483642,0.05923544,0.04175066,0.00538016,-0.00619456,-0.003462,0.01082989,0.00831013,-0.00188992,0.0501923,-0.01335621,-0.04038879,-0.00800154,0.04614696,0.02830391,-0.0038595,-0.03484799,0.00660623,-0.00815459,-0.02359843,0.01126447,-0.00535306,0.01586048,0.01364251,0.00241956,-0.03909557,-0.05327614,-0.02093536,0.00381157,-0.00425681,-0.00139956,-0.03386303,0.01647395,0.05467287,0.01238596,0.02203628,-0.01002556,-0.00948323,0.06421878,0.02656629,-0.02813504,-0.00411996,-0.01399833,0.00527211,-0.04646253,0.00541881,0.00133756,-0.01095831,0.01439616,-0.06182928,0.00467444,0.03520734,-0.04311933,0.00331497,0.02432862,-0.04072122,-0.00111381,-0.01888214,0.01717755,-0.00590645,-0.00069044,0.04769282,-0.01252577,0.00463038,0.00095219,0.03503317,0.01332223,0.01964894,-0.02399063,-0.02095262,-0.00202498,-0.00671906,0.02734332,-0.00279785,-0.00840848,-0.00910321,0.02579189,0.05880459,-0.0486645,-0.01720324,0.0316046,-0.01344191,-0.00932519,0.0248935,0.03968656,0.0149343,-0.01877342,0.05704086,-0.02192008,0.01963886,-0.00325742,0.01374386,-0.01241264,0.01182556,0.01817954,0.02124031,-0.03436975,-0.01359865,-0.00965517,-0.01012857,0.00052,0.02060122,-0.02146464,-0.0325883,-0.01328631,-0.02311397,0.00572136,-0.00082928,-0.0231543,0.02332537,0.04094685,0.0310447,-0.02993279,-0.01030544,-0.01246105,-0.01213508,-0.03407922,0.00240223,0.05391174,0.04601874,-0.00601667,0.03624464,0.00354037,-0.00785152,0.03601123,0.00098057,-0.01633609,0.02743793,0.00078857,-0.00773328,-0.04473712,0.00082406,-0.03822035,0.01729452,-0.04709032,-0.00208149,-0.02067427,-0.00162664,0.0090094,-0.04075243,-0.01436978,0.004426,-0.01009544,0.00313857,-0.00570923,-0.00057821,0.01198497,0.00384538,0.02500334,0.02520568,-0.01343297,0.0175846,-0.00425388,0.01779817,-0.01672666,-0.00285956,-0.00885349,0.04670198,0.00919948,0.03296806,-0.017374,0.01298052,0.02784475,-0.03744086,0.04970718,-0.02350109,-0.03396806,-0.04755747,0.03082415,-0.03499275,0.00380901,-0.00482429,-0.00421821,-0.00129532,-0.02995934,0.03078038,0.01761031,-0.00769487,-0.000366,-0.01081325,-0.01147423,0.02481519,0.04009569,-0.02844994,0.04293963,0.00055824,-0.03023845,0.00480753,-0.00246781,-0.02712068,0.03138649,0.02458901,0.02025998,0.0482944,0.03520667,-0.03190741,0.04166504,-0.04570216,0.02883391,-0.02430267,-0.03849853,0.01406479,-0.01200281,0.00783881,0.01129296,-0.004137,-0.04745631,0.00439843,-0.01311597,-0.01042878,-0.00113411,0.04761359,-0.01748621,-0.00434912,-0.00540266,0.02297164,-0.00059943,-0.01108979,-0.05407734,-0.0277559,0.01623341,-0.00804769,0.02764144,-0.01585915,0.01114941,0.0247626,0.02236463,-0.02085143,-0.00777765,-0.04569896,-0.02642634,-0.02020826,0.00255691,0.01314846,0.01647878,-0.0589128,0.03701005,0.03536434,0.0098906,-0.0039279,0.04488453,0.01681343,0.00534562,-0.04086165,-0.03601308,-0.00486928,0.01749301,0.01795109,-0.00434293,-0.00230975,0.00509632,0.01216757,-0.00267214,0.00883207,0.00737337,0.01232996,0.00158611,0.02920434,0.00164371,-0.06758357,-0.00423297,0.00664339,-0.01055523,0.0309706,-0.00688267,0.02574186,0.00756226,0.02564169,-0.02063525,0.05188747,-0.00845118,0.05133967,0.01562922,-0.02422605,-0.02245753,0.023179,-0.04594531,0.02111638,-0.01171449,-0.0073605,0.00051071,-0.00110544,0.0162387,0.0155647,0.01333776,0.0380781,0.03065014,6.66e-05,-0.02266641,0.00681516,-0.02431965,-0.0157487,0.00431262,0.00812464,0.01115802,0.03947269,-0.00538453,0.00699837,-0.00324723,-0.01214603,-0.01648974,0.00992074,-0.01940621,-0.02492811,0.02478322,-0.00840136,-0.0187228,-0.03758609,0.02064493,0.01276951,0.01025276,-0.00430553,0.03987275,0.02417904,0.03878638,0.02094931,0.01996131,0.0111663,-0.00154131,0.00874238,-0.01820331,-0.00990316,0.00929476,0.01833217,0.01243868,-0.02170481,0.00702018,0.02926013,-0.00897092,0.02720377,-0.0262315,0.03156619,-0.03619876,-0.02769332,-0.01871549,0.00546123,0.00750836,0.01147402,-8.423e-05,-0.00893937,-0.0231441,0.00736763,0.02998152,0.00365756,6.991e-05,0.01520199,-0.0084118,-0.00660542,0.00517173,-0.00343417,0.01791151,0.00115572,0.01934135,0.009548,0.00060031,0.00320602,-0.01239041,0.03436446,-0.01265685,0.00310631,-0.04345145,0.02183667,0.04006162,0.00843392,0.02391781,0.01585007,-0.04024814,-0.00011095,-0.02139533,-0.01387267,-0.00852001,-0.00117601,-0.00534437,-0.03826703,-0.04218764,-0.00021373,0.01743372,0.01009564,-0.05621815,-0.01098137,0.00917112,-0.01383857,-0.00161342,-0.01335117,0.02344997,-0.01250313,0.01107849,-0.02733929,0.00241256,0.02677955,-0.0086577,-0.00515373,0.04696261,-0.04025571,0.02327395,0.0043146,0.01588548,-0.04267461,0.00342255,-0.01242037,0.02506926,-0.02466358,-0.02800859,-0.02042641,0.00355871,-0.01440784,0.02128169,0.01635811,0.05022457,0.00269927,0.00568007,0.02746399,0.01264587,0.00561606,-0.02377537,0.01823297,-0.05209248,0.03446326,0.00829136,-0.01371896,-0.00879323,-0.00217409,-0.03093749,-0.00159077,-0.01733323,0.00026903,0.00914766,-0.02615618,0.01941201,-0.03183137,0.00372926,-0.0245491,-0.00561179,0.01730397,-0.02513904,0.04273007,0.04099079,-0.02609554,-0.02176362,0.00078768,0.00364237,0.05577721,-0.01648917,-0.003405,-0.00826046,-0.00891484,0.02767255,0.00616544,-0.03083192,0.0484195,0.04511386,-0.0086806,-0.02011901,0.00288732,0.00730747,-0.0192286,0.06558055,-0.01126307,-0.02986877,0.00671178,0.01084227,-0.00193458,-0.00592183,-0.00778033,0.01894554,0.01545782,0.02675805,0.03217862,0.00327601,0.01926901,0.01514664,0.03739927,-0.02995111,-0.02102719,-0.03660642,0.0153633,-0.00609287,-0.00753088,0.00025771,-0.02069876,0.0058394,0.0378289,0.02180689,-0.01678341,-0.02848245,-0.00083788,0.02260423,-0.02977963,-8.12e-06,0.00659197,0.02580947,0.0254928,0.0032383,0.01873234,-0.04130376,0.02527786,0.02827711,-0.00976983,-0.03545133,0.04350435,0.01116042,-0.01593774,0.02154114,0.02880534,-0.00058923,0.00484676,-0.00513949,-0.01474868,0.01461171,0.0090225,-0.0218768,0.02354733,-0.02766206,0.01466435,-0.01815643,-0.02386443,-0.00870928,-0.01462276,0.02189503,-0.02932101,0.04017908,-0.0151901,0.01009409,0.01904123,0.02604338]
5	21	Nom : Sac à Main Chic | Catégorie : ACCESSOIRES | Genre : Femme | Couleurs : Noir | Tailles : Unique | Description : Sac élégant pour sorties | Badge : Nouveau	[-0.08977219,-0.05580131,-0.01384158,-0.0673563,0.04567345,0.12480775,0.01085375,-0.01927512,0.05889731,-0.03274287,-0.05386008,0.02194513,0.01053283,0.02844271,-0.01404145,-0.01595179,-0.0219956,-0.05114014,0.01763942,0.01252156,-0.09695491,0.00799654,0.09775218,-0.08326782,0.09201863,-0.0728113,-0.00311856,-0.10056095,-0.04124445,-0.02340008,0.0473078,-0.06813816,-0.11460042,-0.00391726,-0.03339221,-0.00476927,0.02391319,-0.03425591,0.0547381,0.09725443,-0.04820509,-0.02661123,0.02178912,-0.0100831,-0.09688443,-0.07223551,0.0618151,-0.03276563,0.03328264,-0.04454087,0.02450026,0.00170942,-0.01420709,-0.00432156,-0.06684168,-0.00769248,0.00749678,-0.02196022,0.08989112,-0.03860049,0.04829108,-0.0893091,0.05201008,-0.06480742,-0.03725088,-0.08968557,-0.03698968,0.01351298,0.04337315,-0.00088137,0.02399793,-0.06025398,0.02126172,0.03886762,0.02776071,-0.00808106,0.05361855,-0.01002187,0.00017266,0.0394947,-0.07677142,-0.02101503,0.02669585,-0.02596801,-0.07057913,0.01315513,0.06654216,0.02869191,0.00538355,-0.0108245,0.01247741,0.0254616,-0.01878534,0.0250192,0.02091918,0.04966014,0.01033367,-0.06334797,-0.04940943,-0.02192044,0.00329335,0.00342242,-0.09175581,-0.00984689,0.09292491,0.02691761,-0.06004438,-0.03207206,0.05077564,0.04291157,-0.03073687,0.06392939,-0.02114552,0.05226409,-0.07680748,0.01722283,-0.04229756,-0.05588041,-0.02482564,-0.03584347,-0.00815913,-0.02241446,-0.02775089,-0.07613796,-0.00364963,-0.0223126,-0.00362519,-0.01790907,-0.1256887,-0.04017953,0.03982391,0.00778375,-0.01012501,-0.01398607,-0.02457055,0.01911833,-0.01965194,-0.03792803,0.04262223,-0.07341874,-0.07521296,-0.05702932,-0.00899028,-0.04611595,-0.00183312,-0.01725065,-0.03680628,0.03508089,0.04325105,-0.01840509,0.01754675,0.01776683,0.0117508,0.00640467,0.02503264,0.03417479,-0.00682607,-0.00630984,-0.0003003,0.01524285,-0.03321969,0.06199643,-0.00764627,0.0367079,-0.00335712,0.04281824,0.01117773,0.03884752,-0.0051684,0.04244957,0.0122748,-0.04467081,-0.05367169,0.017245,0.0231105,-0.01423746,0.02575278,-0.0809821,-0.02470967,0.03146737,0.00017807,0.03612044,-0.02828506,0.02593566,-0.02377384,0.0292041,-0.00516292,-0.00874352,-0.02145629,-0.00260938,0.02779583,0.08557298,-0.01163337,0.00680932,-0.02675417,-0.04446948,0.06122321,0.05963373,0.01866242,-0.03295201,-0.03579235,0.06507684,-0.00182463,-0.02093753,-0.00599239,-0.01703681,0.00549229,0.10511548,0.05086851,-0.02931835,-0.03052066,0.06657483,0.04934483,-0.03285556,0.04786446,-0.05286103,0.01012997,-0.06668458,0.03063995,-0.01516962,0.06847328,-0.00017747,0.01856978,0.05382999,-0.04964619,0.03565177,0.01123857,-0.05623132,-0.02664433,-0.01199496,0.0491066,0.02156879,0.05269135,-0.00450939,-0.06657813,0.03367742,0.02227503,-0.05908763,0.03427574,-0.06476042,0.02932954,-0.00562237,0.00900854,0.01737178,0.01944693,0.02546417,0.05859375,0.02938919,0.00486943,0.03827857,-0.0450153,-0.00304169,-0.00122824,-0.0182807,-0.02399824,0.02090417,0.00049545,-0.02623538,-0.02248173,0.01552767,0.02944801,0.00322874,-0.05960244,0.00075342,-0.02135654,0.04574943,0.05559704,0.05285084,-0.0045663,0.07292101,0.04283053,-0.03301198,-0.00734459,-0.00242262,-0.02592539,-0.00089797,0.026731,-0.04513405,0.03291613,-0.02176508,0.01943415,0.01738504,-0.0051021,0.00358025,0.01464087,0.02039105,0.03435081,-0.02231017,-0.02245874,0.00226176,-0.04095254,-0.06637361,-0.01389321,-0.0023075,-0.00961102,-0.02970643,0.00118841,0.00971038,0.01966667,0.00355963,0.02586579,-0.00564673,-0.00099419,-0.04378123,-0.00553372,0.0297636,0.04587056,0.04373819,-0.00723799,0.01800919,0.03382681,0.03013083,-0.05283083,-0.03486593,0.05280367,-0.01033323,-0.00099022,-0.03434823,-0.06164846,-0.03736917,0.00706994,-0.00606762,-0.0127819,-0.01524385,-0.00390774,-0.01563274,-0.00381609,-0.01320826,-0.00975379,0.02101627,0.04125968,0.02556576,-0.00484984,-0.04297782,0.02031903,0.01250423,-0.01130021,0.00177923,-0.06288362,-0.01598753,0.01840176,0.01608183,0.00800148,-0.02580558,0.00834808,0.02245865,-0.01207986,-0.00560989,-0.02307509,0.0357194,0.05311751,-0.04016033,0.00641069,0.05228823,-0.0194228,0.0176107,-0.03975945,0.011212,-0.01595828,0.03155616,0.00487682,0.03756279,-0.00919824,0.00531583,-0.03467354,0.00638845,0.00247866,-0.01950607,-0.01372775,-0.02017762,0.00997312,-0.06742091,0.0302052,-0.02690196,0.02878298,-0.05165219,-0.00247876,0.00515402,0.02477794,0.01944085,0.06169103,0.02521879,-0.01007256,-0.02880781,0.00432054,-0.00082057,-0.03682296,0.02763508,0.00169965,0.03773293,0.00859793,0.03255255,-0.00415398,0.0774359,0.04511349,-0.01437314,0.00077937,0.02876793,-0.03086057,-0.00630818,-0.00946916,-0.01966731,0.03609126,-0.00104517,-0.01763102,0.03712353,-0.00410185,-0.03978062,0.0249735,-0.01354119,-0.04632719,-0.01070581,0.00812318,-0.00264383,-0.01900977,0.05910892,-0.0258138,-0.02286572,-0.01367395,-0.08133558,-0.02636137,-0.00862367,-0.03448624,0.02826831,-0.02664887,0.02716485,0.00853113,0.02104678,0.0097245,0.01745446,-0.02682947,-0.04475513,0.00055926,0.00021336,-0.00707342,0.01144975,0.01250533,-0.04780609,-0.01410564,-0.02450815,0.03057215,0.0468609,-0.02323967,-0.00514491,-0.0038829,-0.03051655,-0.05055504,0.01004178,0.02101434,0.00629811,0.0512275,-0.00672765,0.00464492,-0.00173282,0.00574861,0.00971234,-0.00758436,0.01257169,-0.05097496,0.02845841,-0.01097754,-0.04021704,0.04557324,-0.0196161,-0.01089809,0.01657103,-0.0115208,0.04398826,0.0134463,-0.01182117,-0.02166194,0.04334589,-0.00816356,-0.01525682,0.00776571,-0.0323402,0.01424936,0.00946357,-0.00889375,0.06699584,0.0927601,0.05051797,0.00772898,0.03428491,0.05494807,0.0057652,0.03742808,0.01607219,-0.01116793,0.00070351,0.056547,-0.00819776,-0.04347033,-0.02579315,-0.01806929,0.03577152,-0.05941451,-0.0082631,-0.04447792,0.08061907,0.03514696,0.00600169,0.03659338,-0.02999778,-0.01954416,0.02114942,0.03995807,-0.0003032,0.02083843,0.0151437,0.01043784,0.0221806,0.00010604,-0.00276718,-0.07793511,-0.01803621,0.02720415,0.01398286,-0.02988087,0.04448306,0.01390394,-0.00781196,0.00529766,-0.01041005,-0.02851264,0.01676943,0.0340018,0.00464607,0.02959796,0.02728004,-0.0078964,0.05021807,-0.00086434,0.00457546,0.03590183,-0.00605991,0.02088463,-0.03096669,0.01741211,-0.04119673,-0.01852666,-0.00740172,0.00901753,0.02059745,0.01346134,0.0023783,0.00144121,-0.02399215,-0.04061347,-0.02239129,0.00737244,0.02687384,0.05083694,0.00459119,-0.05743034,0.01665518,-0.00637031,0.00630883,-0.01573109,-0.03012791,-0.06543436,-0.01695702,0.00471753,0.01185343,0.01792238,0.0227495,0.03669487,-0.00809845,-0.02228126,-0.01255842,0.00495514,0.00616985,0.00529568,-0.00988734,-0.00497251,0.03503281,0.0367035,-0.00748255,-0.00594687,0.00604838,0.01093402,-0.04534438,0.02563871,0.01995472,0.03114862,-0.05360681,-0.01632721,-0.05612983,-0.00329193,0.01895428,0.00284135,-0.03871042,-0.0149004,0.02660542,-0.00306499,-0.01486296,-0.01148114,0.00734825,0.03116013,0.0091589,-0.02189075,-0.02987394,-0.00641206,0.00038085,-0.02663236,-0.01098369,-0.04101393,-0.04645438,0.04315943,0.02784387,0.02250398,0.00245986,-0.0200292,0.00871191,-0.01066157,-0.0080437,0.01019924,0.00305884,-0.0361384,-0.0287694,0.0005795,-0.01291735,0.01194923,-0.00018039,-0.01332187,-0.01969809,0.0071788,0.02620885,0.02677675,-0.01862047,0.04925122,-0.03628982,-0.00407845,0.00509095,-0.00684455,0.03734257,-0.01272858,-0.01884563,-0.05245716,-0.0306229,0.0034399,-0.0291372,-0.00291311,-0.02301296,0.02871976,-0.00525544,-0.00255864,0.03484358,0.04330377,0.01180579,-0.02401959,-0.03171248,-0.0027116,-0.00227876,0.02100676,-0.04241465,0.02029049,0.01309062,0.04505825,-0.0289194,-0.00994159,-0.00701722,-0.01307281,0.01185971,0.01077403,0.03644536,-0.03044294,-0.00520832,-0.02242341,0.03842283,-0.07165977,-0.03660604,0.01054502,-0.01810007,0.02553355,-0.00271969,-0.01455557,-0.00825736,0.04014362,0.02000496,0.01497299,0.01268332,0.00709251,0.03760996,0.04958158,0.01923371,-0.00977897,-0.01530989,0.00803541,-0.03902922,0.03934636,0.01187825,0.04213458,-0.00358867,-0.0291102,-0.01735425,-0.02615655,0.01916718,-0.00254722,0.00328256,-0.00230431,-0.01148386,0.00712403,0.01478881,0.00389962,-0.01515208,0.01460635,-0.0078917,0.01920946,-0.01993655,-0.02812488,-0.00697826,0.03630755,-0.01941238,0.01532989,0.00491577,-0.00218573,-0.01642915,-0.00526771,-0.01142355,0.00456451,0.01217149,0.00690407,0.00946154,0.00448284,0.00576982,-0.02547995,0.04370074,-0.04705297,0.01325128,-0.01931573,0.01204329,0.00315334,-0.05081492,-0.01347617,0.04570024,0.02502773,-0.01511406,-0.01708213,0.03201072,0.00378137,-0.00904664,-0.03237966,-0.02482419,0.01444788,0.01121333,-0.00210889,0.00516337,0.01128,-0.03807558,-0.01867917,-0.00226093,-0.00460498,-0.01389192,-0.00510899,0.01198224,-0.00015091,-0.02911242,-0.0697716,0.00756843,0.02453711,-0.03425463,-0.00478425,0.00976707,0.0077639,-0.00132657,0.02718332,-0.02596209,-0.01296644,0.02109115,0.02105128,0.04785932,-0.00294473,-0.02345174,0.02041447,-0.08763882,0.00732993,-0.01849782,0.01025303,0.02985958,0.00246444,0.02449494,0.01806186,0.03284308,0.03007175,0.0126573,-0.01490024,0.0194036,-0.01595248,-0.03600864,0.00046142,0.01623562,0.01011636,0.00133382,0.00691748,0.06315691,-0.00043876,0.01565468,0.01142407,-0.0153722,0.02614521,0.00902701,0.01010664,0.02643524,-0.02671944,-0.02230889,-0.07468677,-0.00781928,0.04874688,-0.01631709,0.02873435,-0.00192943,-0.02352846,-0.00379524,0.04022144,-0.00023497,0.00316632,0.01578152,-0.00441191,-0.00913983,0.00661305,-0.00183209,0.02143835,0.02635742,-0.01198103,-0.01680366,0.01947804,-0.04247907,-0.00362031,-0.00769213,0.01012308,-0.00899768,-0.01140552,-0.01770957,-0.00544994,0.03613932,0.01334572,-0.01932997,-0.02311881,0.03715905,-0.00156821,0.01452474,0.02235771,0.00398324,0.01735388,-0.01822447,0.03579125,0.0112572,-0.01472148,0.0060339,0.02535827,0.03546447,-0.00576438,-0.00085106,0.00283465,0.02570295,-0.0422113,-0.00060818,-0.00104658,0.01485327,0.04511111,0.02976543,0.01769948,0.02076165,-0.02800774,-0.02130909,-0.0062604,-0.00843881,0.02229237,0.00628722,0.00553604,-0.02074212,0.01438172,0.00425172,0.03481972,0.06402924,0.02070757,-0.02249833,-0.00998262,-0.00068664,0.01752741,-0.04355035,0.02382156,-0.00726271,0.00660099,-0.01075393,-0.03484046,-0.04196885,-0.03076476,0.01381401,-0.00451781,0.04163941,-0.02560327,0.01441294,0.01782501,-0.00250698,-0.02467021,6.768e-05,-0.00349959,0.01646889,-0.01409952,-0.03514751,-0.01147215,0.00620834,0.00840972,0.00267053,0.03107952,0.01889573,-0.03618777,0.01291314,0.02385909,0.0310129,-0.0212845,-0.01809678,-0.00021556,-0.0543988,-0.01680349,0.00193569,-0.0042026,0.01284273,0.01918508,0.00806889,-0.03268873,0.00399586,0.01637474,0.00207933,0.01016369,0.02827276,-0.01631059,-0.01069667,-0.00816762,-0.00136887,-0.00501043,-0.03350398,0.03692594,-0.00044996,-0.0065221,-0.01489855,0.01658269,-0.01372326,0.01163609,-0.01352421,0.0204319,0.02067332,0.02270256,0.01751186,0.02325243,0.00847451,-0.00434655,-0.00487695,0.05522924,-0.01651946,0.00840027,0.00342105,0.01776796,-0.0187312,-0.0274097,0.02055927,0.01735393,0.01176909,0.0279949,-0.01060697,0.00677393,-0.02129533,0.02901534,-0.00735818,-0.00238729,0.00557896,-0.03090737,-0.02506811,0.0027609,0.01324591,-0.02447402,0.00100537,0.01039825,0.01888913,-0.01797578,0.0050336,0.00116642,-0.00744016,0.03221384,0.04569804,0.01548576,0.01308481,0.02197139,0.0289489,-0.01544747,0.01821745,-0.01081496,-0.00055426,-0.00889775,0.03603471,0.00798122,-0.01758532,0.00122466,0.00854275,-0.01456534,0.0385491,-0.01610988,-0.00655393,-0.00318136,0.00710629,-0.01767405,-0.01071865,-0.00407297,-0.01265864,-0.01882811,-0.02528674,0.00430146,0.00908343,-0.00222758,-0.01974425,0.02157698,0.02719323,-0.02769666,0.02202735,-0.01693584,0.00741734,0.02239533,-0.00106802,-0.02551134,-0.00868107,-0.0535406,-0.00681377]
6	22	Nom : Pochette Soirée | Catégorie : ACCESSOIRES | Genre : Femme | Couleurs : Doré | Tailles : Unique | Description : Pochette pour événements | Badge : Promo	[-0.07196416,-0.0048208,-0.03099819,-0.04213968,0.03546938,0.08274382,0.02519845,-0.08148788,0.17551419,0.01294386,-0.01159244,0.01240247,-0.01741458,0.00602798,-0.00937766,-0.01242518,-0.05659341,0.02386243,0.08974866,-0.01156118,-0.0021428,-0.02355219,-0.04283512,-0.07615763,0.02502454,-0.07892667,0.01545966,-0.07247055,0.02211131,0.00956755,0.03594166,-0.04791021,-0.03649581,0.07933933,-0.05091927,-0.00046819,0.08673441,-0.05845219,0.08671647,0.01155621,0.00620474,-0.02720404,0.01275623,-0.06269966,-0.09689105,-0.01388754,-0.03315188,0.06869078,0.0022171,0.01133908,-0.04441531,-0.08067601,0.00729532,0.00474102,-0.0348301,0.02339613,0.04504833,0.04975994,-0.00104028,-0.02683368,0.11670645,-0.10934576,0.0170158,-0.00365292,-0.01492077,-0.09605899,0.0629815,-0.03769512,0.09512228,0.01050811,0.00566605,0.01422891,0.00770058,-0.00898516,0.03852437,0.01339834,-0.04417198,0.08449765,0.01071516,0.00773177,-0.09564143,0.0161266,0.01179866,0.00137299,-0.08663872,0.07694894,-0.00821592,0.00509682,-0.01082049,-0.06450807,0.03281248,0.08279466,0.00823326,0.010441,-0.05551241,0.02438627,-0.05532664,-0.00671602,-0.03434511,-0.02725645,0.00569428,-0.01787636,-0.03211975,-0.03433948,0.05886457,0.0012541,0.00690448,-0.08155965,0.07278276,0.00944065,-0.02611417,0.00065809,0.05864441,0.03680905,-0.07204967,-0.03350057,-0.06463908,-0.10732879,-0.01656045,-0.04005449,0.02911497,-0.01819207,-0.12768692,-0.04569499,0.01013873,0.00662177,-0.00990478,-0.02297209,-0.04655471,-0.02876131,0.03772446,-0.0329276,-4.532e-05,-0.06647495,-0.04524373,-0.00756789,-0.00189512,-0.03406112,0.07606792,-0.01160546,0.01415738,-0.04170094,0.02513687,-0.0329319,-0.00886091,-0.0575664,0.05767031,0.06305551,0.00063396,-0.04901593,0.03224506,0.02307994,0.04666853,0.01163629,0.0089833,0.00592745,0.03531706,0.03337115,-0.05956618,-0.0142697,-0.00269414,0.09028692,0.00793513,0.01418181,-0.00565325,-0.00721832,0.04158347,0.01927499,-0.03476497,0.03489038,0.04922301,-0.03892573,-0.01783206,0.02492605,0.04179354,-0.02231473,0.00254653,-0.06868364,0.0340871,0.01571136,0.01855965,-0.04416487,-0.01588073,-0.05200252,-0.01021539,0.01022785,-0.05778207,0.00321806,-0.0034334,0.01359519,-0.02137616,0.00478812,0.00277498,0.00334725,0.00013203,-0.03104856,0.03189099,0.02243062,-0.04276241,-0.00061038,0.05448038,-0.02044785,0.00868979,-0.03351719,-0.04081679,0.01657748,0.00645864,0.07038929,0.0510658,0.00617876,0.0002613,0.0437866,-0.01594274,0.05901072,0.03596484,-0.03247429,0.04972875,-0.01324546,0.01107463,0.00185176,-0.01472226,0.04041197,0.04111212,-0.00273137,0.02346825,0.06228644,0.00734249,-0.01977419,0.00814397,0.02084788,0.01195257,0.03723704,0.0309367,0.00897159,0.00140327,0.04330142,-0.01280986,0.00916442,0.05293999,-0.01383386,0.01414614,-0.00077842,-0.00625464,-0.04103176,0.09268217,0.08688094,0.00321722,-0.01979422,0.02634945,-0.01168188,-0.02092014,-0.00997089,-0.02785302,-0.00999895,-0.02887954,0.00801646,-0.00504571,-0.03607791,0.01580224,-0.02419809,0.04171524,0.00319743,-0.00934048,0.01616659,0.0679604,0.01882868,0.05858497,0.00924403,-0.00734376,0.03528506,0.00302109,0.00453363,-0.03807956,-0.02770276,-0.02449479,-0.00225931,0.01520921,-0.01176586,0.0215689,-0.04264355,0.01686226,-0.02630702,0.0104953,0.00572288,0.02445405,0.01759692,0.03658888,-0.0502229,-0.04747292,0.00748034,-0.03328682,-0.01777613,-0.0220687,-0.0444213,0.01114139,-0.00048221,0.00312503,0.00453346,-0.02592449,-0.02026427,-6.162e-05,-0.01731277,-0.02829764,-0.00716182,-0.03661224,-0.01074022,0.00367679,0.04560883,-0.02767575,0.02249613,-0.02361292,0.03758036,0.00612664,-0.01463005,0.04601701,-0.00995559,-0.00565313,-0.02997409,-0.03477899,-0.00440854,-0.00219242,-0.03053721,-0.01492404,-0.006781,-0.00503539,-0.00614904,-0.03285845,0.01519114,0.04330006,0.01547302,0.04742246,0.00730874,-0.02446984,-0.07631163,-0.02982626,0.02168061,-0.06121647,-0.00809362,-0.04026876,-0.01920463,0.00525215,0.01539097,-0.02484383,0.00586952,-0.01784458,-0.0332528,-0.00911161,0.03333036,0.01151732,0.00116539,0.01106421,-0.00982764,-0.00745238,0.01517665,-0.01852245,-0.03918608,-0.03205411,-0.01281588,-0.02333697,-0.00050013,-0.02290496,0.06651532,-0.02393191,0.00559172,-0.03842438,0.02911008,0.02560915,0.00457791,-0.02782181,-0.02402379,0.00544764,0.01205399,0.00121912,-0.05570538,0.03961715,-0.01134693,-0.01239172,-0.0439206,-0.02213489,0.00420666,-0.00178195,0.01508895,-0.00434182,-0.01193953,0.0005605,-0.05270898,-0.05493145,0.03792892,0.00599,0.00462539,-0.00507705,0.01323989,0.00332792,0.03603441,-0.02632505,-0.03150325,-0.0218034,-0.0087896,-0.03347801,0.00699796,-0.02537553,-0.00712728,-0.0536315,0.00737214,-0.0258224,-0.02366539,-0.05849527,0.02192722,0.00482802,0.03246022,0.00890164,-0.00533586,0.06189751,0.00956727,-0.01372064,0.04361872,-0.06779219,-0.04890791,-0.02096746,-0.03407297,-0.01889081,0.02870881,-0.05609852,0.0120955,-0.04576993,0.02281857,0.00429841,0.0097729,-0.01540971,-0.01691497,0.01993536,-0.02561855,-0.02074347,0.02399163,-0.03811189,0.00784353,0.0284602,-0.04517673,-0.01312805,0.00237493,0.03930335,-0.00090477,0.01027957,0.00186634,0.01018155,0.0137206,-0.03921888,-0.02814415,-0.00343476,-0.00377676,0.11211331,-0.0574651,0.03706023,0.01200726,0.00891201,-0.00955961,0.01232687,0.02779063,0.00776029,0.0459359,-0.01510283,-0.03290779,0.03552711,-0.03970499,-0.02611578,-0.01317357,-0.03054011,-0.02344093,-0.03792033,-0.00769969,-0.04021615,0.02770128,-0.02035889,-0.0685022,-0.01208902,-0.05468372,0.02701414,-0.00817456,-0.00490734,0.03805451,0.11576151,0.02378949,0.01262875,-0.02495947,0.05930714,-0.01668303,0.01883831,0.02057393,-0.05463027,-0.03046077,0.02826195,-0.04384192,-0.02613153,-0.05975623,-0.02141008,0.02237698,-0.06827662,-0.00160081,-0.00841004,-0.00770704,0.08156115,0.04299353,0.03572524,-0.02079741,0.00991024,0.00336856,0.03067944,0.03831075,0.07683344,0.05357394,0.01886765,-0.04908602,0.00724792,-0.01127605,-0.04275456,0.02386168,-0.00206968,-0.00398074,-0.01849881,0.0313145,0.00418113,-0.00085257,-0.04176402,-0.00888866,-0.02494729,-0.00896855,0.03897965,0.03048731,0.00425081,0.00394726,-0.02436542,0.01872225,-0.00418337,0.02666724,0.02550613,0.01227774,0.03903684,0.02790516,-0.00792087,-0.01068023,-0.025386,0.0185719,-0.00057303,0.0057154,-0.00618776,0.00167182,0.00857443,-0.02193136,-0.00420243,0.02075997,0.01870262,0.06183247,0.0097903,0.04205109,-0.03706136,-0.00455473,-0.01205994,0.04486312,-0.00282516,-0.00068556,0.00863788,-0.04621362,0.04543801,-0.00535409,0.03286955,-0.00190783,0.03443678,-0.03947214,-0.03790771,-0.01926863,0.04200547,-0.00126551,0.00466883,-0.02930894,-0.03599511,-0.00797898,0.03566525,-0.040649,-0.00682276,-0.00228329,0.00473073,0.00743818,0.03131675,0.05585929,0.03974349,-0.01790652,0.01444926,-0.04259196,0.00804918,0.02909849,-0.00190043,-0.0186159,-0.0128427,0.00421538,0.00723101,-0.02405012,-0.0082761,0.01873639,-0.02831367,0.01146678,-0.00093743,0.00854649,-0.01299661,-0.00512974,-0.05157416,-0.04624091,0.06840446,-0.00475789,0.03345558,0.01690531,-0.00781754,0.01717868,0.00176742,-0.02511687,0.00065881,-0.01072597,0.01249807,0.01320579,0.01345911,-0.03334662,0.03907871,0.01559067,-0.0012198,0.01408995,-0.00445833,0.0274321,-0.02739326,0.01128376,0.00614007,-0.02056292,0.01610975,-0.01125115,-0.00172257,0.02158885,0.01073688,0.00445404,0.00074898,0.00421776,-0.0504255,-0.03948614,-0.03679671,-0.02698797,-0.02062263,0.02371305,0.01861343,0.03491131,0.01045642,0.03120106,0.01848294,0.02763435,0.00851218,0.02188209,-0.002639,-0.02079996,-0.01032263,-0.01509442,0.03412098,0.02164464,0.03522604,0.00183726,-0.01811577,-0.00580818,-0.01642343,-0.02279918,-0.0002797,0.00405556,-0.03361033,-0.00543567,0.00342865,0.07166317,-0.03393628,0.00204272,-0.00756711,-0.00629611,-0.01769429,0.02022954,0.00716119,-0.00425937,0.0245789,-0.01298923,0.00484078,0.03131126,0.01697571,-0.00478759,0.01732779,-0.00979243,-0.02093584,-0.03046951,-0.02080779,-0.01390651,0.06210609,0.0120729,0.02284953,-0.02356844,0.02941687,0.02361309,-0.0382117,0.03251099,-0.0169608,-0.03178866,0.0009954,-0.03848849,-0.00451718,0.00246997,0.0156092,-0.04212846,0.03679572,0.00606245,0.00780984,-0.01893409,0.03729371,0.00407068,0.01058192,0.00562251,0.01529141,0.03449566,-0.02416057,-0.03993319,-0.04108559,0.01508582,0.00842277,0.0300154,0.00346663,-0.00592933,-0.00344918,0.02811729,-0.04718361,0.01538483,-0.02505922,0.00620675,-0.02749848,0.04155282,0.02429286,-0.03012268,-0.00195136,0.03758578,0.00214179,-0.00203759,0.02380963,0.01832804,-0.00080213,0.01153056,-0.05616729,-0.03179932,-0.03845915,0.05323379,-0.01327219,-0.03719367,0.00080842,0.01566638,-0.03270296,-0.00698113,0.01525795,-0.02697508,0.0156067,-0.00687452,0.0047932,-0.0500926,-0.0239656,0.03873168,-0.00152451,-0.04892884,0.00435055,0.00900023,0.03311749,-0.01941754,-0.03094866,0.00921769,0.01612375,0.00609316,0.01446608,0.01918836,-0.01345689,-0.02278759,0.00150067,-0.04096074,0.01645932,-0.03152698,0.00954409,-0.00118593,-0.00548015,0.00877948,-0.00343559,-0.01112542,0.02930931,-0.00225202,-0.01446488,-0.00413557,-0.00194652,-0.01700524,0.00700153,-0.03144777,0.02915643,0.00636591,-0.00866853,0.015842,-0.02869423,-0.0103623,-0.00313781,-0.00012449,-0.00194007,-0.01161069,-0.00392256,0.04422468,-0.0161815,0.02215188,-0.03401982,-0.01781636,0.00234068,0.00668787,-0.01563328,0.01040246,-0.00227442,0.00281098,0.01089507,0.01319344,0.01050548,0.02561107,0.01184833,-0.02285427,0.00357727,-0.01500251,0.01188597,0.02505258,0.00601901,-0.01899628,-0.01141921,-0.017936,-0.02450881,-0.00913393,-0.00969265,-0.01409855,0.01539657,-0.00121131,0.00360953,0.03323065,0.02640832,-0.01200336,-0.00250809,0.03269436,-0.01424176,0.03984236,0.00575863,0.04019222,-0.00031672,-0.00378398,-0.00384589,-0.02559524,-0.00436055,0.03360528,0.00563053,0.02053448,0.01671798,0.01928194,-0.01729476,0.0227013,0.00490842,-0.02181677,0.03142929,-0.01891594,0.01635559,-0.00320755,0.01311772,-0.00029426,-0.03834047,0.00651308,-0.01345432,-0.00084541,0.01019984,-0.01427907,-0.00118137,-0.00152105,0.01851159,0.01185111,0.00763804,0.04515093,-0.01684961,0.00458841,0.00128037,0.01485038,-0.01126811,-0.01631624,0.00412366,0.01344636,0.00095522,-0.01572127,-0.00913603,-0.01241073,0.00266354,0.01686105,0.02718043,0.03199425,-0.04136144,0.02246856,0.0060725,0.00939822,-0.01966037,0.02603303,-0.00039148,0.02998325,0.03391105,-0.00274769,-0.00187961,0.00301626,0.00255453,0.03221553,0.02715665,0.03666327,-0.01913433,0.05940171,0.01815871,0.02206291,-0.01696924,0.00293669,0.03424335,-0.03108725,0.04103475,0.02558037,0.01696842,-0.02370394,0.00357244,-0.02952798,-0.02348939,0.00307525,0.02478573,0.00423907,0.00963637,0.00918114,-0.02119842,-0.01052796,0.00680376,0.01030557,-0.03301638,-0.07163476,0.03122966,0.00342729,-0.05266643,0.02533618,0.00262646,0.02934183,0.02755314,-0.00521968,0.01280626,-0.00848683,-0.01150984,-0.02220317,0.0194245,0.01434324,0.0400872,-0.00079031,0.0372262,-0.00939834,-0.01082355,0.00213589,0.03296087,0.03912281,-0.0351139,-0.02379178,0.0150973,0.00918967,0.01028213,0.02514023,0.01995071,-0.03359104,0.02307487,0.02273924,-0.01413048,0.01023926,0.00699505,0.00360177,-0.01028476,0.01446868,-0.00249001,-0.03154271,-0.01135847,0.02334718,-0.00631458,0.00918572,-0.02227625,0.02444526,0.01708572,0.02328833,0.0094028,-0.01463615,0.01068163,0.02447077,0.00122135,-0.02363124,-0.01235537,0.00322879,0.00680313,0.01552353,-0.02158211,-0.038176,0.0297971,0.01648165,-0.0053976,0.01934399,0.004655,-0.00982995,0.02829334,0.02913428,-0.02769888,0.01681603,-0.00760246,-0.02041848,-0.03776483,0.00499443,0.01647368,0.01729576,-0.02832035,-0.03042694,0.04688159,0.02554,-0.01534735,-0.00224606,-0.03631564,0.03497037,0.00749848,0.03177184,0.03813946,-0.00116815,-0.04345243,-0.00453354]
7	23	Nom : Robe Bleue Royale | Catégorie : TENUES | Genre : Femme | Couleurs : Bleu | Tailles : S,M,L | Description : Robe longue élégante | Badge : Nouveau	[-0.1108936,0.11777537,-0.04363399,-0.02627343,-0.04488773,0.07009593,-0.01353062,-0.07168755,0.07502082,-0.10192006,-0.00998238,0.06099645,-0.01877895,-0.00039246,0.01965817,-0.10378743,-0.00127857,-0.03261691,0.02862987,-0.03638488,0.03452235,0.04370192,0.02941746,-0.063682,0.03792983,-0.04200728,0.0467698,-0.03172917,0.03264103,0.09162313,-0.03702153,-0.04656326,-0.02045822,0.08328107,0.04565796,-0.10739128,0.0047429,-0.02516678,0.05398683,-0.05215886,-0.01932632,-0.04233412,0.02047748,-0.01851022,-0.03865562,-0.07256572,0.00303408,0.02298442,-0.01870034,0.0725577,0.02067233,0.01182706,-0.0876553,-0.01207223,-0.04582964,0.04164396,0.05575402,-0.02760552,-0.05560442,0.02798754,0.038,-0.05964238,0.00374161,-0.03777197,0.00058284,-0.04761048,0.02133123,0.0129483,0.11012422,-0.08236074,-0.01814917,0.02785245,0.01473006,0.04957069,-0.00625874,-0.01519229,-0.03047988,0.03061195,0.00336796,0.02318688,-0.13218188,-0.01427017,0.01893023,-0.0087991,0.02666966,-0.00796271,0.03268703,-0.06337178,0.00305675,-0.01479198,-0.02537918,0.11392041,-0.01890387,0.07516909,-0.01890856,0.00109072,0.04842646,-0.0198258,-0.03834024,-0.02316417,0.03698988,-0.01935704,-0.02842287,0.02652709,0.1340768,-0.06885694,-0.02171472,-0.01977731,0.10921324,0.05245674,-0.08612621,0.03857299,0.01200101,0.02670699,-0.02884349,0.00672765,-0.02701383,0.00482956,-0.01281097,-0.02417591,-0.01914853,-0.00301881,0.02036691,-0.05794198,-0.03142175,-0.04650924,0.05051256,-0.04087087,-0.07513836,-0.00834806,-0.0103307,-0.02808693,-0.02288411,-0.02957245,-0.04698753,-0.07032851,0.01147553,-0.0479895,0.03668492,-0.10447668,-0.01172839,-0.07744386,0.01131852,0.02292206,-0.02900117,-0.04058196,0.08533344,0.032876,-0.02046133,0.01868725,-0.03452769,0.09217881,0.07625638,0.02312263,0.00647059,0.00460688,-0.02810208,-0.04061902,-0.03213182,0.04045439,0.03027957,0.0895524,0.0377368,0.02045678,-0.02052913,-0.02509131,0.01847249,0.03466969,0.00378135,0.05908671,-0.04337133,-0.02443897,-0.01608273,0.03772997,0.02549183,-0.04103682,0.01885571,-0.08087707,0.02835905,0.01811455,0.06926977,-0.05004237,-0.01627057,-0.03522503,0.00252865,0.01121736,-0.00105097,-0.03290359,-0.03653043,-0.02537216,0.01779731,0.03934372,-0.00811866,-0.04023483,-0.00679085,-0.02675682,0.00072932,0.00598506,0.00071629,0.07523817,-0.02668135,-0.00637768,-0.02692512,-0.05358193,-0.00539019,-0.05314498,0.00959065,0.04033491,0.05162356,-0.02117123,-0.02648917,0.00465887,0.02577797,0.04380421,0.02440896,-0.04165423,0.01494065,0.00903491,-0.06760743,0.01632104,-0.01567477,-0.05097874,0.01625945,-0.03620739,-0.00378519,-0.02757346,0.01771269,0.0017416,-0.03596929,0.04416242,-0.05319156,0.04345515,-0.01567155,0.00976833,-0.01330983,-0.01090728,0.00541881,0.00123122,0.00702485,-0.05439181,-0.00601666,-0.01902432,0.00308551,-0.02140165,0.06433986,0.01992766,-0.01098885,-0.0258899,0.02653909,-0.01446428,-0.03801938,-0.06783351,-0.00974552,0.00087412,-0.01885714,0.01096363,0.00935281,0.01377372,0.01164055,-0.01762182,-0.01265227,-0.02666933,-0.04434275,0.01913372,-0.01704545,-0.01012086,0.04374901,0.03764405,0.02060137,0.03651394,0.01592239,0.00321303,0.00872618,-0.01810557,0.00499479,0.05172742,0.01747581,-0.02449642,0.00939747,0.04384468,0.006553,0.03272794,0.0079557,-0.00934115,0.02174611,0.01704771,0.02887231,-0.02492885,-0.01330279,-0.017864,-0.06786256,0.00333719,0.02276511,-0.03458699,-0.01079566,-0.01215977,0.01723329,0.01451334,0.01359927,0.02108631,0.02436689,-0.00951531,-0.03420471,-0.01000106,-0.02677208,0.0361179,0.00768975,0.02491988,-0.01657268,-0.02879112,-0.0086777,0.05287508,0.02873456,-0.02567343,0.04902187,0.0164836,0.03941652,-0.04999836,-0.00641509,-0.00019337,-0.03613225,-0.04692516,0.03609911,-0.03828823,0.03458663,0.00012299,-0.01626725,0.00882067,0.00849267,0.01040871,0.02826693,0.03301083,-0.00899638,-0.05359312,-0.01577086,-0.00180079,-0.01277849,-0.03273278,-0.01302072,0.05346856,0.0043171,-0.02017366,-0.05806419,0.04198382,-0.03372608,-0.03630636,-0.02569053,-0.0065141,-0.00129661,-0.06268254,0.0512028,-0.02491808,-0.0264605,0.03383344,-0.00336074,0.015988,-0.006743,0.04120575,-0.01620943,-0.02081175,0.0063885,0.03481287,-0.00459203,0.02576144,-0.07546562,0.01317999,0.02851174,-0.02757914,0.00667756,0.02881149,-0.00291949,0.00346191,-0.01187086,-0.04455902,-0.03454806,0.0334291,0.01327249,-0.0363236,-0.02024974,0.01459995,0.00586392,0.03600135,0.02022152,-0.01372345,-0.00358078,-0.00105974,-0.05433145,0.02565384,-0.00081165,0.01961553,-0.02626617,-0.01169332,0.03515409,0.04390796,-0.01701333,-0.00181418,-0.02296965,0.00260477,-0.03783654,-0.01221205,-0.01828749,0.02823496,-0.04553265,-0.04885189,-0.06399357,0.02854505,-0.01970094,-0.01406816,0.01325085,-0.02684131,-0.02444172,0.00997444,0.04936916,0.01381532,0.01488064,0.04786728,-0.00404078,-0.04399559,-0.03848609,-0.02722177,-0.04235783,-0.01636602,0.03969828,-0.03472989,-0.03612094,0.00878595,-0.0043993,-0.02156073,-0.01558638,0.02214441,-0.01202054,0.01404641,0.06458731,0.00897761,0.00156443,0.04488039,-0.01125213,-0.02814035,-0.06529526,-0.05722468,0.0107527,0.03534416,-0.00126462,-0.00349865,0.03147376,0.06234459,-0.01385369,-0.06948649,0.02285991,0.04126552,0.03216309,0.0246597,0.05888785,0.00508798,-0.01937858,0.01769187,-0.02052373,0.00839161,0.01628975,0.02138253,0.00688435,-4.046e-05,0.01860856,-0.0332761,-0.01839351,-0.01458026,-0.00879111,-0.01440522,-0.02982219,-0.03936392,-0.02251616,-0.00473872,0.03356044,-0.0221687,-0.04653137,0.01627403,-0.01882233,-0.03364009,-0.00887877,0.04910201,0.05334634,0.01021797,0.00160484,-0.0099842,0.0182945,0.04514324,0.02192376,0.01249786,-0.01734972,-0.03168639,0.00265722,0.01753141,-0.01432963,-0.05366124,-0.0342112,0.01886307,0.0015622,-0.01673188,-0.04355249,0.02094416,0.04414172,0.02103428,0.03404381,0.00389857,0.00738981,0.00022449,0.01493413,-0.03425587,0.05686804,-0.00460822,-0.02919756,-0.00403548,0.02257143,0.00314794,-0.03873583,0.00691342,0.00448779,0.00581813,-0.00584306,0.03692235,-0.02603863,0.00520039,2e-06,0.03382659,-0.02926663,-0.02272095,-0.03116846,0.00303227,-0.01683735,-0.0046983,-0.03391458,0.023452,0.0429863,0.03448411,0.03987802,-0.02154295,-0.02233333,0.04413905,0.01928863,-0.01625728,0.0081204,-0.01541087,0.04921455,-0.01532255,0.03346611,-0.01808959,-0.02259627,0.00546437,-0.02966877,-0.00043481,0.03983327,-0.03358031,-0.0160178,0.05991353,-0.00477635,0.01112793,-0.04602328,0.02596406,0.0163522,-0.02326785,0.04702551,-0.02035096,0.0067465,-0.02322518,0.04072851,0.00965702,0.03519022,-0.0464684,-0.00292887,-0.0064736,-0.0054834,0.02170987,0.00627775,-0.01300057,-0.03278404,-0.00287321,0.03373104,-0.05403525,-0.03168138,0.03196598,0.00600086,-0.00774373,0.05211332,0.0371738,0.02277029,-0.03534183,0.06424419,-0.01706052,0.03683463,0.03125578,0.01685552,-0.00772183,0.00269437,0.01497905,0.00550201,0.0102799,-0.0303221,0.02032429,0.01686972,0.02440457,0.01590112,-0.02187551,-0.01795655,0.01454923,-0.03739954,0.0078746,-0.01038592,-0.026661,0.02445575,0.03524215,-0.00328153,-0.00107114,-0.04562031,0.01485979,-0.0115014,-0.0151924,-0.01400955,0.08712134,-0.01653975,-0.01749038,0.01419463,-0.01265975,-0.007539,0.01259274,0.01602486,-0.01980009,-0.00392083,0.01005971,0.01959864,-0.01396038,0.01334383,-0.02488928,0.00877577,-0.02941713,0.00713,-0.00661657,0.00079882,0.01687648,-0.04654631,-0.00516074,-0.00387462,-0.01638409,0.00061692,-0.01073937,0.02825611,0.01454534,-0.02287338,0.02500624,0.03077986,-0.02216257,-0.00321482,-0.01499918,0.00843384,-0.01283495,-0.03632026,0.0159544,0.04533855,0.00729453,0.0355568,0.0115042,0.00813477,0.00075841,-0.07528797,0.05019331,-0.03290853,-0.03013965,-0.03211968,-0.01616244,-0.03809113,0.01676528,-0.02756946,-0.00336948,0.00810403,-0.06199195,0.01284637,0.02494906,0.01433351,0.01239605,0.02797686,-0.01576965,0.00239403,0.01019103,-0.03878805,0.00193249,0.00911592,-0.01486672,-0.00485113,-0.01035286,-0.01272301,-0.00885441,0.01770966,-0.01159699,0.06544753,0.01512331,0.01892406,0.06201734,-0.02548634,0.04858747,-0.01320656,-0.0033306,-0.0299551,0.00178913,-0.009263,-0.00349135,-0.00346322,-0.03530042,-0.01419369,-0.01273304,0.00757167,-0.01757352,0.01720169,-0.00764431,0.00754713,-0.01420691,-0.00305393,-0.00321752,-0.00560416,-0.06570533,-0.04440954,0.01597518,0.01568037,0.01497721,-0.00325035,-0.0025126,0.01412069,-0.01284286,-0.0177243,-0.04389337,-0.02779299,-0.01501518,-0.0378203,0.00390524,0.03725194,0.00057024,-0.04864518,0.04074087,0.01484694,0.02005013,-0.00432524,0.03817528,-0.00886939,-0.0139288,-0.02266735,-0.01292416,-0.02642174,0.03742233,0.00741802,-0.02323366,-0.00375207,0.00169995,0.02081484,-0.00346731,0.0271114,0.00349272,0.00868786,-0.01359887,0.01581019,0.00968324,-0.02861752,-0.01761623,0.00693212,-0.018472,0.02995523,-0.01380136,0.02598676,0.01506389,0.04310384,-0.02681279,0.02841899,0.0017197,0.05301908,0.02480547,-0.01896661,-0.00262482,0.0220166,-0.03554503,0.00039738,-0.02353154,0.00147387,0.01095785,-0.01583184,0.03811016,-0.00305139,-0.00116544,0.02505844,0.02603164,-0.03520992,0.00199981,-0.00280288,-0.01987072,0.01263883,-0.01170664,-0.00105872,0.00811312,0.02545923,0.0129963,0.02603444,-0.0182366,-0.01414192,-0.00762122,-0.00032517,-0.01082154,-0.02014864,0.02604305,-0.00283855,-0.02798642,-0.02357825,-0.00229466,0.01677071,0.01370675,-0.03190737,0.03162077,0.03264095,0.02241083,0.02865041,0.03785837,0.02069136,0.01496798,0.04620661,-0.00890047,-0.0121804,0.00951902,0.02491752,-0.00400534,-0.01719697,0.01847888,0.05436886,-0.01934034,0.01161602,-0.02622428,-0.0071367,-0.02323204,-0.00984424,-0.02248223,0.03035962,0.01905798,0.00824005,0.00851258,-0.03410092,-0.00392702,0.02596461,0.03157151,0.02047256,-0.00936965,0.02623956,-0.00138139,-0.00317181,0.00105204,-0.00903081,0.03632427,-0.00157656,0.005375,0.00602121,0.03468259,-0.00845919,0.01506787,0.02140115,0.0041659,-0.00914193,-0.01442196,0.02332512,0.00483849,-0.01394605,0.05965857,-0.01424796,-0.05184697,0.00573013,-0.03387359,0.01193029,-0.00215142,0.01404591,0.0040002,-0.02904459,-0.029716,-0.02033055,0.01681478,0.00283362,-0.00988819,0.01399001,0.00805041,-0.03669661,-0.01279315,-0.00715632,0.00688945,-0.00424433,0.00735804,-0.02192493,-0.00241056,0.02519435,0.00205441,-0.00167871,0.04700622,0.00200902,0.01134791,0.0059,0.01566262,-0.06476764,-0.02301577,-0.00714044,0.00928409,-0.00906381,-0.0186455,-0.04548969,0.0017775,-0.01282391,0.02937088,0.00663471,0.02417433,-0.00196438,0.01040007,0.03805005,0.02991322,0.00315956,-0.01305849,0.00655,-0.04767811,0.03329313,-0.00328538,0.01180845,-0.00045868,-0.01778846,-0.02473083,-0.03147351,0.01057485,-0.00463924,-0.01248158,-0.01246768,0.00611054,-0.00468784,0.00102928,0.02420868,-0.00749296,0.0250252,-0.03130291,0.0293399,0.04347852,-0.03296063,-0.0143533,0.00805434,0.01248986,0.04633768,-0.01472242,-0.0036565,-0.04267674,0.01234321,0.04425647,0.002523,-0.01485186,0.04182554,0.01713728,0.0253618,-0.02338304,0.01559934,-0.01600457,0.00695672,0.0260407,-0.01371114,0.00549624,0.02343441,0.0180718,-0.00804739,-0.02220735,-0.01347324,0.01159442,0.03513512,0.03084003,0.02232999,0.01437527,0.0329859,0.00291145,0.02841365,-0.02763825,-0.03440714,-0.02195703,0.01272654,0.0030163,0.00620954,-0.01539046,-0.05533627,0.0302397,0.01809351,0.03845278,-0.0081399,-0.02217338,0.03484226,0.00921289,-0.02889452,-0.02396445,-0.00289143,0.01014904,0.03644415,0.01665291,0.02246816,-0.03184407,0.01394629,0.03694272,0.00112927,0.00905741,0.01947046,0.01724665,-0.0062759,0.03217832,0.01185236,0.01093181,-0.01789594,0.00357508,-0.04614601,0.01032364,0.01700388,-0.01040192,0.02875969,-0.02603936,0.02554931,0.00494862,-0.00859452,0.02998599,-0.01415802,0.00201522,-0.00098406,0.02055295,0.01220867,0.01708774,7.5e-05,0.0162584]
8	24	Nom : Robe Rose Romantique | Catégorie : TENUES | Genre : Femme | Couleurs : Rose | Tailles : S,M | Description : Robe légère et raffinée | Badge : Nouveau	[-0.0387653,0.12247413,-0.03383625,-0.04111053,-0.04100602,0.08854442,-0.02375583,-0.02860594,0.10277945,-0.10757233,-0.01260235,0.05005524,0.04475594,0.04621384,0.04235204,-0.05801661,0.0402766,-0.00132801,0.04116704,-0.03861645,0.00865621,0.05073826,0.01268664,-0.09353689,0.08941077,-0.01314465,0.05894116,-0.06915666,-0.00810902,0.05866675,-0.05264351,-0.06257968,-0.01138376,-0.01135636,0.01496901,-0.05062713,-0.05247077,-0.04004961,0.08247091,-0.00376226,-0.05554154,0.00739085,0.02676495,-0.00646149,-0.03521742,-0.08965269,-0.00075906,-0.02785636,-0.03968646,0.11552218,-0.00150022,-0.00957856,-0.09391261,0.02339386,-0.03831059,0.01736798,0.0909711,-0.03829565,-0.02728015,0.0085533,0.0285773,-0.05505696,0.02351094,-0.03770959,-0.00354016,-0.05877561,-0.00884426,0.02171961,0.08878558,-0.03423833,-0.00736154,0.03408336,0.0129931,0.05196011,-0.0520633,-0.01408893,-0.06497102,0.03137723,-0.03670196,0.03216073,-0.11899059,0.0200107,-0.00267911,-0.00547832,0.0166052,0.03318318,-0.02494805,-0.10633555,-0.00924539,-0.09709753,-0.01158963,0.11275833,-0.02010603,0.02009648,-0.0252924,0.01012715,0.03299226,0.02722854,-0.03452995,-0.01200041,0.01937566,-0.01014456,-0.03104074,0.02992387,0.12163348,-0.00576058,-0.0220014,0.00016211,0.12658665,0.05776449,-0.06157678,-0.0154962,0.05346677,0.01178803,-0.03927408,0.04132069,-0.04690282,-0.00954127,0.01237712,-0.04671038,-0.0159101,-0.02261117,0.02380332,-0.01018857,0.02885558,-0.00676317,0.05387612,-0.00180634,-0.05096439,-0.02419845,0.03856318,-0.0683387,-0.00016513,-0.04716514,-0.01522952,-0.05028978,-0.00256364,-0.04895331,0.08342344,-0.08587035,-0.033431,-0.0784461,0.036734,0.03323681,-0.00851465,-0.02943366,0.0533547,0.05552529,0.02947361,-0.02464254,-0.03571627,0.10951973,0.01760195,0.05610399,-0.01141119,-0.01883363,0.02391612,-0.06465881,0.00629761,-0.00538654,0.01404388,0.06534126,0.03782681,-0.01345313,0.00233483,-0.03259507,0.01965121,0.01335708,-0.00551395,0.05045269,-0.03219197,-0.04538567,-0.01698602,0.04274968,-0.00148644,-0.03487529,0.03588712,-0.00427609,0.03233989,-0.0230489,0.05062931,-0.05401164,-0.03532457,-0.02745997,-0.00859488,0.03008321,-0.01110937,-0.00872098,-0.03819974,-0.02703672,-0.01299135,0.02238303,-0.0115012,-0.0358736,0.00886847,-0.01511479,0.02046341,-0.01327002,-0.00890242,0.03156615,-0.03440715,0.01042377,0.01220167,-0.02610904,-0.00426911,-0.049163,0.00215582,0.02126418,0.06134895,-0.03837154,-0.02936021,0.01949,-0.01510264,0.01322353,0.02696684,-0.04355895,0.050996,-0.02670832,-0.07571249,-0.01877489,-0.04644923,-0.02720008,0.01549826,0.00727239,-0.01624509,0.05254637,-0.01669762,-0.03592775,-0.00269019,0.03528007,-0.03334619,0.03601951,0.02500645,0.023446,-0.01230366,0.00129844,0.02407707,-0.01487964,0.0159188,-0.0682374,-0.04269676,-0.03727887,0.02300926,-0.05532155,0.0831392,0.03646147,0.02126366,-0.02959639,0.01384263,-0.00515117,-0.02465369,-0.04180849,-0.01779605,-0.01702155,-0.04197026,-0.01964805,0.00272154,0.02398364,0.00488044,-0.00021261,0.00888263,-0.01909241,-0.05880282,0.03427363,0.00135872,-0.01709053,0.05277921,0.03232364,0.01736165,0.04518108,0.01319556,0.00875751,0.02414955,-0.02745818,0.0003043,0.05228706,-0.01244932,-0.0194465,0.00282603,-0.00534853,0.00444561,0.03043356,0.02630475,0.00080094,0.00360973,-0.00604992,0.02693615,-0.03905258,-0.0061964,-0.02091953,-0.0780545,-0.02678781,0.02953399,-0.02212233,0.0161802,-0.04341418,0.01407095,0.00662589,-0.00187825,-0.02094204,0.05031889,-0.02426616,-0.03785108,-0.0111142,-0.03449272,0.02143593,-0.00737097,0.01690683,-0.01347321,-0.0149759,-0.00947757,0.04761882,0.0577076,-0.03742945,0.0433159,0.01449092,0.03099009,-0.05303057,-0.0060643,0.01405692,-0.02375569,-0.04901667,-0.00522058,-0.03288103,0.04772352,-0.00127964,-0.01799787,-0.01296846,0.0025106,0.02076278,0.02924421,0.00299457,0.00871914,-0.05208031,0.02983799,0.00142231,-0.00962756,-0.03003501,-0.03921505,0.01921731,0.00495046,-0.01118991,-0.03805578,0.05826457,-0.03922844,-0.04362642,-0.04460238,-0.01199838,-0.01196503,-0.04653485,0.05462908,-0.03870898,-0.00735546,0.03594393,-0.01213629,-0.00891069,-0.01495753,0.02605631,-0.02862654,-0.0036441,0.01353759,0.02704173,-0.00400667,0.03639209,-0.03544043,-0.00034578,0.00533714,-0.01975147,0.03285376,0.0156967,-0.00047993,-0.01050275,0.00086189,-0.01200811,0.00309192,0.00395197,0.01692809,-0.03633862,-0.02661375,-0.01693121,0.01542302,0.01518011,0.0589697,-0.02655781,0.01120977,-0.0073728,-0.06104882,0.00071298,0.03256439,0.01560894,-0.01682575,0.01435688,0.01846849,0.02943051,0.00773829,0.00013664,-0.0407076,0.02650286,-0.01717827,-0.02700327,-0.02473527,0.00793449,-0.03633637,-0.00408873,-0.02573417,0.01266269,0.00555856,-0.0247532,0.00409281,-0.00047201,-0.03682217,0.02490355,0.0118004,0.02870564,-0.02176955,0.03632473,0.00646071,-0.0427871,-0.02056376,-0.06989828,-0.02614334,-0.0065317,0.03491767,-0.03354822,-0.03026512,-0.00123705,-0.03218359,0.00668467,-0.00950129,0.02967942,-0.02956924,-0.02574451,0.03290668,0.00634113,-0.02404428,0.03548078,0.00363678,-0.04826603,-0.03685231,-0.02957472,0.03150454,0.00710726,-0.01154531,0.02864657,0.06059599,0.05285367,0.0039881,-0.04437824,0.02032151,0.00788995,0.00989497,0.016288,0.01639088,0.04136076,-0.01584185,0.03273437,-0.04669743,0.01239815,-0.00842653,0.00727702,0.00589234,-0.00179329,0.03548702,0.00185254,-0.0057603,-0.00089456,-0.05236644,-0.02542678,-0.01443663,-0.02040502,-0.03447855,0.00794531,-0.0053761,-0.03228848,-0.02680265,-0.00444348,-0.00380717,-0.03656353,0.01156095,0.05569803,0.08778542,0.02487434,-0.00761244,0.00771092,0.0170117,0.03844477,-0.0099785,0.0075354,-0.02125772,-0.03167161,0.01388718,0.02796411,-0.03034846,-0.03323383,-0.00021678,0.01629468,-0.00473671,-0.04367442,-0.05492362,0.00772069,0.08886496,0.03130165,-0.00019206,0.01584563,-0.00849254,-0.02731384,0.0172595,-0.01188835,0.03741929,-0.02763054,-0.01287395,-0.011176,0.00537721,0.00059436,-0.05481533,0.00938875,0.02122089,0.01346624,-0.0067535,0.0460892,-0.01645457,0.00791559,-0.02949756,0.02801117,-0.02902032,-0.0043934,-0.02613501,0.00619097,-0.00602482,0.0216382,-0.02884577,0.016894,0.03987546,0.02177787,0.01253228,-0.04287111,0.01096335,0.0583722,0.04530639,-0.05134285,0.01848985,-0.01979345,0.04538614,-0.01822395,0.04335521,0.00943192,-0.001235,0.0244454,-0.04804056,0.00819755,0.02436949,-0.01374404,0.00030893,-0.0004194,-0.00851267,0.01068539,-0.04991179,0.02897353,0.01731733,-0.02521066,0.02299967,-0.02550398,0.02956206,-0.02165334,0.02483331,0.02654201,0.0367873,-0.02934413,-0.02533218,-0.01460725,-0.00246244,0.01884515,-0.01974141,-0.03763838,-0.0435066,0.00389831,0.05262518,-0.03719042,-0.0186812,0.02665722,0.01110632,-0.01406101,0.03711123,0.02264869,0.04492689,-0.03695814,0.05830029,-0.00065285,0.04387079,0.03634656,0.01073675,-0.03028156,-0.00088426,0.01000203,0.01354283,-0.00107916,-0.01150182,0.04441518,0.01685925,0.01297208,0.01674652,-0.03921091,-0.02607767,-0.00527034,-0.04679367,-0.0067194,-0.00736028,-0.03465771,0.0072058,0.04181756,-0.00108039,0.02489523,-0.04529883,0.0014062,-0.0119422,-0.02400582,-0.00208974,0.07614982,-0.01364262,0.02738575,0.01429484,-0.01091877,-0.03911344,0.0336122,0.03516157,-0.00162681,-0.01879791,-0.03001181,0.01583824,-0.02429177,-0.00131948,-0.06034086,0.01654546,-0.01681107,0.0135866,0.02539058,0.0170782,-0.0041457,-0.04547894,0.0082235,-0.00660542,0.00771561,-0.00624977,0.00543606,0.02611131,0.0404001,0.00254518,0.01635837,0.00570025,-0.01810609,0.0168404,-0.03157895,0.01949803,0.01748449,-0.0075097,0.02687839,0.04023209,-0.01019072,0.0367245,0.03198364,0.01947384,0.03836955,-0.04972403,0.05069233,-0.04538066,-0.00634204,-0.04433269,0.01405474,-0.02759326,0.02191338,-0.00606676,-0.0237332,-0.00287897,-0.07763872,0.03130269,0.01058442,0.00207215,0.01937925,0.01546585,0.01043191,0.01081521,0.02198302,-0.0283336,0.00531244,0.00334614,-0.02093883,0.01595858,-0.00667688,-0.01321947,0.01384622,0.02402208,-0.01019122,0.02501165,0.02102785,-0.01093902,0.04396859,0.00130734,0.02131994,-0.01196941,-0.0152331,-0.01740935,-0.00143899,-0.02176757,-0.00900013,-0.00499031,-0.05639353,0.00938367,-0.00010722,0.01420431,-0.02235841,0.02788275,-0.00783722,0.00266963,-0.00767775,-0.00240036,0.01714071,0.01047733,-0.04589227,-0.02498576,-0.00113793,0.01755239,0.02460342,-0.02410875,0.00049783,-0.01260175,0.01361444,-0.03760677,-0.01632508,-0.03800517,-0.02472733,-0.02204071,0.00415393,0.03824368,0.01850635,-0.04663615,0.03056637,0.02356764,0.02547272,0.00472853,0.02338668,0.02630163,-0.01769891,-0.02543462,-0.03644342,-0.00292636,0.05604804,-0.01764051,0.00683191,-0.00707842,0.0033173,-0.00440319,0.00360937,0.05115613,-0.00948409,-0.00062103,-0.02465728,0.01515377,0.00652124,-0.05022855,-0.00610097,-0.01499884,-0.0311334,0.00457753,-0.00921903,0.01057244,-0.00662225,0.0334722,-0.01629415,0.01585097,0.02199932,0.05624611,0.02157101,-0.02264889,0.00331581,0.01285015,-0.0495149,0.02142407,-0.02886467,-0.01292882,0.0020772,-0.00875165,0.02412517,0.00222469,0.01497893,0.03317052,0.0147832,-0.05704953,-0.01927776,0.01530598,-0.027966,-0.01560877,0.01293007,0.01566259,0.00539431,0.03395626,0.00374671,0.0190624,0.00970107,0.00048633,-0.01437847,-0.01069146,-0.0107638,-0.0278742,0.00951296,-0.01286052,-0.01849089,-0.02958521,-0.01136088,0.02995379,0.0376011,-0.02184699,0.04424216,0.03090949,0.01561253,0.02239859,0.04173931,0.02660869,0.01415532,0.0223903,-0.02445449,-0.02668632,-0.00930273,0.03469088,0.01384814,-0.01533544,0.01386611,0.04334576,-0.02977826,0.01256498,-0.03643388,0.00609936,-0.00205817,-0.02464632,-0.00086635,0.02998725,0.04464991,-0.01161208,0.02155282,-0.02316097,-0.01464736,0.01994184,0.02495051,0.01487364,0.00745285,0.02456934,-0.02230105,0.02035559,0.02154314,-0.00535821,0.01450381,0.00273706,-0.00148596,0.01595808,-0.01864,-0.00521633,0.01005044,0.03442638,0.00283035,0.00347944,0.00861756,0.04391227,0.01420885,-0.0070947,0.01234216,-0.00877588,-0.0459981,0.00288724,-0.05166188,0.02769253,0.00916632,0.02437622,0.00333609,-0.04749342,-0.0205014,-0.01524983,0.01237008,-0.00690828,-0.00080738,0.00752482,-0.00385106,-0.01739505,-0.01754856,0.0006787,-0.00125356,0.00019113,-0.02080408,-0.01886765,-0.00924443,0.00572174,0.00119321,0.0046459,0.02695891,0.00122113,0.02019791,0.00084917,0.00927379,-0.03049304,0.00076069,-0.0173508,0.02283125,0.00189769,-0.02490587,-0.01816813,-8.713e-05,-0.01229774,0.03392196,0.01619841,0.04445516,0.00371191,0.02097455,0.04022547,-0.0009775,0.00478107,0.00972152,0.03219796,-0.0398558,0.04960562,-0.00247506,-0.00549168,-0.01046365,-0.00112304,-0.04792887,-0.00817248,0.0140861,0.0002195,-0.00728853,-0.0167512,0.02088686,-0.01065694,0.00571116,0.00931967,-0.01978774,0.01631301,-0.01222141,0.01512207,0.05618261,-0.02761362,-0.0250618,0.00886963,0.01367988,0.04452981,-0.01356542,0.00113298,-0.02379453,0.00458332,0.04009838,-5.717e-05,-0.02801344,0.01531702,0.00626299,0.03671699,-0.02826301,0.01280683,0.0067329,0.01661399,0.02902172,-0.03426158,-0.0186401,0.00923313,0.00281796,0.00550868,-0.0256122,-0.00505518,-0.00431929,0.02797526,0.02567611,0.02270315,0.00050216,0.04362359,0.01737112,0.01837645,-0.04211541,-0.02020052,-0.02043176,0.00207822,-0.01275463,0.00918509,-0.01060025,-0.02748917,0.02231062,-0.0001432,0.0297142,0.00497961,-0.05092404,0.01487597,-0.00301389,-0.02010102,-0.03744726,-0.01373612,0.02157484,0.01282258,-0.00082628,0.00075314,-0.03004588,0.01503931,0.0143363,0.01727962,0.01005972,0.00861087,-0.00552044,0.0172667,0.03368302,0.00706932,0.01098948,0.00502036,-0.00567593,-0.03742043,0.02031439,-0.00985655,-0.00873438,0.00128809,-0.05456709,0.01717875,0.01304805,-0.02238312,0.0494514,-0.03671264,0.02692963,-0.0057349,0.06579371,-0.02002016,0.02043492,0.00526981,0.00841719]
9	25	Nom : Panier Décoration | Catégorie : MAISON | Genre : Unisexe | Couleurs : Beige | Tailles : Unique | Description : Panier décoratif artisanal | Badge : Nouveau	[-0.13296121,0.00704962,0.04298576,0.00088118,0.00456457,0.04626562,0.06182555,-0.07171527,0.05044016,0.05535676,-0.14481625,0.04271391,-0.04677352,0.10572343,-0.01801438,-0.04643774,-0.0938144,0.01674654,0.07862663,-0.03072613,0.00877943,0.01079636,0.04075282,-0.0468577,0.08463214,-0.01846153,-0.03504032,-0.04337311,0.06935737,-0.04469131,-0.02339445,-0.0226649,-0.06928089,0.06717955,-0.00281054,0.00719173,-0.0245007,-0.00605074,0.07712675,0.03694036,-0.0331258,0.00340032,0.0140742,0.00941896,-0.04252399,-0.02984069,0.01884803,0.08971673,-0.00036478,0.06752912,0.04306638,-0.03963466,0.05516553,0.03283004,-0.05074659,0.10179824,0.0089853,0.08368517,-0.02927594,0.03718057,-0.00039367,-0.06497501,0.07744172,-0.03522352,-0.02087235,-0.12397096,0.03840514,0.05465407,0.10624839,-0.06244818,-0.02627618,0.01140859,-0.08225558,0.01612819,0.03891791,0.01096549,-0.01727626,-0.02086762,-0.07621744,-0.03069482,-0.1270337,-0.00673535,0.03153393,-0.03423137,0.04428766,0.06290865,0.00350225,-0.03205634,-0.00865711,-0.0702213,-0.01087722,0.12513185,0.03335092,0.01890676,-0.09027918,0.05888223,-0.02843094,-0.02835126,-0.03776319,0.02000594,0.07261661,0.03558185,-0.06575467,-0.06327786,0.06440829,0.00701671,0.02476337,-0.05791492,0.00161394,0.11984628,-0.02188711,0.03392467,-0.01526445,0.01325949,-0.02667449,-0.00463231,-0.0875269,-0.03380051,-0.00041927,0.00276428,0.03340435,0.00313069,-0.02099696,0.01036271,0.01006756,-0.00231816,0.01347985,0.01821874,-0.05333469,-0.01204252,0.02821981,0.0230816,0.00101771,0.01028436,-0.0157138,-0.02491917,-0.05038579,0.00524104,0.09453733,-0.04043391,0.00149458,-0.03138477,0.01827677,-0.00258867,0.0017056,-0.0255493,0.06527606,0.05183092,-0.01706346,-0.0245816,-0.04414873,0.02527923,0.02758426,-0.00877659,0.02388997,0.04276941,0.02862937,0.00812093,-0.05572929,-0.00123704,0.02927374,0.04670108,0.03935055,0.03626856,-0.04121909,-0.07202191,0.06095731,0.03639614,-0.02585781,0.027792,-0.07579541,0.01808775,-0.03788467,0.02515821,0.02822977,-0.03382258,-0.04359579,-0.07775969,0.00163165,-0.00406659,0.03671552,-0.01852397,0.02063059,-0.01038421,0.02996907,0.01889729,-0.01795111,0.00415954,-0.00348617,-0.00776421,-0.00228465,0.00367067,-0.03026998,-0.07840614,-0.02141845,-0.01937585,0.00834305,0.07453786,-0.08279929,0.04658139,0.08247981,0.05777831,-0.00786368,-0.01859605,0.0589546,0.00591956,0.06528652,0.02444977,0.00767905,-0.03889363,-0.04666666,0.00945928,0.02913542,0.01922157,0.00749752,-0.01429108,-0.01328006,-0.01519564,-0.03067514,-0.00076721,0.01092636,-0.03037085,0.01315684,-0.00302394,-0.02325243,-0.00374479,0.00811819,-0.04059458,-0.04370046,0.00760598,-0.00945926,0.03744948,0.02767998,0.02958304,-0.03051596,0.02134177,-0.01193884,-0.02127184,0.03901287,-0.07488593,0.02654391,-0.03195041,0.02687247,-0.03236419,-0.0153583,0.06991083,0.01256832,0.01690678,0.00652841,-0.01633714,-0.00588282,-0.02246246,0.06860819,-0.04230205,0.01120041,0.01448488,-0.01367167,-0.01171143,0.04473176,-0.02188454,0.03388581,-0.04951084,-0.09476532,-0.03578984,0.06227945,0.01281684,0.0348889,0.00824859,0.00297299,0.03095833,0.01581191,0.01598205,-0.00279141,-0.0059662,-0.01485845,-0.01472569,0.02633571,-0.03831106,0.01718158,0.00387798,0.0714812,0.00462435,-0.03672274,0.01393973,0.01649079,0.00516235,0.01700909,-0.03965135,-0.00550638,0.01217946,-0.03231975,0.04195816,0.00909133,-0.02686479,0.02090345,-0.0251014,0.04574442,0.01088087,-0.00182083,0.0163165,-0.01174742,-0.01480202,-0.01344453,0.01958077,-0.03076785,0.02998763,-0.0057039,0.04348016,-0.04097799,0.01383971,-0.00777556,0.03645492,-0.00219252,-0.07061428,0.05881548,0.00061612,0.02140826,-0.0062986,-0.02913514,-0.00971945,0.00979126,-0.03513147,0.01051359,-0.0267552,-0.00570464,-0.02466498,-0.00193197,-0.01488681,-0.04368846,0.01533831,0.02180233,0.02996518,0.01689025,-0.07099824,-0.00641714,0.01554914,-0.01832369,-0.04088462,-0.04126222,0.02122426,0.02245627,0.0146434,-0.05007499,-0.00447695,-0.00351979,-0.00372945,-0.00718496,0.00126851,-0.00249586,-0.00249254,0.02193628,-0.06372271,-0.01159502,0.02278404,-0.00153775,0.00067466,-0.00508229,-0.02249269,0.02019567,0.00017434,-0.02241076,0.01519047,0.01702437,-0.03415832,-0.04407055,0.0114684,0.00976461,-0.05035692,-0.0268167,-0.04119566,-0.07249513,0.02293998,0.03808135,-0.01657628,-0.0034206,0.0093591,-0.00076257,-0.02326806,-0.04181811,-0.02015837,0.05406912,0.03036616,0.01406783,-0.01560726,-0.02468687,-0.02217162,-0.04637755,-0.02139905,0.02935815,0.02083725,0.02337438,-0.00877663,0.01965244,0.04749402,-0.02419845,-0.02871695,-0.02340682,0.04721767,0.00317356,-0.01625212,0.03897284,0.01462231,-0.03456263,0.0158546,-0.0299431,-0.00547681,-0.02545043,0.06085344,0.00653532,0.0030695,-0.03894022,-0.01816817,0.02110912,-0.00890307,-0.03192041,0.01771375,-0.04214921,-0.04360784,-0.01393511,-0.00903741,-0.02083059,-0.01242063,-0.00428964,-0.02684457,0.02241268,-0.03329467,-0.00235611,-0.00552034,-0.01032451,0.00714917,-0.02699556,-0.02342774,0.01247192,-0.01076999,0.01934009,0.00328184,0.03936656,-0.0014576,-0.01654891,-0.03534614,-0.0432429,0.02202761,-0.018453,-0.01497249,0.02804604,0.03459474,-0.02995791,-0.04085238,0.03777612,-0.01546991,0.0157123,0.00122948,0.02622568,0.0335282,0.00744052,0.03330654,-0.05506279,-0.001174,-0.00708523,0.0294323,0.01824567,0.00143393,0.04232821,-0.06040385,-0.01464205,0.02383581,-0.05123284,0.00938258,0.02928782,0.05227207,-0.01079916,-0.01410003,-0.01204,-0.02557588,0.0157955,3.708e-05,0.00518816,-0.0336553,0.00243811,0.02381591,0.03711917,0.04084094,0.0252227,0.01415998,0.0159618,-0.01218152,-0.06005551,-0.01987587,-0.00817532,-0.01721551,0.01228021,-0.00927993,0.03237562,-0.01893953,-0.00741955,0.01584111,0.01718636,0.00039667,-0.0198275,0.01739465,0.0210327,0.03173649,-0.00445606,-0.04321412,0.01365853,-0.03636343,0.0248693,8.704e-05,0.01361168,0.00185229,-0.00440249,0.05091787,0.03971865,0.00849699,-0.02483752,-0.03415262,0.01993976,0.02533131,-0.03952592,0.03657481,-0.0348433,-0.00585253,0.01620834,0.00169753,0.00017085,0.0082593,0.01760128,0.01115563,0.02372283,0.03805904,-0.01775003,0.04908802,0.02562341,0.02571354,0.01190107,0.00601076,-0.03010019,0.00776002,-0.00381255,-0.02233544,0.01187258,-0.00905672,0.03053752,0.05200228,-0.02422894,0.00709738,-0.00025211,0.02136952,0.00034392,-0.00200548,0.00130016,0.01943425,0.06626613,0.01977468,-0.01691746,-0.01770649,0.02880748,0.01895349,-0.00737802,-0.05296071,0.02439468,-0.04626649,0.02740278,-0.03625131,0.04445452,0.01922825,0.00835498,-0.0526611,-0.06749303,-0.01603781,0.01954151,0.05005882,-0.0070704,-0.01940543,-0.01570391,0.00441545,-0.01108668,-0.05442308,-0.01670143,-0.01059774,0.01752074,-0.06391432,0.03781927,-0.01695013,0.02088787,-0.02206766,0.00496843,-0.02821834,0.01572695,0.01987878,0.00396188,0.00195579,-0.02983179,6.046e-05,0.0198267,-0.02307666,-0.02041255,0.00657995,-0.02120894,0.00090329,-0.00063061,0.0139484,-0.00192634,0.00748085,0.00270194,-0.04481599,0.0078334,-0.04140339,-0.03216423,0.04422616,-0.02311127,-0.01176176,0.00980114,0.00900921,-0.0030602,-0.02525945,0.00114545,0.01119134,-0.00639476,-0.01767316,0.01671277,0.0103888,-0.00956163,0.01049109,-0.01954674,0.01505644,-0.02900315,-0.02895028,0.00830926,0.02128665,0.02736378,-0.04085894,-0.02404778,0.01136979,-0.00074225,-0.00065275,0.00399793,-0.02007512,-0.05919345,-0.01591418,-0.02689001,0.00152123,0.00115118,0.01409549,0.03262617,0.00942256,-0.00483864,0.04416467,0.06009113,-0.02810059,0.00559868,0.04166006,0.00589724,-0.02988768,0.02796317,0.00723485,0.03122266,0.01483251,0.0087475,-0.00800246,-0.01393756,0.00741877,-0.06317014,0.0206882,0.01217836,-0.00564205,-0.03911038,-0.01853193,-0.0404176,0.03098148,-0.00150977,0.00586242,-0.01993847,0.00184586,0.00934614,-0.0103445,-0.04661322,-0.0096946,0.0128489,-0.00869241,-0.02042619,0.04677385,-0.00015355,-0.00480127,0.03321138,-0.01705139,0.01436771,-0.02726793,0.00131528,0.02408233,-0.00373428,-0.00962523,0.01607804,0.01045987,0.02994437,0.02071449,-0.03348947,0.01449282,-0.016202,-0.00089973,0.01236868,-0.05554949,0.04350934,0.02600077,0.00384039,-0.00279477,-0.00482169,0.00431905,-0.01065153,0.03246674,0.02836045,-0.02321678,0.02207868,0.01910031,0.01566127,0.00042374,0.01989748,-0.03069407,-0.05582697,0.0107923,-0.00139367,0.0238695,-0.01801017,-0.01479372,-0.00445581,0.02234219,-0.02087962,0.02209696,0.01287692,-0.02966806,-0.00031241,-0.0143604,0.01517783,0.00347473,-0.02760526,0.0159824,0.0016325,-0.00644338,0.02203678,0.00022102,0.0529952,-0.025479,-0.03924432,-0.00501382,-0.05646667,0.01489389,-0.01493511,-0.0130766,0.01687213,-0.03078139,-0.00850675,-0.02272635,0.00720949,-0.02041766,0.03415588,-0.0248571,0.0023104,-0.0247592,-0.04108223,0.03639061,0.01674609,-0.03397712,-0.01450399,-0.02240996,-0.00072088,0.00342605,0.00597812,-0.01631525,0.011477,0.00965697,0.02033102,0.01148127,-0.02555183,-0.0265726,0.01284754,-0.01495519,-0.00515583,-0.02001683,0.03815986,-0.00229736,-0.02310258,0.0226761,0.00278904,-0.01350651,0.00695184,0.02042552,-0.05059427,0.00275734,0.03169506,-0.02897493,-0.01386989,-0.0028344,0.00505412,0.01399344,0.02802293,0.01642472,-0.01416925,-0.02300167,-0.00220832,-0.0111718,-0.00538605,-0.02276009,-0.02103129,0.03054696,0.00257594,-0.02833355,-0.01572051,-0.01324298,-0.04616626,0.04057537,-0.03310447,0.0263097,-0.00706536,0.00340782,0.00984858,-0.00261723,0.01123163,0.0083985,0.00656447,-0.02110015,0.02317457,-0.00794392,0.06028161,0.00475301,0.00361293,-0.00719581,0.05788781,-0.0056783,-0.00100228,-0.00392191,0.00070736,-0.04288752,0.01663763,-0.02205065,0.01083906,0.03758568,0.01749582,0.01111681,-0.01177648,0.00863583,0.01851984,0.01873771,0.01455308,-0.02064224,0.02454328,-0.04521758,0.01787649,-0.00780526,0.00055838,0.02356826,0.02839326,0.02170918,-0.0265186,0.02877929,0.00628608,0.00887769,-0.00790526,-0.01489876,0.02215409,-0.02347877,-0.02509503,0.03759361,0.00016604,-0.02499725,-0.00304363,0.00658156,0.00777021,-0.03260398,0.00286667,0.01002425,0.02558024,-0.0026007,-0.01077456,-0.0001024,0.01438906,0.05184367,0.02009256,-0.01082569,-0.02303855,-0.01393743,0.0168704,-0.01917835,0.02715914,-0.00246411,-0.01252694,0.04746958,-0.04921363,-0.03285671,0.00310956,0.02176592,-0.00190481,0.01978827,-0.01715973,-0.01026821,0.04905802,0.00563966,-0.01595354,-0.00354391,0.00431892,0.00739456,0.02177584,-0.01407048,-0.03186248,-0.00588721,-0.00944818,-0.00478569,0.00558939,0.02472324,0.00332914,0.04074945,0.00927855,-0.01116313,-0.01550003,0.00154511,-0.0017418,-0.04873967,0.01447289,-0.00907573,-0.00179901,0.00749363,-0.00433068,-0.02608486,-0.05364877,-0.00645419,0.01728905,-0.02441305,-0.00814198,0.03481293,0.0147236,0.03517028,0.00917559,0.00011265,-0.00568012,-0.04405401,0.02875754,0.0279393,-0.01506853,-0.00177787,-0.02247742,0.00747993,0.0118814,-0.0133552,0.00118315,0.02018644,0.00297473,-0.00641306,0.0456353,-0.00647489,0.0200033,0.01279277,0.01199401,-0.00695114,0.0009195,0.01123275,-0.00192413,0.01840435,-0.01565804,-0.01201813,0.01211902,-0.00597192,0.0056437,-0.00480327,-0.03847197,0.01819092,0.04456476,0.0151484,-0.02652704,0.00466516,0.00544496,0.00447604,0.01427678,0.01675158,-0.02747233,-0.03374033,-0.00503358,0.04177044,0.01915307,0.05971016,-0.01837555,0.01115413,0.01118853,0.0060169,0.00215303,-0.03310582,0.02971147,-0.00934719,-0.04160812,-0.03740922,-0.03023567,-0.00227965,0.00698449,0.00974926,-0.00373032,-0.01943662,0.04081656,0.0197938,-0.03900115,0.03097441,-0.01852194,0.02165065,0.01997752,0.03474806,-0.00485918,0.01159828,-0.01923786,-0.00512763,-0.0271613,0.01095731,-0.00909137,-0.00483841,0.02175142,-0.0202448,0.04637528,0.00175621,0.01321923,0.025398,-0.04877454,0.02807936,0.03080685,-0.01121361,-0.00145505,0.00822575,-0.01356617,-0.00399651]
10	26	Nom : Lampe Artisanale | Catégorie : MAISON | Genre : Unisexe | Couleurs : Beige | Tailles : Unique | Description : Lampe décorative faite main | Badge : Tendance	[-0.11454724,0.09698725,0.02405915,-0.02428456,-0.0091208,0.02966879,0.02242013,-0.04266413,-0.01964596,0.02234478,-0.01058962,0.06805245,-0.00427934,0.05565774,0.03737214,-0.12149831,-0.04818289,-0.04596684,0.08025467,-0.00209762,-0.04224006,0.12991063,0.07862606,0.00356679,0.05264975,-0.03447885,-0.00105741,-0.10832969,0.01319296,-0.0223182,-0.04256171,-0.04751677,-0.01163671,0.05664051,-0.02897701,0.03314606,-0.06066765,0.04554595,0.05032636,-0.05311057,-0.01223998,-0.01349215,0.00869431,0.01488763,-0.05098903,-0.02544053,0.02753533,0.04869475,-0.07807882,0.03885512,0.02963592,-0.08949658,-0.00275365,0.01000593,-0.06560152,0.10326774,-0.03572388,0.02335546,-0.02894499,-0.02983953,-0.0324722,-0.02423981,0.0692226,-0.04136326,-0.04136533,-0.11651059,0.03853041,0.05955426,0.02316241,-0.04977749,-0.0317072,0.01314149,-0.1026914,0.00767565,-0.01411465,0.0826088,-0.08461801,-0.06376842,-0.01350064,-0.01706642,-0.11461709,-0.05845905,0.00395203,0.08030415,0.08739714,-0.02178434,-0.01031669,-0.00964541,0.01623737,-0.04527406,0.00311641,0.0522255,0.00446331,0.02646924,-0.02454113,-0.03676486,0.00681086,0.02706214,-0.0191392,0.02190714,0.03031004,0.01205265,0.01766418,-0.03287207,0.0865952,-0.0228155,0.01224653,-0.05442281,-0.02127112,0.08466313,-0.05954598,0.08044679,-0.05140328,-0.03277474,-0.05455453,-0.00930212,-0.02796259,-0.08959991,0.02206551,0.00405475,-0.00347667,0.02704412,-0.03000436,-0.04891879,-0.00476217,-0.06680788,0.00933196,0.00013374,-0.05785324,0.02868411,0.05539322,0.00343325,-0.01805869,0.01277234,-0.03073643,-0.03262045,-0.03502291,-0.04311758,0.01709361,-0.02696963,-0.02882128,-0.03963995,-0.0327973,-0.03418122,-0.06152853,-0.01191646,0.08761181,-0.00257421,-0.00268443,-0.03273063,0.0189347,0.05134947,0.02520462,-0.00650927,0.01305103,0.0302604,0.0050906,0.01683288,-0.01854328,-0.05213163,-0.01413013,0.04115532,0.06004692,0.02935597,-0.04857676,-0.08190584,0.01664619,0.01678422,0.0036219,0.03960048,-0.08457436,0.04002582,-0.00807971,0.01316462,-0.01200925,-0.0529642,-0.02400324,-0.06874691,-0.04051411,-0.01223467,0.0239339,-0.00618409,-0.02297557,-0.01337541,-0.00947969,0.08319025,-0.01382698,0.03269991,-0.02239384,-0.00845839,0.0033008,0.00797526,0.01689003,-0.02941391,-0.02133802,-0.0322064,-0.01935597,0.09468924,-0.03483908,0.00476486,0.01460617,0.05762437,-0.01217109,-0.02019083,0.03785324,-0.03883893,0.05904941,0.04071951,0.03519856,0.05344914,-0.04083053,-0.03971181,-0.02934442,-0.01836319,0.03733548,0.05589734,0.0673779,0.0022267,-0.02365991,0.01611594,0.03995201,-0.00184706,-0.05208241,-0.02424461,-0.03505047,0.03139228,-0.01636509,-0.04063091,0.03049802,0.07197917,-0.00349528,-0.01591622,-0.04012133,0.03383829,-0.04380809,-0.00563929,-0.02110848,-0.07628284,0.02319833,-0.07130276,-0.03079356,-0.00125172,-0.00333215,-0.03328997,-0.01516155,0.01951106,0.00988605,0.03201811,0.03082107,-0.0290607,0.02699155,0.01478623,0.03204321,-0.03277893,0.00224744,0.06022666,-0.03090882,-0.02125868,0.00855803,-0.01463398,0.06721994,-0.02339389,-0.05538012,0.02222478,0.0075643,0.02312641,0.01783803,-0.00110766,0.03470918,-0.00537412,0.03572622,-0.0019494,0.00754907,0.00323778,-0.00569498,-0.01677832,0.03380063,-0.04163788,0.047907,0.00496875,0.0694391,0.00360589,-0.00081822,0.03135798,0.0128132,0.00240375,0.0270358,-0.0060006,-0.01316991,0.0029618,-0.00582298,-0.0069566,-0.01201955,0.01690625,-0.02468257,0.01479792,0.04781849,0.01177333,3.234e-05,0.02898338,0.01446894,-0.02148598,-0.04187377,0.01365424,-0.06148269,0.01321249,0.00065535,0.00927065,-0.02332328,-0.04563719,-0.03204513,0.02193424,0.01685035,-0.05357167,0.04400152,0.01854298,0.02538586,0.01329001,-0.00292694,0.00957483,-0.01545072,-0.01950479,0.03110699,-0.03922907,0.03053431,0.0099844,-0.03424162,0.00389452,-0.0220711,0.00411711,0.05687847,0.03889223,0.01232767,-0.06244472,0.01798147,-0.00055774,0.01903387,0.00755808,-0.02023109,-0.00678234,-0.0176274,-0.02250932,-0.02995123,-0.01202467,0.00871891,0.01172121,-0.01414362,0.00407617,-0.05499079,-0.04094091,0.02226644,-0.07026177,-0.00819657,0.03003396,0.00544845,-0.01170093,0.02424654,-0.00910662,-0.01653013,-0.01008175,-0.03763602,-0.00941333,0.01392185,-0.01760277,-0.01735216,-0.00813974,-0.00367213,-0.07015552,-0.04614003,-0.02241908,-0.02675031,-0.00113377,0.03640433,0.00039828,-0.01169003,0.00947279,0.01556656,-0.03091697,0.0108808,0.0211835,-0.01790965,0.03555277,-0.01453936,-0.03604853,-0.02689176,0.03530081,-0.01325377,-0.03438189,-0.00713978,0.00872041,0.0389308,0.04765621,0.01340981,0.0264847,0.02661118,-0.00383694,0.01734003,0.02475676,-0.01804809,-0.0099289,0.02433796,-0.0347454,-0.02275456,0.05219257,-0.0389077,0.01032272,-0.02567512,-0.00077631,0.00936448,-0.00467304,-0.03046236,-0.04955117,-0.01720209,-0.0372175,-0.01806975,0.01775809,-0.01063247,-0.0056639,-0.01820796,0.00123333,-0.05094109,-0.02525023,-0.00433314,-0.06246072,0.04837337,-0.02316719,-0.02578246,-0.00616863,0.00606323,0.04153128,-0.01936475,-0.0174564,0.0710768,-0.01468571,0.01069578,0.014859,0.02998234,-0.01891221,-0.03935779,-0.01651488,-0.01163482,0.01425289,-0.02052176,-0.01458604,0.02657102,0.01761013,-0.02415721,-0.04475921,0.02770029,-0.0163319,-0.00995024,0.01772354,0.0368672,0.03007158,-0.01109022,0.03287098,-0.00433956,0.00690234,-0.02717475,0.01848827,0.0596605,-0.00661306,0.04531772,-0.03832116,-0.02895409,0.00361744,-0.06724614,-0.01284429,0.04414479,0.0411323,-0.02885912,-0.00089162,-0.04794455,-0.051611,-0.04248111,-0.01961515,0.00658759,-0.03448029,-0.02195328,0.05135953,0.02849758,0.0298184,0.02266764,-0.00558696,-0.00105389,0.03478049,-0.05868787,0.01030269,0.00326901,0.03131277,0.02018556,0.00828674,0.02295085,-0.03026297,0.01284516,0.05351936,-0.01479476,-0.04731455,-0.05813523,0.0218441,0.05006293,0.06203279,0.01947259,-0.04788544,-0.01971455,-0.03422543,0.01958081,-0.00219845,0.02707615,-0.02499158,-0.02416144,0.04352501,0.01746503,0.02898479,-0.01714123,-0.04612539,0.03797914,-0.00068939,-0.02065354,0.0562017,-0.02521148,-0.00037182,0.00018775,0.00876436,-0.00473525,-0.00403462,-0.0033219,0.01849006,0.02335792,0.02107514,-0.02294983,-0.00961049,0.05856021,0.04545398,0.0511725,-0.00181602,-0.00915929,0.01424384,0.01005758,-0.00911947,-0.01833427,-0.03020157,0.02096075,0.03621153,0.01249167,-0.02220404,-0.00496675,0.03385166,-0.02564735,-0.00212198,-0.02141884,0.04185809,0.01827831,0.00987358,-0.02012607,-0.01881355,-0.01690461,0.01518558,0.03695378,-0.02906202,-0.01802563,-0.02792083,0.02049694,-0.0359179,0.03300704,-0.01335546,-0.00314108,-0.04063292,-0.04576426,0.004751,0.03155165,0.02358041,0.00203133,0.02267464,-0.03949787,0.01859106,-0.01131406,-0.02384939,0.00346171,0.00779764,0.01665742,-0.05203993,0.01612069,-0.01925995,0.06012041,-0.01896815,-0.01566812,-0.02396,0.0170127,0.0001614,0.02296868,-0.01059711,-0.00998442,0.03766568,-0.0129026,0.00681745,-0.00279049,-0.00038496,0.03170565,0.00917959,0.0152587,0.01905297,-0.01451395,0.05224679,-0.01392205,0.01473661,0.00264565,-0.02557288,-0.02692269,0.04813541,0.02604144,0.02328342,-0.02093947,0.00087878,-0.01311148,-0.01604144,-0.01477718,0.02973365,0.00591215,-0.0094463,0.00691487,0.00881472,-0.01018419,-0.00754161,0.01242104,-0.02309244,0.0296376,-0.04003805,0.00583678,-0.02939217,0.02556242,-0.06264775,-0.03239176,-0.0063262,0.01845646,-0.02165644,0.03703621,0.01013648,-0.04923534,0.01520494,-0.01482407,-0.00968243,-0.01770075,0.02186375,0.02677569,0.00139576,-0.01542984,0.05623227,0.04866555,-0.03738915,0.03319536,0.05438507,-0.00123579,0.00179953,0.00566763,-0.00466473,-0.01126184,-0.01415972,0.0350774,-0.02203162,0.00622089,-0.00295627,-0.06205703,0.0146016,-0.02284602,0.01826332,-7.168e-05,0.01957402,0.00071617,0.01656591,-0.00267873,0.00855354,-0.02424654,0.01325727,0.02687994,0.00834082,-0.04418058,-0.00671623,-0.0010192,0.010537,0.00852047,0.02661569,-0.02682482,0.00027394,0.0307166,-0.007128,0.037909,0.01065428,-0.00447643,-0.00361725,0.01136218,-0.01943584,-0.00439027,0.02389433,-0.01132707,0.00869863,-0.00104234,0.03119461,-0.02705459,0.00339317,-0.02247757,-0.0320333,-0.03044708,0.00784152,0.03014903,-0.06391323,0.00489418,0.00278506,-0.00636492,-0.00374875,0.01455859,-0.01812523,0.03483722,0.0035902,0.01297374,-0.01507018,0.03289324,-0.01417354,-0.03343111,-0.01121386,0.02592227,0.04438043,-0.01462002,0.02444977,-0.01878761,-0.03385448,-0.03405751,-0.00899917,3.82e-05,-0.0188111,-0.01090613,0.0034938,0.03110069,0.00505808,-0.03563846,0.0001394,0.0347281,0.0400895,0.02786471,0.01318749,0.03053049,0.00338039,-0.01385333,-0.01767801,-0.02636181,0.03839757,0.0095329,-0.03825558,0.04178688,-0.04474392,-0.02636499,-0.0207161,-0.02228555,-0.00805101,0.01840958,-0.01686925,-0.00700888,-0.01001064,0.00132666,0.03353893,0.00860362,-0.02281059,-0.04051375,-0.01684652,0.02194325,0.00266949,0.0057248,-0.01427862,-0.01180685,-0.00409061,0.01892562,0.01668178,-0.00990715,-0.03508831,0.02261403,-0.05022667,-0.03281213,-0.00761863,0.03049119,0.01973911,0.00905466,0.00086152,-0.01740289,-0.00149466,0.00490192,0.0179142,-0.02172798,-0.0435694,0.00622347,0.00591191,-0.00166818,0.03686975,-0.00504043,0.00343979,0.02018174,0.03266108,-0.01494758,0.00710689,-0.01528903,-0.00467908,0.01225206,0.01090947,-0.0110691,0.04700128,-0.00252711,0.00867147,-0.01340849,-0.00024572,-0.02091773,0.07522038,-0.0165127,0.00475081,-0.00946006,0.03569049,0.02028425,0.03289454,0.00304746,0.00303396,0.0155949,-0.0210136,0.02072611,-0.02887523,0.03599112,0.00432065,0.0221652,-0.00638731,0.03166399,-0.00342431,0.02314188,-0.02297132,0.02089917,-0.02715147,-0.02577282,-0.02571105,0.01625829,0.00069097,0.01776859,0.0389499,-0.00479333,-0.01283405,-0.01646631,0.00458466,0.02253342,-0.01436573,0.06050611,-0.02871831,0.01043007,0.00871341,-0.00709812,0.04120252,0.03962031,0.01131158,-0.03391707,0.01658581,0.02399225,-0.00764807,-0.01952189,-0.00368604,-0.01075363,-0.00385561,-0.02569714,0.02704804,-0.0324289,-0.02226153,-0.01818322,-0.01364532,0.01272605,-0.04448922,0.03132569,0.00404669,-0.01884767,-0.01498212,-0.02584282,-0.0074827,0.00407963,0.03483289,-0.00962109,-8.941e-05,0.01957428,-0.01091273,0.00305473,-0.00978905,0.00548277,0.00909636,-0.00662768,0.02933177,-0.03505804,-0.0097294,0.03120689,-0.02143003,-0.01137214,0.0311847,0.00577587,0.01585526,0.02491897,0.03024655,-0.01729614,-0.01171748,0.00131138,-0.03408116,0.03564192,-0.02498353,-0.01829261,-0.01554139,0.01129573,0.00129514,0.01609602,0.02097603,0.03376311,0.02242081,0.00839847,0.01551271,-0.03037749,0.03124251,0.01133779,-0.03535652,0.01221071,-0.00982748,0.01611375,-0.00314943,0.00663496,-0.01227214,-0.0495035,0.01681654,0.01374933,0.00567345,0.00661178,0.00376301,0.01585296,-0.00085093,0.00625161,0.00780914,-0.00990676,-0.01917432,0.04838029,0.06645876,-0.02038595,0.0188501,-0.01810104,0.00744997,0.02734112,0.01592272,0.01184942,0.04316115,0.02679625,-0.00868079,0.04579473,-0.01239293,0.02541724,-0.00025577,-0.00660542,0.01661942,0.00093554,-0.01208668,0.00053097,0.00490499,-0.0158042,0.02699837,-0.00618839,-0.02976221,0.00481027,0.00093447,-0.03133161,0.01707178,0.03687202,0.00935502,0.011198,-0.02946185,0.03124674,-0.00463978,-0.01335731,-0.01311932,-0.0688995,-0.025613,-0.00682014,-0.00116261,0.00247802,0.03568581,-0.00174407,0.00508431,0.01268802,0.02748403,0.03059644,-0.01446075,-0.02224053,-0.0018736,0.00851339,-0.03290473,-0.00431263,-0.0175651,0.0362642,0.02240894,-0.01729178,-0.00901728,0.04046063,0.01698637,-0.01022304,0.0119941,-0.00359496,0.03703212,0.04831479,0.04780503,0.02876998,0.0131578,0.00079006,0.00613932,-0.01877035,-0.00216735,0.02015454,-0.01133165,0.00824325,-0.00931975,0.03471573,0.00249072,0.00589859,0.0311485,-0.0446264,0.00650194,-0.00151945,0.03571451,0.00024042,-0.01135995,0.00214492,0.02423995]
11	27	Nom : Robe Verte Nature | Catégorie : TENUES | Genre : Femme | Couleurs : Vert | Tailles : S,M,L | Description : Robe confortable pour tous les jours | Badge : Promo	[-0.11771118,0.06815873,-0.06260061,-0.03972813,-0.09070723,-0.01923405,-0.0022302,-0.04843722,0.08506186,-0.0642077,-0.02308223,0.00543537,-0.00615585,0.00268632,0.07115078,-0.11027396,-0.00890695,0.00215283,0.07028637,-0.10356696,0.02650796,-0.01376681,0.06006971,-0.01328908,0.13473822,0.07972588,0.02093863,-0.08400024,-0.00205388,0.02069085,-0.03297824,0.00326217,-0.03316071,0.01336319,-0.03345947,-0.01813336,0.04731154,-0.03018007,0.04280463,-0.0587052,-0.01409799,0.0073241,0.04859402,-0.03234112,0.01474105,-0.09779841,-0.0217148,-0.03774684,-0.01646048,0.08792414,0.01869508,-0.00250638,-0.0151196,-0.02112085,-0.07270912,-0.0334263,-0.02507568,-0.08922228,-0.07504389,-0.02628893,0.03801894,-0.07356546,-0.03330695,0.03632085,-0.0271984,-0.00153562,0.00365914,0.04356378,0.08031975,-0.02401667,-0.04148232,0.01180089,-0.01829701,0.05613775,-0.0224377,-0.03751672,-0.10749672,0.0239406,-0.01074447,0.07660809,-0.08330314,0.0242472,0.03544547,-0.01639239,0.0436908,-0.0208013,-0.05393239,0.00561499,0.02749388,-0.03240105,-0.08852167,0.04251223,-0.03190993,0.02642083,-0.06649151,-0.01908517,0.03337261,0.0314879,-0.03119454,-0.02192724,-0.01754263,0.02344214,-0.03494139,0.04564065,0.07861678,-0.04103706,0.00319963,0.07748826,0.11196317,0.08464836,-0.08339318,0.04739475,0.03138388,-0.0040747,-0.02548962,0.02108465,0.0121472,-0.01103904,-0.03293874,-0.01867609,0.02077837,-0.007385,0.02577938,-0.04257492,-0.0119561,-0.03559555,0.07405265,-0.01809984,-0.02391508,-0.00915082,-0.03910595,-0.04627594,-0.01401382,-0.00218121,0.00881105,-0.07635158,0.00088411,-0.0358791,0.04992124,-0.06095244,0.00219029,-0.04462297,0.02858933,0.01663576,-0.05424609,-0.00342739,0.05836217,0.04426413,0.01332428,-0.01177115,-0.03126428,0.10695419,0.01507344,0.04819449,0.0269173,-0.00431663,-0.06304197,-0.04670484,-0.02580596,0.00641439,-0.0187979,0.07932337,-0.01408228,0.0104938,-0.0278344,-0.0305752,0.00849258,0.04459387,-0.04257235,0.06132343,-0.04703396,-0.02280883,0.0157599,0.00525063,0.00667593,-0.046454,-0.03588295,-0.04602135,0.01421131,0.03498721,-0.00336664,-0.04554644,0.01445756,-0.05559887,-0.08250164,-0.02314354,0.02124127,-0.04313084,-0.02673708,0.01886691,0.01943732,0.03067931,-0.00568064,0.00262636,0.01339484,0.00761282,0.00482656,0.01779356,-0.00610782,0.03568023,-0.03791052,0.02098576,0.02710868,-0.06895201,0.01809314,-0.02376923,-0.05480155,0.01434617,0.06011938,-0.02439645,-0.03595022,0.02045074,0.00145081,0.03474709,0.03969156,-0.05323625,-0.00466359,-0.07114587,-0.05045654,-0.00632447,-0.03940874,-0.02834685,-0.04474637,0.01182788,0.02191189,0.00071946,0.01460301,-0.02405685,0.00892217,-0.01343973,0.00322145,0.09778228,0.03276279,0.01167391,-0.01295589,-0.01290605,0.00712467,-0.01255117,-0.00478986,-0.04853169,-0.00201104,-0.01423351,0.01904194,0.00287687,0.03172123,0.0452737,0.01526224,-0.00403873,-0.01004295,-0.02396736,-0.00686593,-0.04204411,-0.01423826,-0.01768594,-0.0347383,0.04681555,-0.01349313,-0.0105397,0.01593673,-0.00911744,0.02358085,-0.04375087,0.00489839,0.0246131,0.00510602,-0.009979,0.02704922,0.04814936,0.02077677,0.0060326,0.00380728,-0.00544286,-0.00842962,-0.01897902,-0.01293974,0.04024309,0.00765498,0.00708426,0.02685704,0.03735588,-0.02984422,-0.00205018,-0.00059973,-0.04176679,0.01922346,0.00894373,0.00781932,-0.01716064,-0.01376656,-0.03219245,-0.07922293,-0.03078065,0.01697095,-0.02597763,0.00543961,-0.0127037,-0.02179103,0.00543211,0.00348157,-0.05750144,0.02869216,-0.00895748,-0.01632709,-0.01844798,-0.06208424,0.03581225,-0.03549236,0.039294,-0.01599511,0.00096814,0.00777384,0.01869872,0.00548412,-0.04433085,0.04723712,-0.04230933,0.03618346,-0.04507043,-0.02125575,0.01394171,-0.02324726,-0.06492034,0.05967674,-0.02124136,-0.01172503,0.03227559,-0.02883797,-0.00715001,0.01209778,0.01323978,0.0364156,0.01017629,0.016361,-0.02994108,0.02337524,-0.00698817,0.01633574,-0.02393877,-0.03675102,-0.00393516,0.02989418,-0.00024922,0.01366176,0.01217259,-0.01104876,-0.00198367,0.00155142,0.00882218,0.00776187,-0.02511454,0.01105187,-0.04980979,-0.0163138,0.04735149,-0.03149017,-0.00392143,0.02620208,0.00307467,-0.06077502,0.01870351,0.03960193,0.03077708,0.00304615,0.02263016,-0.02198156,0.02061856,0.02545111,-0.03415818,0.01616058,0.00880889,-0.01001415,-0.01494604,0.00247527,-0.02501506,-0.0245363,0.0172408,0.01016296,-0.01819858,-0.05018591,-0.01541397,0.00576598,0.03999858,0.01645709,-0.02847134,-0.03986039,0.03874486,-0.05241895,0.03321166,-0.02581439,0.03737715,-0.00296962,0.00312998,0.04503785,0.04483325,-0.01459325,0.02273894,-0.03221447,0.0122895,0.01636709,-0.01044949,-0.02500772,0.01480124,-0.00564198,-0.03934588,-0.00410931,0.01184968,0.01902839,0.01409978,-0.02803075,-0.03050802,-0.04876662,-0.00737397,0.03545662,0.01111135,-0.01385229,0.02717221,0.02722775,-0.02143858,-0.0502431,-0.03501722,-0.03241352,0.03081123,0.00614209,-0.02102182,-0.02518387,-0.01713551,-0.00501742,0.03431196,-0.02558376,0.05246963,-0.02564705,-0.00852282,0.05335446,0.01487038,0.01538919,0.05062214,0.00653122,-0.02281391,-0.03707554,-0.04431069,0.05100559,-0.00500695,0.00407004,-0.01223232,0.08268934,0.05115314,-0.03535287,-0.03590586,0.00690045,-0.00045948,-0.00194397,0.02975131,0.02948198,0.03080289,0.02600281,0.0682577,0.00412848,0.02750626,-0.01888524,-0.00563028,-0.00705319,-0.00834332,0.0162595,-0.04635952,0.01355426,0.00734224,-0.0192137,-0.00180111,0.00389003,-0.02331494,-0.00925502,-0.02280172,0.01034286,-0.00737924,0.00638129,-0.0052998,0.00746154,-0.02277489,-0.01454788,0.06427149,0.1176584,-0.00413519,-0.01518487,0.00747623,0.02213456,0.03097587,0.02547283,0.0363311,-0.05143092,0.01786837,-0.02931186,0.00768302,-0.01293181,-0.01834952,0.00895837,-0.00957916,-0.01464131,-0.04155765,-0.04586536,0.04800401,0.03337795,0.03426039,0.02163833,-0.01065965,-0.01494613,0.02378991,0.02641384,-0.04655894,0.04271138,0.00491809,-0.01730581,-0.01696907,0.03576601,-0.01452437,-0.01867767,0.00548071,0.01052888,0.01559938,-0.02172663,0.04532942,-0.0458052,-0.00109637,-0.01110544,0.00616482,-0.04433222,-0.00544321,-0.02592033,0.04043628,-0.00913906,-0.0105064,-0.00532372,-0.01621728,0.03015629,0.01965928,0.0052315,-0.01404653,-0.00832949,0.08663084,0.04210056,-0.00150043,0.00564017,-0.03070735,0.04988696,-0.01656582,0.02794717,0.02298884,0.01448781,0.02590429,-0.00974696,-0.00565964,0.04547605,-0.01829557,-0.00755012,0.02991453,0.00988369,0.01987373,-0.05166984,0.02924157,0.00810858,-0.0392663,0.03363635,-0.02322448,0.00471712,-0.02145311,-0.02992168,0.04179648,0.02122661,-0.02747714,-0.00218704,0.00605556,-0.01003131,0.03739767,0.0114942,0.00143047,-0.00802917,0.00436149,0.08229636,-0.02423215,-0.01967683,0.02768259,0.02343295,0.02195048,0.04374212,0.03899281,0.0365274,-0.00457731,0.04876889,-0.01337862,0.01970121,0.0004432,0.0284912,0.00689496,-0.02744041,0.00283966,-0.01553637,0.02123133,-0.02176457,0.032315,0.0054213,0.00209471,0.0078522,-0.04290106,-0.02740444,0.0453998,-0.03603508,0.00196538,-0.01485764,-0.03136015,0.02723746,0.02723055,-0.02034988,0.01190379,-0.02042507,-0.00594414,0.0312389,-0.0273171,-0.00670452,0.05143312,-0.00394564,0.0319607,0.01346316,0.03413765,-0.02030974,0.00287012,-0.00980888,-0.01737187,-0.02828626,-0.0030323,0.0229091,-0.02202693,-0.00584059,-0.05337152,0.0116209,-0.0096699,-0.00184231,-0.0107033,-0.02252165,-0.00876465,-0.04527425,-0.00247964,-0.00099848,0.02081429,-0.00329902,0.00152021,0.00067829,0.02371923,-0.00511841,0.00303659,0.0368632,-0.00026627,-0.00556316,0.00472644,-0.00795072,-0.0114862,0.00239429,0.01939608,0.00937373,-0.01368403,0.03706775,0.02465287,0.01219643,-0.00782072,-0.06461387,0.05426029,-0.01596615,-0.02815032,-0.04940876,0.01169665,-0.04682435,0.02034307,0.00058591,-0.02894661,-0.0211723,-0.05279525,0.01830595,-0.02532674,0.00728608,0.00377876,0.00846895,-0.03465467,0.00480707,0.01731848,-0.04323513,0.01288149,-0.01576691,-0.00154249,-0.00319816,-0.0051792,0.00856478,0.02173698,0.00992724,0.0113385,0.02712712,0.00638995,0.02204926,0.00753181,-0.03103148,0.01442466,-0.02655431,-0.03511606,-0.01453088,-0.01112739,-0.03566337,-0.015824,0.00630237,-0.0516823,-0.0361918,0.0026267,-0.01271511,-0.05702891,0.05330846,-0.00323111,0.03934157,-0.01281946,-0.00232845,0.03290612,0.01641576,-0.03270945,-0.0039896,0.01008062,0.00159358,-0.02027327,-0.01742588,-0.01543506,-0.00968017,0.00320369,-0.04834786,-0.04114891,-0.03196711,-0.01839728,-0.04968956,0.02438554,0.01814951,-0.00206592,-0.03871865,0.05115552,0.02698801,0.00463251,-0.00476115,0.03036405,0.01059526,-0.01912978,-0.00206663,0.01028828,-0.00787426,0.03812272,-0.00414029,0.00797142,-0.00675378,-0.01576805,0.00759073,-0.01190093,0.0391685,-0.01880299,0.00171305,-0.04922766,0.04838086,0.01324825,-0.04232601,-0.00859875,0.01224331,-0.00038691,0.0141802,0.00342376,0.00808054,0.02155012,0.00979416,-0.00291971,-0.01323341,-0.02535936,0.05058439,0.02213482,-0.00821633,-0.00269281,0.00026252,-0.02905493,0.01254148,-0.00339749,-0.02448835,-0.01130521,-0.01413356,0.03861289,0.02744788,0.01456685,0.05882626,0.01934838,-0.00267991,0.00893813,0.01544761,-0.00265001,-0.00111756,-0.01653507,0.00908956,0.02596639,0.02985184,-0.00884421,0.0130284,0.0265559,0.01458596,-0.00642683,0.0055646,0.00926785,-0.02010172,0.02787138,0.01691129,-0.01226932,-0.02695785,-0.02256967,0.03302526,0.046736,-0.00144305,0.04189319,0.01598506,0.02623026,0.03548191,0.03823953,0.02958249,-0.01731389,0.0343367,-0.01115546,-0.02306525,0.01391202,0.05738486,0.0235095,-0.01282063,0.03069965,0.02429802,-0.01063044,0.01032776,-0.01830703,0.0084777,-0.00840351,-0.02112378,0.0180366,-0.00260851,0.03912465,0.03644217,0.02879691,-0.0538217,-0.02157543,0.01847426,-0.01290697,0.01890676,0.01537311,0.00027491,-0.00170571,0.01449331,-0.00377802,0.00484783,0.04082119,0.00850406,0.00478492,0.00237039,0.01587686,0.00028745,0.01152028,0.03406168,-0.01397303,0.00669495,0.00589753,0.02001597,0.0292171,-0.00652334,0.04696438,-0.02025189,-0.03834034,0.00171015,-0.06550394,0.04473813,-0.01546742,-0.00128311,0.01124485,-0.03931966,-0.03156901,-0.00078055,0.02252152,-0.02228979,-0.02786212,0.01857085,-0.01534021,-0.02587185,0.01139115,-0.00477781,0.00755207,0.01069581,0.00933202,-0.03577151,-0.00692193,0.01261691,-0.02824575,-0.01378337,0.01998719,-0.02729538,0.0139328,0.00395746,0.02309526,-0.03505374,0.00111729,-0.04187255,0.04788194,-0.02514145,-0.00410923,-0.04766675,-0.00743739,0.01627628,0.00781108,0.00380781,0.01083864,-0.01235237,0.02882431,0.01752096,0.04020331,0.01045233,0.00079626,0.02274962,-0.02514714,0.0265032,-0.00081377,-0.00352817,3.093e-05,0.00627122,-0.01844067,-0.02533655,0.00123981,0.01994338,0.00835688,-0.02181428,0.01360279,-0.00625761,0.01608842,0.01313555,-0.02552275,-0.00094124,-0.00750386,0.04049383,0.04795635,-0.01230339,-0.0050725,-0.00628951,0.03546981,0.03688281,-0.00838759,0.01459465,-0.00629798,0.01233306,0.02344543,-0.00745554,-0.05116029,0.04994227,-0.00785718,0.01193506,-0.00429693,0.02423863,-0.027938,-0.01508525,0.03135731,-0.02402272,0.02145132,0.02947089,0.00477261,0.00242901,-0.00831162,0.00093595,0.03060709,0.039485,0.01848787,-0.02132449,0.00188767,0.03643942,-0.02650329,0.02517466,-0.0326266,-0.04207637,0.01332391,0.0030299,-0.049779,-0.02393125,-0.00984157,-0.03016692,0.02643465,-0.00379349,0.01101421,0.01262923,-0.06791312,0.00441938,-0.00533702,-0.01447289,0.01015315,0.01952253,0.01051051,0.01391685,0.03889663,0.00670688,-0.03645922,0.0019685,0.0209596,0.00236393,-0.00276856,0.03567757,-0.00487051,-0.00898861,0.01533067,0.01246787,0.02490554,-0.04325292,0.00580665,-0.04688153,0.03280934,-0.00156979,0.02603727,0.00387189,-0.01652299,0.00989315,-0.00499803,0.01325682,0.06280223,-8.588e-05,0.00578312,0.00485971,0.03253823,0.00318247,-0.020235,-0.01515879,0.02007572]
12	28	Nom : Sac Bandoulière | Catégorie : ACCESSOIRES | Genre : Femme | Couleurs : Marron | Tailles : Unique | Description : Sac pratique et élégant | Badge : Nouveau	[-0.1362456,-0.03200054,-0.08519103,-0.04888673,0.06133973,0.11711159,-0.03058486,-0.02959094,0.06273029,-0.02067434,-0.05667051,0.06082791,0.00969472,0.02490531,-0.00649067,-0.00621531,-0.0770345,-0.06351569,-0.00271792,0.01007757,-0.05846705,0.01788039,0.01729446,-0.11091653,0.04736163,-0.02462272,-0.00829709,-0.1082036,-0.03867321,-0.05266009,-0.04926024,-0.00553412,-0.0952839,0.04714072,0.01144509,-0.05014279,0.02869997,-0.01968757,0.0623752,0.07507745,-0.03355513,0.00147656,-0.01816935,-0.06269176,-0.0684523,-0.04603919,0.01012733,0.01168846,0.06447868,0.0059466,-0.02870654,0.00324116,0.02428027,0.02160794,-0.05075834,-0.00672667,0.06258673,0.02906396,-0.02818881,-0.03452477,0.05361365,-0.15673459,-0.015546,0.0075029,-0.01528991,-0.08696909,0.01588216,0.01445474,0.09941099,-0.01136059,0.01423542,-0.05167778,0.02277894,-0.01290565,-0.00990406,-0.03177699,0.06598455,-0.03049272,-0.02931497,-0.00578689,-0.09438582,-0.04889487,-0.01765115,-0.01889242,-0.02438651,0.03930827,0.06403957,0.00488108,-0.02089305,0.0187604,0.03350382,0.05308778,0.00248993,0.05438175,-0.10800243,0.07504787,0.04496586,-0.05406926,-0.02416934,0.01182888,0.01786557,-0.00229299,-0.02761861,-0.03169017,0.05449935,-0.07656483,0.03806718,-0.07379273,0.05835795,0.02475318,-0.03090155,0.07519552,-0.0037974,0.03551809,-0.05729844,0.05279452,-0.048859,0.0135321,-0.00124431,0.00058139,0.02865384,0.02679517,-0.0137658,-0.01627684,-0.07201616,-0.07549386,0.02581758,-0.03449814,-0.08263925,-0.03749428,0.05475229,-0.02516949,1.493e-05,-0.02194775,0.01101804,-0.01815474,-0.01825903,-0.04043286,0.04052014,-0.04904076,-0.00926838,0.00572871,-0.0537808,-0.04396155,0.00341622,-0.02825704,0.00897733,0.02319988,0.02198441,-0.11065323,-0.03301067,0.0915074,0.03743185,0.00041359,0.01308787,0.00638451,-0.00389554,-0.00915307,-0.05882946,0.06101134,-0.06094986,0.03204667,-0.04486394,0.00064578,-0.03055467,-0.00358822,0.01427524,0.04123489,-0.00679573,0.0277283,0.00345625,-0.06334706,-0.00916807,0.02772359,0.02191506,0.00523716,0.02401483,-0.06908505,-0.01726581,0.02440417,0.01322932,-0.01270678,-0.01557568,0.01923612,-0.03489458,0.03215336,-0.0391916,-0.03303832,-0.03977682,0.01076169,0.00740922,0.02031647,-0.01489888,-0.03625049,-0.03810084,0.02025859,0.00483363,0.07210307,-0.06578486,-0.00415638,0.02442259,0.02128306,0.00917112,-0.01359373,0.00874632,-0.01180454,0.01413545,0.06122694,0.03302842,-0.02176072,-0.00687296,0.02673915,0.03302575,-0.01422753,0.00185203,-0.02968728,-0.02900689,-0.04899915,-0.04582673,-0.00223176,0.03139423,-0.02387936,-0.00014693,-0.0142819,-0.04739048,0.06717719,0.01190033,0.01526208,0.00532519,-0.02626166,-0.00442816,0.01523418,0.070852,-0.01180717,-0.07151544,0.0003454,0.00346291,-0.04606582,0.03852034,-0.02115626,-0.01972865,-0.09505018,0.01985268,-0.02287283,0.05100205,0.06251388,0.01520054,0.02845477,0.01750105,0.02789371,-0.05071434,-0.01763525,0.02295774,-0.0165842,-0.00267117,0.06592686,-0.00339157,-0.00413043,-0.03925021,-0.01468111,-0.02277584,-0.02988198,-0.00845167,-0.02242112,0.0121759,0.03917107,0.0795063,0.07497391,-0.03266798,0.00953298,0.05801588,-0.03261433,-0.00343493,0.00488233,-0.0124703,-0.01775436,0.04447563,-0.03998623,0.03135568,-0.02203981,0.00250284,0.0484572,-0.0590972,-0.02656885,0.027988,0.0446463,0.04511688,-0.06637452,-0.01773957,-0.02258475,-0.02643979,-0.03047729,0.03524701,-0.03552474,-0.03016147,-0.01012282,0.0040252,0.006392,0.00882102,-0.00454633,0.00578388,0.00318636,-0.01048094,0.01352474,0.0003378,0.03533872,0.02991573,0.06480707,-0.02733288,0.00785838,0.00280217,0.05057251,-0.01322387,-0.03971303,0.03144961,-0.01518988,0.01818788,-0.04597003,-0.05952026,-0.00405819,0.01852288,-0.07996949,0.01127515,-0.03666967,-0.00599121,0.00329636,0.00264715,0.01228631,0.04123387,0.02247634,0.07818682,0.02723849,-0.0042886,-0.07765725,0.03626436,0.06108456,-0.01451356,-0.00865144,-0.04172979,-0.00492266,0.03532514,-0.00578492,-0.04378621,-0.00608259,0.00987535,-0.00409394,-0.05129198,0.01496528,0.00721352,0.0140131,-0.01627018,-0.04832832,-0.0567526,0.05421718,-0.01049356,0.02197682,-0.02052744,-0.02758768,-0.02198112,-0.01261831,-0.02784756,0.03414498,-0.00809862,0.00194599,-0.0108758,0.00569528,0.00328945,-0.01167836,-0.02602974,-0.03953968,-0.01558494,-0.0606186,0.01543737,-0.02551896,6.095e-05,-0.02189944,0.00907085,-0.01972116,-0.0273939,0.03124289,0.03345435,0.0385698,0.01521474,-0.02954731,0.00140863,-0.02612175,-0.03218553,0.01006786,-0.027062,0.0325032,0.00475057,-0.00721976,-0.00593678,0.04018546,0.00054971,-0.02542262,-0.00320931,0.07428458,-0.05563873,0.00043014,0.00869859,0.00153363,-0.01048087,0.01727413,-0.02812927,0.00783721,0.01690422,0.02607217,0.00682319,-0.00854669,-0.02179478,-0.00170445,0.03633352,-0.02717696,-0.03039876,0.03869545,-0.02796137,-0.03155982,0.00019746,-0.00645445,-0.00028651,-0.0091296,-0.00934095,-0.0204692,-0.00674442,0.00318213,0.00820323,0.00775678,-0.01375344,0.02834801,-0.02490443,-0.0406775,0.03304938,0.03735549,-0.00551341,0.01046961,-0.02261724,-0.04552326,-0.04106228,-0.01294929,0.0032792,0.01407369,-0.03793609,-0.00413954,0.02363404,0.01688229,-0.02162483,-0.01390518,0.0071093,-0.00790743,0.04633578,-0.04221017,0.04763918,-0.02040462,-0.00966132,-0.00505993,-0.02878353,0.00503899,-0.04569074,0.05732951,-0.00181917,-0.01850902,0.02067097,-0.04770135,0.00218752,0.01319234,-0.00358455,0.04430848,-0.02655184,0.0004861,-0.00921793,0.0336474,-0.02602038,-0.0243939,0.00326762,-0.01158297,0.021988,-0.01034779,0.00311698,0.02511272,0.04576114,0.01159143,-0.02025693,0.00352324,0.02830788,0.02524132,0.04790673,-0.00362773,-0.04328151,-0.01117993,0.00343568,-0.01043212,0.002279,-0.03487905,0.00120958,-0.012505,-0.04210034,-0.03019561,-0.06840459,0.04636684,0.0225002,0.03589113,-0.00030086,-0.01515862,-0.01367231,-0.0102658,0.03166521,0.01261844,0.08355056,0.02025367,0.01517167,0.00715188,-0.01082752,-0.00340138,-0.04428592,0.0025522,-0.0014761,0.02559921,-0.01731684,0.02689225,-0.04086175,-0.00800834,-0.02121289,-0.00189456,-0.01128953,-0.00292376,0.03609424,0.00223192,0.01727986,0.02061204,-0.03607612,0.04353262,-0.00206658,-0.02154475,0.01690274,0.00826217,0.01048494,-0.01393557,0.01318257,0.00492387,-0.00770159,-0.00786813,0.03097366,-0.0062853,-0.01778107,0.01148992,0.02119584,-0.00993607,-0.02617916,0.01435577,0.01085892,0.02228027,0.00767459,0.01442819,-0.05189847,0.04082727,-0.01042967,0.01222889,0.01971395,-0.05099798,-0.01658924,-0.0256505,-0.00066901,0.04452408,0.03892108,0.0087109,0.02643831,-0.01545734,-0.02650127,-0.01236166,4.749e-05,0.04770408,-0.01319622,0.00945018,-0.03643269,0.00092261,0.03305173,-0.04782686,-0.00957999,-0.00797698,-0.01087761,-0.04031231,0.04561687,0.02411904,0.03382583,-0.04947917,0.06345949,-0.07001845,0.00836077,0.00367682,0.00987117,-0.02026654,0.01731643,0.04671299,0.00200972,-0.00378166,-0.01115926,-0.00195256,0.02641131,0.01065301,-0.01308482,0.01070345,-0.04759892,-0.00374951,-0.01339634,-0.01504255,-0.03009768,-0.03281357,0.02315069,0.01322211,-0.01934739,0.01107046,-0.01210331,0.01713707,-0.00599218,0.00819061,0.01683601,0.05310516,-0.03114277,-0.00792938,0.00026344,0.00535991,-0.01556454,-0.00106864,-0.01689254,-0.03090359,-0.01513903,0.01359796,0.01160488,-0.00250583,0.03429475,-0.01438013,0.0217456,0.01462305,-0.02194636,0.0337518,-0.01911652,-0.02550169,-0.03604895,0.00596634,0.01416975,-0.02586769,0.04334632,0.00350843,0.00239434,0.00223285,0.0172389,0.07512331,0.0284569,0.00380121,0.0134746,-0.01668788,-0.02320478,-0.04223014,-0.00033025,-0.0216108,0.02654808,-0.00232688,0.03249414,-0.02898075,0.01524768,-0.00821443,-0.0422625,-0.00174326,0.00321717,0.01113832,-0.04726779,-0.02940585,-0.00093376,0.01614904,-0.05478974,-0.04263712,0.00091759,-0.03340508,-0.0319814,0.02975458,-0.00280721,0.00408481,0.03515437,-0.02530539,0.0373235,0.04262039,0.01305313,-0.01626612,0.03048663,0.04107855,0.00599592,-0.0322656,0.0293611,-0.01404367,0.03615342,0.01290079,-0.00211328,-0.00590728,0.0189502,0.04116028,-0.01203114,0.01261604,-0.00364735,-0.02139113,0.02550969,-0.03461131,0.00491854,0.02286804,0.01473108,-0.02009827,-0.00099702,-0.00561807,0.02531131,0.02359354,-0.00144559,-0.00333779,0.01574202,-0.01588294,-0.0219395,0.00606157,0.00329498,0.00664291,0.00403223,-0.02158513,0.00087129,0.00860427,0.00437759,-0.00562809,-0.0220294,0.01435161,-0.0585987,0.02196268,0.00481605,-0.0158679,-0.00057701,-0.00025466,0.01461298,-0.0293073,0.0101058,0.02410443,0.00698396,-0.02388736,-0.00063716,0.03077323,0.01502938,0.02537446,-0.05072543,-0.01122902,-0.00421122,0.03660015,0.01101705,-0.01608341,-0.00847698,-0.0400808,-0.03320187,-0.0148413,-0.0033429,-0.00902552,0.02476427,-0.00932371,-0.01152847,-0.04447785,-0.02731772,0.04901469,0.03967697,-0.05814309,0.01462434,0.027155,-0.00809353,0.03101102,0.01156252,-0.01625132,0.02092634,-0.00255206,0.00778918,0.04924545,0.00892357,-0.02490674,0.02192856,-0.03370102,0.01367949,-0.03016027,0.01336008,0.0073946,-0.00846663,0.03079412,0.02457003,-0.00530798,0.06175836,-0.0155782,0.00234213,0.03772742,-0.00021048,-0.02298364,-0.01145155,0.00132926,0.01751922,0.02456337,0.02577076,0.05764088,-0.00231113,-0.00445654,-0.01323219,-0.00809025,-0.00201368,-0.02075862,0.02401231,0.03390095,-0.00778154,-0.01324865,-0.03897581,-0.00833585,0.02444111,0.01757781,0.01186338,-0.0243743,-0.00803368,0.01197275,0.01731287,0.02105017,0.02670365,-0.00224092,-0.00413909,-0.00628945,0.00409866,0.00448156,0.01650146,0.00294231,-0.01490031,0.02658593,0.02176261,-0.01100565,-0.01427558,-0.00189903,0.00939069,-0.01610374,0.03557735,-0.01698269,0.01994795,0.01924654,0.02859144,0.01023432,0.00624371,0.03104795,-0.00045276,0.02483631,0.00687702,0.02165444,0.0268696,-0.04139881,0.02507468,-0.01035641,0.00308531,0.04641344,0.03216131,0.06798892,-0.01823057,0.00838569,0.00282475,0.02776815,-0.01314723,-0.00234261,-0.02181632,0.00224852,0.02752537,0.02504201,-0.02232897,0.02613443,-0.02730764,-0.02597679,0.00940391,-0.02086767,0.03427922,0.01016941,0.04273004,-0.02493753,0.02065604,-0.01094075,-0.00073842,0.07229352,-0.0054975,-0.01846464,-0.01854064,-0.00877916,-0.00747244,-0.02765545,0.03069626,-0.00852196,0.03629247,0.03239485,-0.03962215,-0.01551946,-0.00556353,0.02193272,0.02144175,0.03267424,-0.04629436,0.00544615,0.03548517,0.0189542,-0.01764646,0.00600524,0.0267116,0.00948536,-0.03418704,-0.00377588,-0.02903382,-0.0039842,0.00459455,0.01217116,0.03398559,0.01879839,-0.03133656,0.0315441,0.0326661,0.03372695,0.00550858,0.00761754,0.00796872,-0.02995354,-0.00279651,0.02012518,0.02936518,0.02200909,0.02377817,-0.02158436,-0.03047819,0.01317274,0.03028519,-0.00873492,0.00587111,0.01481007,-0.02690626,0.00601085,-0.00675954,-0.00354934,-0.02889233,-0.04118682,0.04619821,-0.00109972,-0.00887411,-0.03406842,0.0108949,-0.00861589,0.00365659,0.00934044,0.018535,-0.00625574,0.00248484,0.02277913,0.05126609,0.00953917,0.00441429,-0.00046987,0.03338002,-0.0444956,0.01486056,-0.0018393,0.00551408,-0.02487158,-0.00849515,0.01941829,0.01362077,0.00706172,0.04307405,-0.00225731,-0.02528004,-0.01688314,0.01599172,0.02455357,0.00311172,0.03235075,-0.01269712,0.02994985,0.01613657,0.02405728,-0.01178864,-0.01318816,0.0086384,0.04204588,0.03054663,0.00960226,-0.00282268,0.00563652,0.03157378,0.02918545,0.00278285,-0.01120237,0.0182581,0.01981204,-0.03572407,-0.00287212,0.01174611,0.02386705,-0.00222406,0.02311602,0.01131246,-0.00676268,0.01618484,0.01530012,-0.03139359,0.01381492,0.00364504,0.02365211,0.0121905,0.01370647,0.00547178,0.02781095,-0.01841018,-0.00953584,-0.03331105,0.01498491,0.00411014,-0.01290634,-0.03798763,-0.00691142,0.01435186,0.02180662,0.03959372,0.04592843,-0.00488862,0.0198604,0.00874375,0.02372098,0.00210143,0.00942698,0.0103892,-0.00233664]
\.


--
-- Data for Name: productcolorlink; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.productcolorlink (product_id, color_id) FROM stdin;
16	7
17	7
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.settings (id, exchange_rate_eur, available_colors, available_sizes, available_categories, updated_at, available_genres) FROM stdin;
2	4500	Beige,Blanc,Noir,Rose,Rouge,Bleu,Marron,Kaki,Multicolore	XS,S,M,L,XL,Sur mesure,Unique	TENUES,ACCESSOIRES,MAISON	2026-05-26 12:06:55.271256	Femme,Homme,Enfant,Unisexe
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (id, email, hashed_password, is_admin) FROM stdin;
6	direction@artjatie.mg	$2b$12$oXoz2/TEvrehdZfiLVYLN.7.oaHkOmFoZdhtWMKkTKzVi3nym0h2.	t
1	contact@artjatie.mg	$2a$12$ytt0DgZnyxPbDPblaOAQVuSAL1Wl.KohWc2XFfOElh/wdIF2Mtmg6	t
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-04-17 22:53:45
20211116045059	2026-04-17 22:53:45
20211116050929	2026-04-17 22:53:45
20211116051442	2026-04-17 22:53:45
20211116212300	2026-04-17 22:53:45
20211116213355	2026-04-17 22:53:45
20211116213934	2026-04-17 22:53:45
20211116214523	2026-04-17 22:53:45
20211122062447	2026-04-17 22:53:45
20211124070109	2026-04-17 22:53:45
20211202204204	2026-04-17 22:53:45
20211202204605	2026-04-17 22:53:46
20211210212804	2026-04-17 22:53:46
20211228014915	2026-04-17 22:53:46
20220107221237	2026-04-17 22:53:46
20220228202821	2026-04-17 22:53:46
20220312004840	2026-04-17 22:53:46
20220603231003	2026-04-17 22:53:46
20220603232444	2026-04-17 22:53:46
20220615214548	2026-04-17 22:53:46
20220712093339	2026-04-17 22:53:46
20220908172859	2026-04-17 22:53:46
20220916233421	2026-04-17 22:53:46
20230119133233	2026-04-17 22:53:46
20230128025114	2026-04-17 22:53:46
20230128025212	2026-04-17 22:53:46
20230227211149	2026-04-17 22:53:46
20230228184745	2026-04-17 22:53:46
20230308225145	2026-04-17 22:53:46
20230328144023	2026-04-17 22:53:46
20231018144023	2026-04-17 22:53:46
20231204144023	2026-04-17 22:53:46
20231204144024	2026-04-17 22:53:46
20231204144025	2026-04-17 22:53:46
20240108234812	2026-04-17 22:53:46
20240109165339	2026-04-17 22:53:46
20240227174441	2026-04-17 22:53:46
20240311171622	2026-04-17 22:53:46
20240321100241	2026-04-17 22:53:46
20240401105812	2026-04-17 22:53:46
20240418121054	2026-04-17 22:53:46
20240523004032	2026-04-17 22:53:46
20240618124746	2026-04-17 22:53:46
20240801235015	2026-04-17 22:53:46
20240805133720	2026-04-17 22:53:46
20240827160934	2026-04-17 22:53:46
20240919163303	2026-04-17 22:53:46
20240919163305	2026-04-17 22:53:46
20241019105805	2026-04-17 22:53:46
20241030150047	2026-04-17 22:53:46
20241108114728	2026-04-17 22:53:46
20241121104152	2026-04-17 22:53:46
20241130184212	2026-04-17 22:53:46
20241220035512	2026-04-17 22:53:46
20241220123912	2026-04-17 22:53:46
20241224161212	2026-04-17 22:53:46
20250107150512	2026-04-17 22:53:46
20250110162412	2026-04-17 22:53:46
20250123174212	2026-04-17 22:53:46
20250128220012	2026-04-17 22:53:46
20250506224012	2026-04-17 22:53:46
20250523164012	2026-04-17 22:53:46
20250714121412	2026-04-17 22:53:46
20250905041441	2026-04-17 22:53:46
20251103001201	2026-04-17 22:53:46
20251120212548	2026-04-17 22:53:46
20251120215549	2026-04-17 22:53:46
20260218120000	2026-04-17 22:53:46
20260326120000	2026-04-17 22:53:46
20260514120000	2026-06-06 12:23:02
20260527120000	2026-06-06 12:23:02
20260528120000	2026-06-06 12:23:02
20260603120000	2026-06-06 12:23:02
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
products	products	\N	2026-04-20 18:56:55.124304+00	2026-04-20 18:56:55.124304+00	t	f	\N	\N	\N	STANDARD
payment-proofs	payment-proofs	\N	2026-04-25 17:04:05.961743+00	2026-04-25 17:04:05.961743+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-04-17 22:53:56.45474
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-04-17 22:53:56.461651
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-04-17 22:53:56.465626
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-04-17 22:53:56.4777
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-04-17 22:53:56.484432
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-04-17 22:53:56.487483
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-04-17 22:53:56.490843
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-04-17 22:53:56.49415
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-04-17 22:53:56.496883
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-04-17 22:53:56.50035
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-04-17 22:53:56.503341
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-04-17 22:53:56.506385
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-04-17 22:53:56.509863
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-04-17 22:53:56.512742
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-04-17 22:53:56.51573
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-04-17 22:53:56.537712
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-04-17 22:53:56.540742
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-04-17 22:53:56.543659
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-04-17 22:53:56.546394
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-04-17 22:53:56.552001
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-04-17 22:53:56.555232
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-04-17 22:53:56.560686
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-04-17 22:53:56.571169
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-04-17 22:53:56.58026
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-04-17 22:53:56.583645
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-04-17 22:53:56.586481
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-04-17 22:53:56.58967
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-04-17 22:53:56.592043
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-04-17 22:53:56.594475
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-04-17 22:53:56.596848
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-04-17 22:53:56.599179
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-04-17 22:53:56.601472
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-04-17 22:53:56.604194
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-04-17 22:53:56.607674
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-04-17 22:53:56.610031
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-04-17 22:53:56.612271
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-04-17 22:53:56.614576
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-04-17 22:53:56.616913
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-04-17 22:53:56.62015
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-04-17 22:53:56.626611
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-04-17 22:53:56.628988
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-04-17 22:53:56.631264
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-04-17 22:53:56.633734
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-04-17 22:53:56.636043
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-04-17 22:53:56.638287
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-04-17 22:53:56.641393
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-04-17 22:53:56.648791
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-04-17 22:53:56.651769
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-04-17 22:53:56.654329
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-04-17 22:53:56.667616
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-04-17 22:53:56.670897
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-04-17 22:53:56.682245
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-04-17 22:53:56.683207
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-04-17 22:53:56.69025
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-04-17 22:53:56.691915
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-04-17 22:53:56.692809
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-17 22:53:56.700109
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-17 22:53:56.702676
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-04-17 22:53:56.696242
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-05-13 15:30:48.042615
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-05-13 15:30:48.050164
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
34e21879-16d6-46cc-b818-fd47aabe5335	products	acf439f7-6368-4988-978b-e2586bb4066c.jpeg	\N	2026-04-21 04:33:09.854999+00	2026-04-21 04:33:09.854999+00	2026-04-21 04:33:09.854999+00	{"eTag": "\\"3430d740a9a100fe7a8881251eb07c33\\"", "size": 211229, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-21T04:33:10.000Z", "contentLength": 211229, "httpStatusCode": 200}	1ad4eca4-58fb-411d-80bd-769bde5d28f8	\N	{}
a956c9ec-e9fc-4d64-bf81-0f16606501b2	products	089931af-57fd-4d8d-a75b-1b0961f1a776.png	\N	2026-04-21 04:36:30.930433+00	2026-04-21 04:36:30.930433+00	2026-04-21 04:36:30.930433+00	{"eTag": "\\"92e716338b13fc28e152822835a0c973-2\\"", "size": 7028559, "mimetype": "image/png", "cacheControl": "no-cache", "lastModified": "2026-04-21T04:36:31.000Z", "contentLength": 7028559, "httpStatusCode": 200}	4e2c6d44-dab4-49f4-ae37-46a253ae829b	\N	{}
49597bf0-9d84-4b45-9118-c204e22b46e3	products	64a66af0-8d13-4f50-9fb0-b246b3325b09.png	\N	2026-04-21 04:57:23.897946+00	2026-04-21 04:57:23.897946+00	2026-04-21 04:57:23.897946+00	{"eTag": "\\"92e716338b13fc28e152822835a0c973-2\\"", "size": 7028559, "mimetype": "image/png", "cacheControl": "no-cache", "lastModified": "2026-04-21T04:57:24.000Z", "contentLength": 7028559, "httpStatusCode": 200}	e874f72d-7187-40ff-a398-bcd9483f823f	\N	{}
07fc4f24-ed3e-4e43-b42b-02ea457d9ee7	products	52747ae5-8588-4927-96a4-e942d8b0bb87.jpeg	\N	2026-04-21 07:36:49.833969+00	2026-04-21 07:36:49.833969+00	2026-04-21 07:36:49.833969+00	{"eTag": "\\"2d7ea5cbb48df3bffb7b585dcfff771a\\"", "size": 297483, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-21T07:36:50.000Z", "contentLength": 297483, "httpStatusCode": 200}	7a40aa94-f6bf-4c48-81e5-7d182faaf4ef	\N	{}
31778db5-a1b8-450d-9416-81a738eaa31a	products	8451c90d-ca07-4a7b-be91-5b0c5149ff9f.jpeg	\N	2026-04-21 15:58:17.166004+00	2026-04-21 15:58:17.166004+00	2026-04-21 15:58:17.166004+00	{"eTag": "\\"d2f15641f4535f0e7f835741495f1e46\\"", "size": 259561, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-21T15:58:18.000Z", "contentLength": 259561, "httpStatusCode": 200}	4109e4e8-7281-44c5-b031-9aab3d0ff568	\N	{}
d2ce2f57-6cd8-4eb0-ba8b-a071f1ed9ca7	products	37a54340-5638-47f6-b852-4e6081c4065b.jpeg	\N	2026-04-21 16:02:44.215119+00	2026-04-21 16:02:44.215119+00	2026-04-21 16:02:44.215119+00	{"eTag": "\\"86333ddd27a3d0484a202a4c4923636e\\"", "size": 272330, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-21T16:02:45.000Z", "contentLength": 272330, "httpStatusCode": 200}	cb9ec4e4-91af-4470-b58d-efde219e4f07	\N	{}
581b440d-ff37-424c-9125-62ce2b27b8a3	products	f08a0dc6-ad4f-46c5-87de-df9e4f887ae6.jpeg	\N	2026-04-22 16:29:47.973557+00	2026-04-22 16:29:47.973557+00	2026-04-22 16:29:47.973557+00	{"eTag": "\\"7817bd04ea37ba51ff48aa0f746909eb\\"", "size": 380686, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-22T16:29:48.000Z", "contentLength": 380686, "httpStatusCode": 200}	8e3f8a4b-5986-4bd1-8684-5898ffd89e7b	\N	{}
23dd61a1-a2b3-4816-aed0-0ccedb7cfbe2	products	576770d0-f00d-47e0-ae1e-8a584753db17.jpeg	\N	2026-04-22 16:59:57.68023+00	2026-04-22 16:59:57.68023+00	2026-04-22 16:59:57.68023+00	{"eTag": "\\"9b38d5a19c7c4e85c716b3aa9471e575\\"", "size": 214212, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-22T16:59:58.000Z", "contentLength": 214212, "httpStatusCode": 200}	6a9bff2b-e018-4245-994c-2a1aa4afbeec	\N	{}
688a35fa-4537-492f-867d-12cd70d25a39	products	25c0c79d-4d1f-403d-b6f2-5c6f6c832ea7.jpeg	\N	2026-04-22 17:00:50.394244+00	2026-04-22 17:00:50.394244+00	2026-04-22 17:00:50.394244+00	{"eTag": "\\"fdc9cbac15b6248585c99aca75f69a9f\\"", "size": 87464, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-22T17:00:51.000Z", "contentLength": 87464, "httpStatusCode": 200}	233278bb-8fec-465e-b7b7-ac2249ead6f8	\N	{}
48c8188c-92e0-4157-8c60-344c42d700a8	products	08345f43-da48-4dda-8922-4bd024634776.jpeg	\N	2026-04-22 17:02:10.244486+00	2026-04-22 17:02:10.244486+00	2026-04-22 17:02:10.244486+00	{"eTag": "\\"6116a48ddc929b181fb2e3386635be44\\"", "size": 179531, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-22T17:02:11.000Z", "contentLength": 179531, "httpStatusCode": 200}	210f69ba-4d22-4269-a49c-5330f52d9df0	\N	{}
7257dac8-5fa1-46c0-9d60-d68829a0da6a	products	8cbdb4da-7ad3-4302-b5ad-65c1fa201a20.jpeg	\N	2026-04-22 17:03:19.125487+00	2026-04-22 17:03:19.125487+00	2026-04-22 17:03:19.125487+00	{"eTag": "\\"be3f44b0ac4aabcc34dea131360a8c18\\"", "size": 155600, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-22T17:03:20.000Z", "contentLength": 155600, "httpStatusCode": 200}	3de3bd99-31ae-4cc4-b6fb-25dbbd76c178	\N	{}
c338e584-4425-4f8f-af27-faff470c086a	payment-proofs	0bf6f856-16f1-44b9-b794-dd284a3677d9.jpg	\N	2026-04-25 17:22:33.268981+00	2026-04-25 17:22:33.268981+00	2026-04-25 17:22:33.268981+00	{"eTag": "\\"4b9ebbf8aac7ec79d3b5f9345bb0687b\\"", "size": 43047, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-25T17:22:34.000Z", "contentLength": 43047, "httpStatusCode": 200}	32b4e5d5-0d49-4682-bd64-a2bc069c17f4	\N	{}
30d0a863-6783-427e-99ab-4267e7223697	payment-proofs	289d1396-2e04-45cc-8b63-bf106f507053.jpg	\N	2026-04-25 17:26:31.39336+00	2026-04-25 17:26:31.39336+00	2026-04-25 17:26:31.39336+00	{"eTag": "\\"d39a5ee7e13d93133b30e5367f19e8af\\"", "size": 66578, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-25T17:26:32.000Z", "contentLength": 66578, "httpStatusCode": 200}	bd9a5e09-a44f-4568-817e-e9ff860380d0	\N	{}
56a4f8b7-1083-41e4-8cba-d577565543f1	payment-proofs	fa1ab50e-9775-4d55-b36c-2352b2ef7238.png	\N	2026-04-25 17:43:31.627793+00	2026-04-25 17:43:31.627793+00	2026-04-25 17:43:31.627793+00	{"eTag": "\\"6f5d393391ec1728807a601720d548f5\\"", "size": 2551159, "mimetype": "image/png", "cacheControl": "no-cache", "lastModified": "2026-04-25T17:43:32.000Z", "contentLength": 2551159, "httpStatusCode": 200}	149a3bb3-f18e-454a-bdbc-84d6a661b491	\N	{}
db8f58ba-a0e0-4993-b48b-f068913cdf29	products	fa85d5c9-3902-462d-90c0-09aff77c28ec.jpg	\N	2026-04-25 18:00:14.76793+00	2026-04-25 18:00:14.76793+00	2026-04-25 18:00:14.76793+00	{"eTag": "\\"8f27eb338cf669f4e55a887b69c9dd7b\\"", "size": 359951, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-25T18:00:15.000Z", "contentLength": 359951, "httpStatusCode": 200}	574edef0-c62c-4c6c-a37a-3075d4440744	\N	{}
4b7c1acc-afad-415e-8bd0-1f5aa59d9e77	products	e8b6f2ca-30ce-4123-9f12-41cefd5cbe6b.jpg	\N	2026-04-26 14:32:27.784581+00	2026-04-26 14:32:27.784581+00	2026-04-26 14:32:27.784581+00	{"eTag": "\\"4b9ebbf8aac7ec79d3b5f9345bb0687b\\"", "size": 43047, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-04-26T14:32:28.000Z", "contentLength": 43047, "httpStatusCode": 200}	7eec1da0-9d2e-49bc-8059-39fda0e4d047	\N	{}
fee24861-01d7-4dd5-b958-73dd9edce021	payment-proofs	bfe76fb8-81d1-4a27-9eab-3176270c63ad.jpg	\N	2026-05-16 14:31:04.1243+00	2026-05-16 14:31:04.1243+00	2026-05-16 14:31:04.1243+00	{"eTag": "\\"14729cda2d69a4eb19844f37c28a5e07\\"", "size": 174056, "mimetype": "image/jpeg", "cacheControl": "no-cache", "lastModified": "2026-05-16T14:31:05.000Z", "contentLength": 174056, "httpStatusCode": 200}	26eeaf46-5fef-40e7-b954-91f9c8b38f89	\N	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: agentsession_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agentsession_id_seq', 4, true);


--
-- Name: client_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.client_id_seq', 13, true);


--
-- Name: color_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.color_id_seq', 7, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_id_seq', 31, true);


--
-- Name: product_embedding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_embedding_id_seq', 12, true);


--
-- Name: product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_id_seq', 28, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.settings_id_seq', 2, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_id_seq', 6, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: agentsession agentsession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agentsession
    ADD CONSTRAINT agentsession_pkey PRIMARY KEY (id);


--
-- Name: client client_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT client_pkey PRIMARY KEY (id);


--
-- Name: color color_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.color
    ADD CONSTRAINT color_pkey PRIMARY KEY (id);


--
-- Name: order order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (id);


--
-- Name: product_embedding product_embedding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_embedding
    ADD CONSTRAINT product_embedding_pkey PRIMARY KEY (id);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- Name: productcolorlink productcolorlink_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productcolorlink
    ADD CONSTRAINT productcolorlink_pkey PRIMARY KEY (product_id, color_id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: ix_agentsession_client_whatsapp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_agentsession_client_whatsapp ON public.agentsession USING btree (client_whatsapp);


--
-- Name: ix_client_whatsapp; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_client_whatsapp ON public.client USING btree (whatsapp);


--
-- Name: ix_color_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_color_name ON public.color USING btree (name);


--
-- Name: ix_user_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_user_email ON public."user" USING btree (email);


--
-- Name: product_embedding_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX product_embedding_embedding_idx ON public.product_embedding USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: order order_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.client(id) ON DELETE SET NULL;


--
-- Name: product_embedding product_embedding_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_embedding
    ADD CONSTRAINT product_embedding_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE CASCADE;


--
-- Name: productcolorlink productcolorlink_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productcolorlink
    ADD CONSTRAINT productcolorlink_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.color(id);


--
-- Name: productcolorlink productcolorlink_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productcolorlink
    ADD CONSTRAINT productcolorlink_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict VQujfDgK3pWMXZ8tFg349l2Yk2mx11xpSEFV8RZvQuFRZ9SnAncV80COXFDkeIX

