--
-- PostgreSQL database dump
--

\restrict vLbou1hZgwSjCb7d4ut9L91tbA71VPexHXcDIbvw8IZDwGmH5MdsPwZxcQFNig2

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

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

ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ticket_messages DROP CONSTRAINT IF EXISTS ticket_messages_ticket_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tariffs DROP CONSTRAINT IF EXISTS tariffs_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.singbox_tariffs DROP CONSTRAINT IF EXISTS singbox_tariffs_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.singbox_slots DROP CONSTRAINT IF EXISTS singbox_slots_singbox_tariff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.singbox_slots DROP CONSTRAINT IF EXISTS singbox_slots_node_id_fkey;
ALTER TABLE IF EXISTS ONLY public.singbox_slots DROP CONSTRAINT IF EXISTS singbox_slots_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.referral_credits DROP CONSTRAINT IF EXISTS referral_credits_referrer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.referral_credits DROP CONSTRAINT IF EXISTS referral_credits_payment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proxy_tariffs DROP CONSTRAINT IF EXISTS proxy_tariffs_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proxy_tariff_nodes DROP CONSTRAINT IF EXISTS proxy_tariff_nodes_tariff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proxy_tariff_nodes DROP CONSTRAINT IF EXISTS proxy_tariff_nodes_node_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proxy_slots DROP CONSTRAINT IF EXISTS proxy_slots_proxy_tariff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proxy_slots DROP CONSTRAINT IF EXISTS proxy_slots_node_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proxy_slots DROP CONSTRAINT IF EXISTS proxy_slots_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.promo_code_usages DROP CONSTRAINT IF EXISTS promo_code_usages_promo_code_id_fkey;
ALTER TABLE IF EXISTS ONLY public.promo_code_usages DROP CONSTRAINT IF EXISTS promo_code_usages_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.promo_activations DROP CONSTRAINT IF EXISTS promo_activations_promo_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.promo_activations DROP CONSTRAINT IF EXISTS promo_activations_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_tariff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_singbox_tariff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_proxy_tariff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_winners DROP CONSTRAINT IF EXISTS contest_winners_contest_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contest_winners DROP CONSTRAINT IF EXISTS contest_winners_client_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_referrer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.auto_broadcast_logs DROP CONSTRAINT IF EXISTS auto_broadcast_logs_rule_id_fkey;
ALTER TABLE IF EXISTS ONLY public.auto_broadcast_logs DROP CONSTRAINT IF EXISTS auto_broadcast_logs_client_id_fkey;
DROP INDEX IF EXISTS public.tickets_status_idx;
DROP INDEX IF EXISTS public.tickets_client_id_idx;
DROP INDEX IF EXISTS public.ticket_messages_ticket_id_idx;
DROP INDEX IF EXISTS public.ticket_messages_is_read_idx;
DROP INDEX IF EXISTS public.tariffs_category_id_idx;
DROP INDEX IF EXISTS public.system_settings_key_key;
DROP INDEX IF EXISTS public.singbox_tariffs_category_id_idx;
DROP INDEX IF EXISTS public.singbox_slots_status_idx;
DROP INDEX IF EXISTS public.singbox_slots_singbox_tariff_id_idx;
DROP INDEX IF EXISTS public.singbox_slots_node_id_user_identifier_key;
DROP INDEX IF EXISTS public.singbox_slots_node_id_idx;
DROP INDEX IF EXISTS public.singbox_slots_client_id_idx;
DROP INDEX IF EXISTS public.singbox_nodes_token_key;
DROP INDEX IF EXISTS public.refresh_tokens_token_key;
DROP INDEX IF EXISTS public.refresh_tokens_token_idx;
DROP INDEX IF EXISTS public.refresh_tokens_admin_id_idx;
DROP INDEX IF EXISTS public.referral_credits_referrer_id_idx;
DROP INDEX IF EXISTS public.referral_credits_payment_id_idx;
DROP INDEX IF EXISTS public.proxy_tariffs_category_id_idx;
DROP INDEX IF EXISTS public.proxy_tariff_nodes_tariff_id_node_id_key;
DROP INDEX IF EXISTS public.proxy_tariff_nodes_tariff_id_idx;
DROP INDEX IF EXISTS public.proxy_tariff_nodes_node_id_idx;
DROP INDEX IF EXISTS public.proxy_slots_status_idx;
DROP INDEX IF EXISTS public.proxy_slots_proxy_tariff_id_idx;
DROP INDEX IF EXISTS public.proxy_slots_node_id_login_key;
DROP INDEX IF EXISTS public.proxy_slots_node_id_idx;
DROP INDEX IF EXISTS public.proxy_slots_client_id_idx;
DROP INDEX IF EXISTS public.proxy_nodes_token_key;
DROP INDEX IF EXISTS public.promo_groups_code_key;
DROP INDEX IF EXISTS public.promo_codes_code_key;
DROP INDEX IF EXISTS public.promo_code_usages_promo_code_id_idx;
DROP INDEX IF EXISTS public.promo_code_usages_client_id_idx;
DROP INDEX IF EXISTS public.promo_activations_promo_group_id_idx;
DROP INDEX IF EXISTS public.promo_activations_promo_group_id_client_id_key;
DROP INDEX IF EXISTS public.promo_activations_client_id_idx;
DROP INDEX IF EXISTS public.pending_telegram_links_expires_at_idx;
DROP INDEX IF EXISTS public.pending_telegram_links_code_key;
DROP INDEX IF EXISTS public.pending_telegram_links_code_idx;
DROP INDEX IF EXISTS public.pending_email_registrations_verification_token_key;
DROP INDEX IF EXISTS public.pending_email_registrations_verification_token_idx;
DROP INDEX IF EXISTS public.pending_email_registrations_email_idx;
DROP INDEX IF EXISTS public.pending_email_links_verification_token_key;
DROP INDEX IF EXISTS public.pending_email_links_verification_token_idx;
DROP INDEX IF EXISTS public.pending_email_links_expires_at_idx;
DROP INDEX IF EXISTS public.payments_tariff_id_idx;
DROP INDEX IF EXISTS public.payments_status_idx;
DROP INDEX IF EXISTS public.payments_singbox_tariff_id_idx;
DROP INDEX IF EXISTS public.payments_proxy_tariff_id_idx;
DROP INDEX IF EXISTS public.payments_order_id_key;
DROP INDEX IF EXISTS public.payments_client_id_idx;
DROP INDEX IF EXISTS public.password_reset_tokens_token_key;
DROP INDEX IF EXISTS public.password_reset_tokens_expires_at_idx;
DROP INDEX IF EXISTS public.password_reset_tokens_client_id_idx;
DROP INDEX IF EXISTS public.contest_winners_contest_id_place_key;
DROP INDEX IF EXISTS public.contest_winners_contest_id_idx;
DROP INDEX IF EXISTS public.clients_utm_source_idx;
DROP INDEX IF EXISTS public.clients_telegram_id_key;
DROP INDEX IF EXISTS public.clients_telegram_id_idx;
DROP INDEX IF EXISTS public.clients_referral_code_key;
DROP INDEX IF EXISTS public.clients_google_id_key;
DROP INDEX IF EXISTS public.clients_email_key;
DROP INDEX IF EXISTS public.clients_email_idx;
DROP INDEX IF EXISTS public.clients_apple_id_key;
DROP INDEX IF EXISTS public.auto_broadcast_logs_rule_id_idx;
DROP INDEX IF EXISTS public.auto_broadcast_logs_rule_id_client_id_key;
DROP INDEX IF EXISTS public.auto_broadcast_logs_client_id_idx;
DROP INDEX IF EXISTS public.admins_email_key;
DROP INDEX IF EXISTS public.admin_notification_preferences_telegram_id_key;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_pkey;
ALTER TABLE IF EXISTS ONLY public.ticket_messages DROP CONSTRAINT IF EXISTS ticket_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.tariffs DROP CONSTRAINT IF EXISTS tariffs_pkey;
ALTER TABLE IF EXISTS ONLY public.tariff_categories DROP CONSTRAINT IF EXISTS tariff_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.singbox_tariffs DROP CONSTRAINT IF EXISTS singbox_tariffs_pkey;
ALTER TABLE IF EXISTS ONLY public.singbox_slots DROP CONSTRAINT IF EXISTS singbox_slots_pkey;
ALTER TABLE IF EXISTS ONLY public.singbox_nodes DROP CONSTRAINT IF EXISTS singbox_nodes_pkey;
ALTER TABLE IF EXISTS ONLY public.singbox_categories DROP CONSTRAINT IF EXISTS singbox_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.referral_credits DROP CONSTRAINT IF EXISTS referral_credits_pkey;
ALTER TABLE IF EXISTS ONLY public.proxy_tariffs DROP CONSTRAINT IF EXISTS proxy_tariffs_pkey;
ALTER TABLE IF EXISTS ONLY public.proxy_tariff_nodes DROP CONSTRAINT IF EXISTS proxy_tariff_nodes_pkey;
ALTER TABLE IF EXISTS ONLY public.proxy_slots DROP CONSTRAINT IF EXISTS proxy_slots_pkey;
ALTER TABLE IF EXISTS ONLY public.proxy_nodes DROP CONSTRAINT IF EXISTS proxy_nodes_pkey;
ALTER TABLE IF EXISTS ONLY public.proxy_categories DROP CONSTRAINT IF EXISTS proxy_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_groups DROP CONSTRAINT IF EXISTS promo_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_code_usages DROP CONSTRAINT IF EXISTS promo_code_usages_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_activations DROP CONSTRAINT IF EXISTS promo_activations_pkey;
ALTER TABLE IF EXISTS ONLY public.pending_telegram_links DROP CONSTRAINT IF EXISTS pending_telegram_links_pkey;
ALTER TABLE IF EXISTS ONLY public.pending_email_registrations DROP CONSTRAINT IF EXISTS pending_email_registrations_pkey;
ALTER TABLE IF EXISTS ONLY public.pending_email_links DROP CONSTRAINT IF EXISTS pending_email_links_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.contests DROP CONSTRAINT IF EXISTS contests_pkey;
ALTER TABLE IF EXISTS ONLY public.contest_winners DROP CONSTRAINT IF EXISTS contest_winners_pkey;
ALTER TABLE IF EXISTS ONLY public.clients DROP CONSTRAINT IF EXISTS clients_pkey;
ALTER TABLE IF EXISTS ONLY public.auto_broadcast_rules DROP CONSTRAINT IF EXISTS auto_broadcast_rules_pkey;
ALTER TABLE IF EXISTS ONLY public.auto_broadcast_logs DROP CONSTRAINT IF EXISTS auto_broadcast_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.admins DROP CONSTRAINT IF EXISTS admins_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_notification_preferences DROP CONSTRAINT IF EXISTS admin_notification_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
DROP TABLE IF EXISTS public.tickets;
DROP TABLE IF EXISTS public.ticket_messages;
DROP TABLE IF EXISTS public.tariffs;
DROP TABLE IF EXISTS public.tariff_categories;
DROP TABLE IF EXISTS public.system_settings;
DROP TABLE IF EXISTS public.singbox_tariffs;
DROP TABLE IF EXISTS public.singbox_slots;
DROP TABLE IF EXISTS public.singbox_nodes;
DROP TABLE IF EXISTS public.singbox_categories;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP TABLE IF EXISTS public.referral_credits;
DROP TABLE IF EXISTS public.proxy_tariffs;
DROP TABLE IF EXISTS public.proxy_tariff_nodes;
DROP TABLE IF EXISTS public.proxy_slots;
DROP TABLE IF EXISTS public.proxy_nodes;
DROP TABLE IF EXISTS public.proxy_categories;
DROP TABLE IF EXISTS public.promo_groups;
DROP TABLE IF EXISTS public.promo_codes;
DROP TABLE IF EXISTS public.promo_code_usages;
DROP TABLE IF EXISTS public.promo_activations;
DROP TABLE IF EXISTS public.pending_telegram_links;
DROP TABLE IF EXISTS public.pending_email_registrations;
DROP TABLE IF EXISTS public.pending_email_links;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP TABLE IF EXISTS public.contests;
DROP TABLE IF EXISTS public.contest_winners;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.auto_broadcast_rules;
DROP TABLE IF EXISTS public.auto_broadcast_logs;
DROP TABLE IF EXISTS public.admins;
DROP TABLE IF EXISTS public.admin_notification_preferences;
DROP TABLE IF EXISTS public._prisma_migrations;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: admin_notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_notification_preferences (
    id text NOT NULL,
    telegram_id text NOT NULL,
    notify_balance_topup boolean DEFAULT true NOT NULL,
    notify_tariff_payment boolean DEFAULT true NOT NULL,
    notify_new_client boolean DEFAULT true NOT NULL,
    notify_new_ticket boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    must_change_password boolean DEFAULT true NOT NULL,
    role text DEFAULT 'ADMIN'::text NOT NULL,
    allowed_sections text,
    totp_secret text,
    totp_enabled boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: auto_broadcast_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auto_broadcast_logs (
    id text NOT NULL,
    rule_id text NOT NULL,
    client_id text NOT NULL,
    sent_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: auto_broadcast_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auto_broadcast_rules (
    id text NOT NULL,
    name text NOT NULL,
    trigger_type text NOT NULL,
    delay_days integer NOT NULL,
    channel text NOT NULL,
    subject text,
    message text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id text NOT NULL,
    email text,
    password_hash text,
    role text DEFAULT 'CLIENT'::text NOT NULL,
    remnawave_uuid text,
    referral_code text,
    referrer_id text,
    balance double precision DEFAULT 0 NOT NULL,
    preferred_lang text DEFAULT 'ru'::text NOT NULL,
    preferred_currency text DEFAULT 'usd'::text NOT NULL,
    telegram_id text,
    telegram_username text,
    is_blocked boolean DEFAULT false NOT NULL,
    block_reason text,
    referral_percent double precision,
    trial_used boolean DEFAULT false NOT NULL,
    yoomoney_access_token text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    totp_secret text,
    totp_enabled boolean DEFAULT false NOT NULL,
    google_id text,
    apple_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: contest_winners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contest_winners (
    id text NOT NULL,
    contest_id text NOT NULL,
    client_id text NOT NULL,
    place integer NOT NULL,
    prize_type text NOT NULL,
    prize_value text NOT NULL,
    applied_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contests (
    id text NOT NULL,
    name text NOT NULL,
    start_at timestamp(3) without time zone NOT NULL,
    end_at timestamp(3) without time zone NOT NULL,
    prize1_type text NOT NULL,
    prize1_value text NOT NULL,
    prize2_type text NOT NULL,
    prize2_value text NOT NULL,
    prize3_type text NOT NULL,
    prize3_value text NOT NULL,
    conditions_json text,
    draw_type text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    daily_message text,
    start_notification_sent_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id text NOT NULL,
    client_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id text NOT NULL,
    client_id text NOT NULL,
    order_id text NOT NULL,
    amount double precision NOT NULL,
    currency text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    provider text,
    external_id text,
    tariff_id text,
    proxy_tariff_id text,
    singbox_tariff_id text,
    remnawave_user_id text,
    metadata text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    paid_at timestamp(3) without time zone,
    referral_distributed_at timestamp(3) without time zone
);


--
-- Name: pending_email_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_email_links (
    id text NOT NULL,
    client_id text NOT NULL,
    email text NOT NULL,
    verification_token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pending_email_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_email_registrations (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    preferred_lang text DEFAULT 'ru'::text NOT NULL,
    preferred_currency text DEFAULT 'usd'::text NOT NULL,
    referral_code text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    verification_token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pending_telegram_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_telegram_links (
    id text NOT NULL,
    client_id text NOT NULL,
    code text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: promo_activations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_activations (
    id text NOT NULL,
    promo_group_id text NOT NULL,
    client_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: promo_code_usages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_code_usages (
    id text NOT NULL,
    promo_code_id text NOT NULL,
    client_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    discount_percent double precision,
    discount_fixed double precision,
    squad_uuid text,
    traffic_limit_bytes bigint,
    device_limit integer,
    duration_days integer,
    max_uses integer DEFAULT 0 NOT NULL,
    max_uses_per_client integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: promo_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_groups (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    squad_uuid text NOT NULL,
    traffic_limit_bytes bigint DEFAULT 0 NOT NULL,
    device_limit integer,
    duration_days integer NOT NULL,
    max_activations integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: proxy_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proxy_categories (
    id text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: proxy_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proxy_nodes (
    id text NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    token text NOT NULL,
    status text DEFAULT 'OFFLINE'::text NOT NULL,
    last_seen_at timestamp(3) without time zone,
    public_host text,
    socks_port integer DEFAULT 1080 NOT NULL,
    http_port integer DEFAULT 8080 NOT NULL,
    capacity integer,
    current_connections integer DEFAULT 0 NOT NULL,
    traffic_in_bytes bigint DEFAULT 0 NOT NULL,
    traffic_out_bytes bigint DEFAULT 0 NOT NULL,
    metadata text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: proxy_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proxy_slots (
    id text NOT NULL,
    node_id text NOT NULL,
    client_id text NOT NULL,
    proxy_tariff_id text,
    login text NOT NULL,
    password text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    traffic_limit_bytes bigint,
    connection_limit integer,
    traffic_used_bytes bigint DEFAULT 0 NOT NULL,
    current_connections integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: proxy_tariff_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proxy_tariff_nodes (
    id text NOT NULL,
    tariff_id text NOT NULL,
    node_id text NOT NULL
);


--
-- Name: proxy_tariffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proxy_tariffs (
    id text NOT NULL,
    category_id text NOT NULL,
    name text NOT NULL,
    proxy_count integer NOT NULL,
    duration_days integer NOT NULL,
    traffic_limit_bytes bigint,
    connection_limit integer,
    price double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: referral_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_credits (
    id text NOT NULL,
    referrer_id text NOT NULL,
    payment_id text NOT NULL,
    amount double precision NOT NULL,
    level integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    admin_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: singbox_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.singbox_categories (
    id text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: singbox_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.singbox_nodes (
    id text NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    token text NOT NULL,
    status text DEFAULT 'OFFLINE'::text NOT NULL,
    last_seen_at timestamp(3) without time zone,
    public_host text,
    port integer DEFAULT 443 NOT NULL,
    protocol text DEFAULT 'VLESS'::text NOT NULL,
    tls_enabled boolean DEFAULT true NOT NULL,
    capacity integer,
    current_connections integer DEFAULT 0 NOT NULL,
    traffic_in_bytes bigint DEFAULT 0 NOT NULL,
    traffic_out_bytes bigint DEFAULT 0 NOT NULL,
    metadata text,
    custom_config_json text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: singbox_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.singbox_slots (
    id text NOT NULL,
    node_id text NOT NULL,
    client_id text NOT NULL,
    singbox_tariff_id text,
    user_identifier text NOT NULL,
    secret text,
    expires_at timestamp(3) without time zone NOT NULL,
    traffic_limit_bytes bigint,
    traffic_used_bytes bigint DEFAULT 0 NOT NULL,
    current_connections integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: singbox_tariffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.singbox_tariffs (
    id text NOT NULL,
    category_id text NOT NULL,
    name text NOT NULL,
    slot_count integer NOT NULL,
    duration_days integer NOT NULL,
    traffic_limit_bytes bigint,
    price double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: tariff_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tariff_categories (
    id text NOT NULL,
    name text NOT NULL,
    emoji_key text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: tariffs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tariffs (
    id text NOT NULL,
    category_id text NOT NULL,
    name text NOT NULL,
    description text,
    duration_days integer NOT NULL,
    internal_squad_uuids text[],
    traffic_limit_bytes bigint,
    device_limit integer,
    price double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'usd'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: ticket_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_messages (
    id text NOT NULL,
    ticket_id text NOT NULL,
    author_type character varying(20) NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id text NOT NULL,
    client_id text NOT NULL,
    subject character varying(500) NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
e9a081bb-66b2-4825-86d5-c70516e995d9	9eff0d7fd1a7ce50b6cad2da4cacc6c05f759b762cde30c449f92e61fc9c1260	\N	20250220_add_proxy_tariff_nodes	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250220_add_proxy_tariff_nodes\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "proxy_tariffs" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"proxy_tariffs\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(636), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250220_add_proxy_tariff_nodes"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250220_add_proxy_tariff_nodes"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2026-03-18 03:22:05.534636+00	2026-03-18 03:21:45.233651+00	0
ce59919c-6e26-4657-a6f5-325b701991ca	9eff0d7fd1a7ce50b6cad2da4cacc6c05f759b762cde30c449f92e61fc9c1260	\N	20250220_add_proxy_tariff_nodes	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250220_add_proxy_tariff_nodes\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "proxy_tariffs" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"proxy_tariffs\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(636), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250220_add_proxy_tariff_nodes"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250220_add_proxy_tariff_nodes"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2026-03-18 03:22:51.690008+00	2026-03-18 03:22:14.735273+00	0
cfe3b708-8ebe-4449-92b5-1b86b219e038	9eff0d7fd1a7ce50b6cad2da4cacc6c05f759b762cde30c449f92e61fc9c1260	2026-03-18 03:23:17.057591+00	20250220_add_proxy_tariff_nodes		\N	2026-03-18 03:23:17.057591+00	0
f1ac2539-cd1c-4ddf-9c6e-d2270fa95a2e	00aba03d15c34127107125a74e46b834073baff0f2e5498e0e4b6b9a983981d7	2026-03-18 03:23:20.754497+00	20250220120000_add_pending_telegram_and_email_link		\N	2026-03-18 03:23:20.754497+00	0
94850505-7235-4a74-9d55-9a9d232ece66	904788a6d95c4a102a816558367b6ea4bd5325d345318b6ca383e1b574468ede	2026-03-18 03:23:24.442318+00	20250302000000_add_contests		\N	2026-03-18 03:23:24.442318+00	0
dd6fb5da-02d0-4b14-b11a-a20824f87f79	a0b0110b2e3cf9fd22b6c6ac726be72019799706927e62604fa41d6473c88752	2026-03-18 03:23:28.041365+00	20250302100000_contest_start_notification_sent_at		\N	2026-03-18 03:23:28.041365+00	0
\.


--
-- Data for Name: admin_notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_notification_preferences (id, telegram_id, notify_balance_topup, notify_tariff_payment, notify_new_client, notify_new_ticket, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admins (id, email, password_hash, must_change_password, role, allowed_sections, totp_secret, totp_enabled, created_at, updated_at) FROM stdin;
cmmvh8net0000v3p0iy9u32mw	admin@coolgo.network	$2a$12$zWaGKR5p7EXhkbS2fd7qbuNGhwC9MJa3guMhkSfUCekmbM1/vmVaa	f	ADMIN	\N	\N	f	2026-03-18 03:23:50.021	2026-03-18 03:27:00.988
\.


--
-- Data for Name: auto_broadcast_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auto_broadcast_logs (id, rule_id, client_id, sent_at) FROM stdin;
\.


--
-- Data for Name: auto_broadcast_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auto_broadcast_rules (id, name, trigger_type, delay_days, channel, subject, message, enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, email, password_hash, role, remnawave_uuid, referral_code, referrer_id, balance, preferred_lang, preferred_currency, telegram_id, telegram_username, is_blocked, block_reason, referral_percent, trial_used, yoomoney_access_token, utm_source, utm_medium, utm_campaign, utm_content, utm_term, totp_secret, totp_enabled, google_id, apple_id, created_at, updated_at) FROM stdin;
cmmybpz63023iv3pkssjkjc9f	dundunliu@foxmail.com	$2a$10$p6sTTxLbEZ5ZtC/85Xzt8ObEav8IUpP5if5l4lijFQKOvyqyd6YKK	CLIENT	ced8d97f-b631-433a-8e37-49cd569f472a	REF-MMYBPZ62RBG	\N	0	zh	cny	\N	dundunliu_foxmail_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:39.244	2026-03-21 12:02:22.787
cmmybpugx0229v3pk20a9rqq7	shb9573@126.com	\N	CLIENT	0cc1400d-af74-452c-97be-ba0d9d7eed8b	REF-MMYBPUGVJNP	\N	0	zh	cny	\N	shb9573_126_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:33.153	2026-03-21 12:02:16.196
cmmybpuuy022dv3pk1pfmfg4r	VeniceMRM@outlook.com	\N	CLIENT	7a563fb6-6902-49c9-8ecf-a66a2f8c6729	REF-MMYBPUUWA1F	\N	0	zh	cny	\N	VeniceMRM_outlook_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:33.658	2026-03-21 12:02:16.737
cmn0a2vfh000jv3pwdecvpp1d	anyang_sy@outlook.com	\N	CLIENT	13ac01e5-7f6f-4f82-9479-2ed19ebd59c8	REF-MN0A2VFGS2R	\N	0	zh	cny	\N	anyang_sy_outlook_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:14.045	2026-03-21 12:02:14.045
cmmybpv1v022fv3pkty25vgab	3221279110@qq.com	\N	CLIENT	13afd981-4058-4bc0-ae28-65d321bd0fef	REF-MMYBPV1TRXV	\N	0	zh	cny	\N	3221279110_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:33.907	2026-03-21 12:02:17.004
cmmybpvmi022lv3pkzlvlx841	xhliu7@163.com	\N	CLIENT	bf2ce0fe-1a29-4140-b341-85d415c348a7	REF-MMYBPVMG90F	\N	0	zh	cny	\N	xhliu7_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:34.65	2026-03-21 12:02:17.809
cmmybpx4b022xv3pk5s71yvui	1960919173@qq.com	\N	CLIENT	6ec6e362-1c13-40cf-be11-2185fd7d0e45	REF-MMYBPX49OY8	\N	0	zh	cny	\N	1960919173_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:36.587	2026-03-21 12:02:19.929
cmmybq26g024av3pk4ptgh9rt	jemmahuert921@gmail.com	$2a$10$NfeUQiLtFddqwiS5Tqs3duuXeGiajrGq478eH9/Nj5DxbmFRoJflW	CLIENT	daf482f0-ec82-4005-89cf-c2d99cbe5eff	REF-MMYBQ26F8P6	\N	0	zh	cny	\N	jemmahuert921_gmail_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:43.145	2026-03-21 12:02:26.659
cmmybq22t0249v3pksvgnrjli	otsukai520@163.com	\N	CLIENT	5358505e-992f-45cf-87ca-f8e4b649f77c	REF-MMYBQ22SCD5	\N	0	zh	cny	\N	otsukai520_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:43.014	2026-03-21 12:02:26.525
cmmybq2a5024bv3pkufwtaevw	578873567@qq.com	\N	CLIENT	4e63ade8-d914-4d1f-b610-567779c360a9	REF-MMYBQ2A324B	\N	0	zh	cny	\N	578873567_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:43.277	2026-03-21 12:02:26.821
cmmybptsz0223v3pkphw6uh93	15971924974@163.com	$2a$10$FPAQ5w0Mms4pb.d/SMrUcuxqKpM.HxTxVUtvMVZ9mlgUQmeg2uL0C	CLIENT	f52344be-71f3-4519-94b5-c33cc5383812	REF-MMYBPTSX0K6	\N	0	zh	cny	\N	15971924974_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:32.291	2026-03-21 12:02:15.344
cmmybq1z70248v3pka8ps83f4	2163586119@qq.com	$2a$10$NfeUQiLtFddqwiS5Tqs3duuXeGiajrGq478eH9/Nj5DxbmFRoJflW	CLIENT	15e11dc9-cc4e-4324-a085-551161f3a4de	REF-MMYBQ1Z52CH	\N	0	zh	cny	\N	2163586119_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:42.883	2026-03-21 12:02:26.39
cmmybq1vl0247v3pkbdxl375x	1658352018@qq.com	$2a$10$NfeUQiLtFddqwiS5Tqs3duuXeGiajrGq478eH9/Nj5DxbmFRoJflW	CLIENT	0d4e18eb-a6cf-4a8e-adf9-68ecd530d709	REF-MMYBQ1VJCLZ	\N	0	zh	cny	\N	1658352018_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:42.753	2026-03-21 12:02:26.257
cmmybq1rz0246v3pki8ax82yw	how1539621778@qq.com	$2a$10$NfeUQiLtFddqwiS5Tqs3duuXeGiajrGq478eH9/Nj5DxbmFRoJflW	CLIENT	0031d717-1f6c-403f-81dc-92e0088d4d8e	REF-MMYBQ1RXZ7F	\N	0	zh	cny	\N	how1539621778_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:42.623	2026-03-21 12:02:26.059
cmmybq1od0245v3pkvjmcqkpt	3139419589@qq.com	$2a$10$NfeUQiLtFddqwiS5Tqs3duuXeGiajrGq478eH9/Nj5DxbmFRoJflW	CLIENT	e9bfd7eb-83fe-42c1-a305-68f46f9e2063	REF-MMYBQ1OB59V	\N	0	zh	cny	\N	3139419589_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:42.493	2026-03-21 12:02:25.925
cmmybpznn023nv3pkjv85mjeg	362514036@qq.com	$2a$10$UcQQmYRAsV7ZaVHgwYetvua54pMyo/XQj7BB6AKuPbsdidcEFPkNy	CLIENT	e35a39d7-e466-4803-b598-39b153ccb24f	REF-MMYBPZNL1TQ	\N	0	zh	cny	\N	362514036_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:39.876	2026-03-21 12:02:23.457
cmmybpzk7023mv3pk5egtldux	18509201996@163.com	$2a$10$94YoYIw3Lajz3o86L1ec0OEImMT.g3se7BrF7X7kLBvSgQGa77onC	CLIENT	9fc39b93-8345-46d0-b015-345336903cc1	REF-MMYBPZK6UN3	\N	0	zh	cny	\N	18509201996_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:39.752	2026-03-21 12:02:23.324
cmmybpzgq023lv3pkdwgopnkq	730163060@qq.com	$2a$10$n6AKxws5.kz4e.1Lu1iRvOJ/KLgHAjgb.JoFOg51928xa0cXllNOu	CLIENT	a9a53703-438a-4264-9653-a45363866aaa	REF-MMYBPZGOET0	\N	0	zh	cny	\N	730163060_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:39.626	2026-03-21 12:02:23.19
cmmybpzda023kv3pk0vsaaqe0	shoujishangtianmao@gmail.com	$2a$10$Qsb6E4q0BHm/sUFYVdiiJ.snv89YXEqTCdWVZArDt9LeEIZfnx/qC	CLIENT	a334821b-6187-4095-b060-ec7f62b3668b	REF-MMYBPZD8A4O	\N	0	zh	cny	\N	shoujishangtianmao_gmail_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:39.502	2026-03-21 12:02:23.056
cmmybpz9u023jv3pkpmp60772	553917069@qq.com	$2a$10$3r92OPKvVMqvpLnrqd1CjOtCupmbTZrTosVhg96b30Y1/knD/RP2e	CLIENT	36504451-d763-4e9a-aa36-2bf81ea5027d	REF-MMYBPZ9SURS	\N	0	zh	cny	\N	553917069_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:39.378	2026-03-21 12:02:22.922
cmn0a2ubg0009v3pw90kq714z	yidaoxing_icbc@163.com	\N	CLIENT	469795ce-049e-41d4-b510-cb6abace508c	REF-MN0A2UBD3ST	\N	0	zh	cny	\N	yidaoxing_icbc_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:12.602	2026-03-21 12:02:12.602
cmmybpz2m023hv3pkfutu3t8x	linqiangqiangsx@163.com	$2a$10$Cw5wgIle6vhDpJZvPdQDdunk.HbRAvaH6S/tkXvV2W69NqhKz6K8W	CLIENT	32b39d04-1885-4e46-b026-b1af098325f7	REF-MMYBPZ2KD6W	\N	0	zh	cny	\N	linqiangqiangsx_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:39.119	2026-03-21 12:02:22.649
cmmybpyz5023gv3pkou6unnjg	1663714594@qq.com	$2a$10$qx6M.X9TA9hJxrEAHs/K..eQOuQe.yZriHZcgISZYJAQYyv9JjX82	CLIENT	f437498e-28f9-4b3b-92d6-5a2dc5149d9c	REF-MMYBPYZ3R6T	\N	0	zh	cny	\N	1663714594_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:38.994	2026-03-21 12:02:22.515
cmmybpyvp023fv3pku3pmr77u	1179894298@qq.com	$2a$10$3X4kAp21PT0yWFGx.CRlFeLc3r9DVfWzWRWXwsn1NZlZwg0G8qkBS	CLIENT	8e71d19c-7667-46ad-be89-36235eea92fc	REF-MMYBPYVNYKG	\N	0	zh	cny	\N	1179894298_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:38.87	2026-03-21 12:02:22.382
cmmybpys9023ev3pkbkwu51dj	yei242131367@gmail.com	$2a$10$Vabt1W.vBpM7UBKI/DomYOrKeg705iS3uSgsfhH4y4BDjfOCkurHO	CLIENT	693c2adb-00e0-44e0-ab5b-28d6f0ac8ad2	REF-MMYBPYS8L2J	\N	0	zh	cny	\N	yei242131367_gmail_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:38.746	2026-03-21 12:02:22.242
cmmybpyot023dv3pkx8tmlb84	3550164617@qq.com	$2a$10$1/D2i1L2fSKEz7KtWQcQIuDHQOebwsebeqoaD.mnM1GV.ZZrndKaa	CLIENT	55e0d8e4-d629-44d7-bc59-9d1dc559712f	REF-MMYBPYORQMZ	\N	0	zh	cny	\N	3550164617_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:38.622	2026-03-21 12:02:22.108
cmmybpylc023cv3pklea6c6kl	2893577529@qq.com	$2a$10$EtL2YOZHv/EOS0alJ.BGNury4S2sPw8qXKBB8v6aheOVUsabTt09K	CLIENT	24c403ed-274c-48ec-a80c-edb9845c11a9	REF-MMYBPYLAWI7	\N	0	zh	cny	\N	2893577529_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:38.497	2026-03-21 12:02:21.975
cmmybpyhs023bv3pkj0hkiqkw	2762235902@qq.com	$2a$10$VQkN.rnlFz8wCamBuSaWPeDcXfw9zyTjTaVUIix6goVazrJbmjc9a	CLIENT	f97892b1-c04b-4168-9330-673448f23c9a	REF-MMYBPYHQBXC	\N	0	zh	cny	\N	2762235902_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:38.368	2026-03-21 12:02:21.842
cmmybpyec023av3pkm9evqnie	shuhui0823@qq.com	$2a$10$fJVcYOPn4hqrGYghWlN4keaDDtHK/oeXDGWRzo6vhvGU/GAnIWsyu	CLIENT	ca9988f5-0548-4d27-9e6f-8d7723edd75c	REF-MMYBPYEAV3N	\N	0	zh	cny	\N	shuhui0823_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:38.244	2026-03-21 12:02:21.69
cmmybpyav0239v3pk88jvzaa8	635330751@qq.com	$2a$10$zCj6U444087W3KIHe9hTwuO5qqUUkWUh1dfkoOZsn8labmfoAVi9K	CLIENT	5d1d5f33-a697-464a-8c25-580e37c3577b	REF-MMYBPYAT3ZH	\N	0	zh	cny	\N	635330751_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:38.119	2026-03-21 12:02:21.556
cmmybpy7e0238v3pkvqsrk04v	2322186308@qq.com	$2a$10$bB5ypKQgKo6c7kp/s8qZYOPrLqpeqypXmFG1IEvzF60ZZooFnUtYm	CLIENT	ff6f9921-3e09-4c43-8edd-805678172e7d	REF-MMYBPY7CVQ1	\N	0	zh	cny	\N	2322186308_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:37.995	2026-03-21 12:02:21.42
cmmybpy3y0237v3pk4758jcuy	liangsyh@163.com	$2a$10$/FbCDjSt/e6CVD0vW5JIe.QCVKFiVnaZA8Cx7Y1itvWEZncPnpFT.	CLIENT	440f28b5-9dcf-4f8e-9420-41d31ef534b6	REF-MMYBPY3W0XE	\N	0	zh	cny	\N	liangsyh_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:37.87	2026-03-21 12:02:21.285
cmmybpy0i0236v3pk1acfhl44	2672112555@qq.com	$2a$10$n571mvnJMcCCmdntcN6mP.rTGLapqdwsaxCcARjy41nUX7bSiymym	CLIENT	ae3cb7aa-d465-4268-adff-7713b3fc850e	REF-MMYBPY0G9WO	\N	0	zh	cny	\N	2672112555_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:37.747	2026-03-21 12:02:21.15
cmmybpxtn0234v3pk9r0ai2oi	291334143@qq.com	$2a$10$ewvy6fRPQYJeKwBKUi/BYORkKpeuW65BCb6QXd1kGYA9KDzJLalqu	CLIENT	c0f394fa-322b-4304-aaef-62d7a06c5335	REF-MMYBPXTL9DK	\N	0	zh	cny	\N	291334143_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:37.499	2026-03-21 12:02:20.881
cmmybpxq60233v3pkeks7f38q	3363660989@qq.com	$2a$10$fU54Az.Hx5BJBEqXpDbbJ.qcDAgEMQ4I4lhvrZrBsROXqe9xJDsDq	CLIENT	e4604a72-d8f5-4be7-b51a-53e9fd469418	REF-MMYBPXQ5CJH	\N	0	zh	cny	\N	3363660989_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:37.375	2026-03-21 12:02:20.746
cmmybpxmq0232v3pk3li1esk1	724815022@QQ.com	$2a$10$nb.bKjnNhj3/GGV.F3QEK.FfaeqbPviNIJstZlf1mqqO/TUsK8jrC	CLIENT	bb56330c-f526-4a53-b40e-4057d3494e25	REF-MMYBPXMO7CH	\N	0	zh	cny	\N	724815022_QQ_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:37.25	2026-03-21 12:02:20.612
cmmybpxjb0231v3pk6wmxun5f	2301864924@QQ.COM	$2a$10$t/Vv8aJpK0IABQax2M9OVujsEwM8D9XK/Jb63MO8t1g5O35Fi8qDS	CLIENT	8155a48f-f6bf-4e7b-a221-acc813399861	REF-MMYBPXJ9NCO	\N	0	zh	cny	\N	2301864924_QQ_COM	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:37.127	2026-03-21 12:02:20.477
cmmybpxeo0230v3pknt7gzqh9	18691415186@163.com	$2a$10$pew4wradxUzwxDzGO.N8me9mgcR9i5.V.6fNTDiBvsbxMT5jeLs6C	CLIENT	4fdd34a2-4f8f-41a0-a2d2-a0d5cd864f9d	REF-MMYBPXENWER	\N	0	zh	cny	\N	18691415186_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:36.961	2026-03-21 12:02:20.342
cmmybpxb9022zv3pk6bk791x3	dutchangyang@outlook.com	$2a$10$RUdBBc5SD6Xak4JkPBviCe3tKSemjqSBayvSfJnPkESF6S0uPYY0q	CLIENT	523393a4-0088-46e3-81b4-3f16b51f08fe	REF-MMYBPXB88FL	\N	0	zh	cny	\N	dutchangyang_outlook_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:36.838	2026-03-21 12:02:20.198
cmmybpx7r022yv3pk8j7lwbes	3057835348@qq.com	$2a$10$YQi31ZziEABz2ip84.g8Qulc6T1I8kLOQC7kWPIrQ5qUH/wWBFBBC	CLIENT	f3eadefc-ab4d-44d5-bffc-2451b06ac000	REF-MMYBPX7PSXF	\N	0	zh	cny	\N	3057835348_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:36.711	2026-03-21 12:02:20.062
cmn0a2usb000dv3pwpciahb6i	1139700251@qq.com	\N	CLIENT	43229116-e363-487a-bd93-ddd4b27fe5e0	REF-MN0A2USAC54	\N	0	zh	cny	\N	1139700251_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:13.211	2026-03-21 12:02:13.211
cmmybq2dr024cv3pkhe4gmicx	admin@coolgo.network	$2a$10$FPAQ5w0Mms4pb.d/SMrUcuxqKpM.HxTxVUtvMVZ9mlgUQmeg2uL0C	CLIENT	ccc4ec48-47cc-419d-80ff-8ffc23839727	REF-MMYBQ2DPCNX	\N	0	zh	cny	\N	admin_coolgo_network	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:43.407	2026-03-21 12:02:26.954
cmmybpx0t022wv3pkeqt0kk00	2237594540@qq.com	$2a$10$18oTT.PKBLn2CPXvCNBEXuF.zzK6glJjnfEFjpDiPMEIJjb9pKLJi	CLIENT	5bd396a1-99ae-44cf-aa6d-f2b2d5f8253a	REF-MMYBPX0RTPY	\N	0	zh	cny	\N	2237594540_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:36.461	2026-03-21 12:02:19.794
cmmybpwxd022vv3pkegua5h1e	957578631@qq.com	$2a$10$pAUkFq6uowabSS/HeO/.COJBXCrY9SNMr0sP4EaSuwhS.q4mOtKBe	CLIENT	45db155e-8f65-4fa2-a74e-b0d325b0d564	REF-MMYBPWXBELX	\N	0	zh	cny	\N	957578631_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:36.338	2026-03-21 12:02:19.661
cmmybpwty022uv3pkiriaarhf	1419534906@qq.com	$2a$10$9n6rXntZ.YwjZAQQxov08OKAjEwja4cwAoHoUqICbywuKiyt6Guc6	CLIENT	4ab7d2f7-374c-4af2-a86b-b6adcb1ebee4	REF-MMYBPWTWFEA	\N	0	zh	cny	\N	1419534906_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:36.214	2026-03-21 12:02:19.527
cmmybpwqh022tv3pky4h7ond4	1224272788@qq.com	$2a$10$y7O9vQmA509RivumwHVhDe9OaMl9O/xDFY9AmyRvxLLsQMbTnaFgG	CLIENT	d976bdbc-fbeb-454d-b735-afbc6ddeb8f5	REF-MMYBPWQFR0S	\N	0	zh	cny	\N	1224272788_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:36.089	2026-03-21 12:02:19.394
cmmybpwn0022sv3pk4mfynwei	50611706@qq.com	$2a$10$8MXsZPIDxrd7c6mEG/WlbOTwdm9/Y7brTP4pH9y0mZDqSoUrFn5eq	CLIENT	d65a2814-14ee-4f70-baf3-2da4e797bfb4	REF-MMYBPWMYBKA	\N	0	zh	cny	\N	50611706_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:35.964	2026-03-21 12:02:19.256
cmmybpwjl022rv3pkrnanlf59	hendonhazel24@gmail.com	$2a$10$XGh/jz0JgGY1pOrxjH5yze1.fnK/GBLhN0hE2pnqz0jR1dhNOApyO	CLIENT	b494fe9d-e29e-4a73-9d8f-7196d81c2e1c	REF-MMYBPWJJGMY	\N	0	zh	cny	\N	hendonhazel24_gmail_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:35.841	2026-03-21 12:02:19.121
cmmybpwg0022qv3pkutzb2782	584038152@qq.com	$2a$10$LQZQE/arQdGxAbBSbyfUZOXPx8jBlu9OapEE776yLBI8.2XG7wt8K	CLIENT	5d7445dd-72c1-44f9-9e83-c59cb41a3bfb	REF-MMYBPWFYJ35	\N	0	zh	cny	\N	584038152_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:35.712	2026-03-21 12:02:18.988
cmmybpwc9022pv3pk6szbkvw8	2926946154@qq.com	$2a$10$SbmgZM7Ri7l3nGl4Sp5Hl.jRlXybs4LAhezrhDpTHo8th2D5azHxO	CLIENT	0fbccc75-db18-4b18-b4f1-9a71a3edb0aa	REF-MMYBPWC7JHC	\N	0	zh	cny	\N	2926946154_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:35.577	2026-03-21 12:02:18.856
cmmybpvwx022ov3pklhuzcf38	1748820880@qq.com	$2a$10$jN3s0JSDy7BaO8EfQ.t98OUnN.LtXJxQ2EOaPMOJ00mdw0r0grmHi	CLIENT	ad0b3824-d7c0-4993-9415-6c6cccea7da1	REF-MMYBPVWV1VM	\N	0	zh	cny	\N	1748820880_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:35.025	2026-03-21 12:02:18.237
cmmybpvtg022nv3pk0fp1cwex	dongbc827@gmail.com	$2a$10$pICTeuwvvdiJiJasos5XRuhwtHRySewJnZftoWPmgy6gG7E7LKaDa	CLIENT	870fd8aa-4f2e-445d-9456-0796823f3f76	REF-MMYBPVTEOOS	\N	0	zh	cny	\N	dongbc827_gmail_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:34.9	2026-03-21 12:02:18.089
cmmvi45nm0000v3vwu5z8rsre	client@coolgo.network	$2a$12$W6p1Ojld24P8mfw2vEyMMOlyD6nox7Zv50VqPqvBbirygLZmI/Zui	CLIENT	f1ee353f-0d9b-4428-87c8-089638bfb7d4	QL78DU6Q	\N	0	zh	cny	\N	client	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-18 03:48:20.001	2026-03-21 12:02:18.647
cmmybpvq0022mv3pk0p4rddz0	3048711915@qq.com	$2a$10$Scjb/fR9kCHe0KCCAewEluqlmDDf2yo1vg54L2J0VjocOECvroWw.	CLIENT	9905ddda-dafa-4be3-bfe2-33bcb7bd50d1	REF-MMYBPVPY2NR	\N	0	zh	cny	\N	3048711915_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:34.776	2026-03-21 12:02:17.955
cmmybpvj3022kv3pkavrtjeze	17067462@qq.com	$2a$10$DNa46.NXlM5Qskbzfv3ClezEfegw0nv.dWd7U5bcRLrIUiwTV4RuK	CLIENT	8d1f7024-185b-4eed-adb2-7a7b844d0b55	REF-MMYBPVJ1P3K	\N	0	zh	cny	\N	17067462_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:34.527	2026-03-21 12:02:17.676
cmmybpvfn022jv3pka7uukfar	2256461799@qq.com	$2a$10$LREm20JZ/1Smv/13p2ZSm.bnakSzA.D7CX/raUjV.baazn67AKw1a	CLIENT	94e157fd-2947-43d9-b15f-0591b1484bcc	REF-MMYBPVFL978	\N	0	zh	cny	\N	2256461799_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:34.404	2026-03-21 12:02:17.541
cmmybpvc8022iv3pkdm6pv0d9	77037562@qq.com	$2a$10$7My0sgekHMtlZduYIOHb8O5edNr7duBoFGGESc/vmgeZvi856U3Ge	CLIENT	8d76bd52-6de1-4294-ae07-e9a638171298	REF-MMYBPVC6EKV	\N	0	zh	cny	\N	77037562_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:34.28	2026-03-21 12:02:17.407
cmmybpv8r022hv3pkuf293ol0	3452479621@qq.com	$2a$10$xJp5ooWZt3aOjLzUhCs2..J2rfT0TQqXQCBvIKOjEK1G/yoBN5yBW	CLIENT	215243ed-efb8-4e3a-a82a-47b1c1f82b30	REF-MMYBPV8PG0I	\N	0	zh	cny	\N	3452479621_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:34.155	2026-03-21 12:02:17.272
cmmybpuri022cv3pkp9j3aovn	2431094981@qq.com	$2a$10$R5i9zbABSDgBwvpIgITNoum8PReq5QSZA1PtBgPEcZp0fnTKVq3Ji	CLIENT	b9c374a4-1dc2-4b74-a4f7-5d9344e311ed	REF-MMYBPURGW03	\N	0	zh	cny	\N	2431094981_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:33.534	2026-03-21 12:02:16.603
cmmybpv5a022gv3pkg1akwxn4	3053258835@qq.com	$2a$10$XohlvosnQeBHWAv58lC1le/ugLw5ixTiWBouca9iMXdOwmU90LGQi	CLIENT	2ec4e38a-6306-40a6-bad3-505c1e9fb05e	REF-MMYBPV59FJ8	\N	0	zh	cny	\N	3053258835_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:34.031	2026-03-21 12:02:17.138
cmmybpuyd022ev3pk20fni7rp	aurora20041103@163.com	$2a$10$2I3EZs.Fr0/j1YkgdPT21OrS1Ew0rTg2fgZ2ZA1GeFgNzNDZpdscu	CLIENT	02ab3db1-a9af-48f5-976c-7bd78d512a8a	REF-MMYBPUYBR3P	\N	0	zh	cny	\N	aurora20041103_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:33.782	2026-03-21 12:02:16.87
cmmybpuo3022bv3pku7h1yoc9	anzhi0407@qq.com	$2a$10$aS0LqL5pWz27gnfGQXKuvuZQZ8jemPc6STbyauLvMuE0SNEBFfFPa	CLIENT	8388f412-82ea-460d-9257-dd50e32f3c46	REF-MMYBPUO1AVF	\N	0	zh	cny	\N	anzhi0407_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:33.411	2026-03-21 12:02:16.465
cmmybpukd022av3pk46r97zlq	menghua3333jiang@126.com	$2a$10$q0/B0oHg45J2vW0Fh3fYYuBFtUWxWH2Pf2jEtNhxuRjDvrqCdY0Ym	CLIENT	4fc5d97d-3ba7-4d69-a2a0-2d241aa342b4	REF-MMYBPUKB6QK	\N	0	zh	cny	\N	menghua3333jiang_126_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:33.277	2026-03-21 12:02:16.331
cmmybpudh0228v3pkxbvxs6xe	2043677384@qq.com	$2a$10$OXcq.2ydnWZlOh77HKg/Cef2zlc3H1.r8WPXmw4TTBSRmUdOqxP3m	CLIENT	b24ea7c5-0bb5-4ef2-b954-5b1481c8debc	REF-MMYBPUDFOG6	\N	0	zh	cny	\N	2043677384_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:33.029	2026-03-21 12:02:16.058
cmmybpu9f0227v3pkdhyehnw1	1278306163@qq.com	$2a$10$bwc2MqgnQLVl2q9y7qtn0eP121qaJ3EIPaa5r5qcTVgtMkK9S03fK	CLIENT	b43a6424-ae1b-408f-9590-f49c5f01d45e	REF-MMYBPU9D6VV	\N	0	zh	cny	\N	1278306163_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:32.883	2026-03-21 12:02:15.926
cmmybpu5y0226v3pkn9nbqaun	3209790741@qq.com	$2a$10$n0xF5hLCZGS01yI5fE14V.1lc83qpnS0zLbTrU7teECmOJj1WekOi	CLIENT	064a879d-cd5b-4586-a2d8-a2209bdc7019	REF-MMYBPU5X40P	\N	0	zh	cny	\N	3209790741_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:32.759	2026-03-21 12:02:15.792
cmmybpu080225v3pk3o7k6rwb	970790649@qq.com	$2a$10$icmJ1CM1glohYmLmLUHyXuQn5fosM1uXHsH3Nyo/pHXzAFsnkWr5W	CLIENT	11c199c9-2527-4190-8947-79ac4668d98e	REF-MMYBPU06LGU	\N	0	zh	cny	\N	970790649_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:32.552	2026-03-21 12:02:15.659
cmmybptwg0224v3pkbgm7jx1k	3529223545@qq.com	$2a$10$GMQ7h1CfVwa9qJwDbsVPcuVzqCPGJ435tJr/T6GK4fSevzw/ex/zG	CLIENT	9e5049d0-ec82-456f-8bab-930f047107e5	REF-MMYBPTWE1SU	\N	0	zh	cny	\N	3529223545_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:32.416	2026-03-21 12:02:15.48
cmmybptp40222v3pka33dgnur	iringxu@qq.com	$2a$10$O85VQW4oK8snL.Bwoe/zruk3rIgyL5QlrAmv5wsDtRflUYkGYmUue	CLIENT	b7584460-4bec-40bb-bf85-f0001001eda1	REF-MMYBPTP2YII	\N	0	zh	cny	\N	iringxu_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:32.152	2026-03-21 12:02:15.207
cmmybptli0221v3pkp4jxt9oj	mahmoudrezahosseini@gmail.com	$2a$10$NGme/iiIM.0nOf1IBwqykOTUx0Rt2mPAJyaP7A5.MZ4oYm3.oOuja	CLIENT	b19da8f3-ff80-44c0-95fe-4ea141b2b85c	REF-MMYBPTLGGNU	\N	0	zh	cny	\N	mahmoudrezahosseini_gmail_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:32.022	2026-03-21 12:02:15.065
cmmybpti10220v3pknzg76ric	3049972484@qq.com	$2a$10$3KQrRmd86w/CqbMEz7Q2Gu.0TLB81s/FEn2gYT5jGCcumyMt07ChW	CLIENT	bfc971dc-481b-4217-9379-e6e3ec2b8ae6	REF-MMYBPTHZY9J	\N	0	zh	cny	\N	3049972484_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:31.898	2026-03-21 12:02:14.932
cmmybq1ko0244v3pkfir70a50	1483402169@qq.com	$2a$10$NfeUQiLtFddqwiS5Tqs3duuXeGiajrGq478eH9/Nj5DxbmFRoJflW	CLIENT	e83dbd77-42d0-43f1-acf4-9423d6e1969e	REF-MMYBQ1KMKB4	\N	0	zh	cny	\N	1483402169_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:42.36	2026-03-21 12:02:25.775
cmmybq1db0242v3pk09hbozit	912868332@qq.com	$2a$10$F52s9ro.Svvvie7SimbzBOqBMsVGZjalcRmrbUMaQVcSftZWZ36gC	CLIENT	c933d7d9-37e5-4988-b597-6648fcc29332	REF-MMYBQ1D9VAT	\N	0	zh	cny	\N	912868332_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:42.095	2026-03-21 12:02:25.491
cmmybq1960241v3pkb6iqu7sx	1706816435@qq.com	$2a$10$0LDLdf7f1jYGrfYq/RxLVuFTBt8PbQQzvTevugtiMPAYeGJahlrVC	CLIENT	5d556fc5-ba4e-4c9f-b7ec-76fb758e5198	REF-MMYBQ194MNI	\N	0	zh	cny	\N	1706816435_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:41.946	2026-03-21 12:02:25.353
cmmybq15j0240v3pkbw2nn1o0	2719545088@qq.com	$2a$10$Tjg5ZRO2rE3YnwerkOZP4eI.3nvBtZebvQy9qHKP.2LkTpAQn4vg2	CLIENT	36f727bc-f0a3-46fd-9c8a-42721d7c3aa3	REF-MMYBQ15HDZA	\N	0	zh	cny	\N	2719545088_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:41.815	2026-03-21 12:02:25.217
cmmybq11x023zv3pk3s5k8qg4	2841637057@qq.com	$2a$10$wA9zf3bANP2VX06kBp3FXOtTLD/3MP67SoXZtE1r37IMWjoTskqkK	CLIENT	aa0a4446-581d-41cc-8bc2-9d86f9c686e5	REF-MMYBQ11VFH3	\N	0	zh	cny	\N	2841637057_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:41.685	2026-03-21 12:02:25.072
cmmybq0uu023yv3pkkx4mwmjl	15307424476@163.com	$2a$10$/HjNU91fxxoc/eI5CDKngOrBK3aMK2hguIG85/gM9FAliORpBLXxe	CLIENT	53d5fef7-fca9-444f-a392-728f38147534	REF-MMYBQ0US0IR	\N	0	zh	cny	\N	15307424476_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:41.43	2026-03-21 12:02:24.94
cmmybq0qj023xv3pkr2ansles	2541958916@qq.com	$2a$10$dhJr0bj/K5DsydKRI0K0euM7C3nCnmFD6Yv6m9KqVIZv1ITmlCE7i	CLIENT	528c5fe8-58bc-4c47-978b-e73fcfa37ccc	REF-MMYBQ0QHBKN	\N	0	zh	cny	\N	2541958916_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:41.276	2026-03-21 12:02:24.807
cmmybq0n2023wv3pkdl0gseg6	3122049744@qq.com	$2a$10$GswjFj6.S0z8D2thJpjgLeUqJug7cbAS0e6oSqmWHmfJHcUbEKlri	CLIENT	41ddbb24-f6c4-45fa-81ad-bb096f9f6c6c	REF-MMYBQ0N0KU1	\N	0	zh	cny	\N	3122049744_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:41.15	2026-03-21 12:02:24.666
cmmybq0jm023vv3pke8h5hqfq	1624171358@qq.com	$2a$10$SCPOyAjx7SczTdSp7TkJuujqV1qvT8fz6wYfVBpgh.9WuSPV123vG	CLIENT	d4d67ef5-b8e1-450f-931a-c43b9fbaa6a0	REF-MMYBQ0JK1MW	\N	0	zh	cny	\N	1624171358_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:41.027	2026-03-21 12:02:24.53
cmmybq0g6023uv3pk78k72zzc	2113773956@qq.com	$2a$10$7JJxB0G7ozLTaY3kRbegxO7YB.GR9D4m.L/VJEaf08750O/CbHvve	CLIENT	38c6e02c-a9d5-4552-8925-42c279da5928	REF-MMYBQ0G4UPR	\N	0	zh	cny	\N	2113773956_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:40.903	2026-03-21 12:02:24.396
cmmybq0ci023tv3pkss3vur1z	3160714748@qq.com	$2a$10$UrMq7ibrXlK30ldUEuWMWuKyMGU74fh1huccxolAooxf5EztMOWBm	CLIENT	b3c0b3a6-c28c-4547-9a22-63fb6677e5cd	REF-MMYBQ0CGGQE	\N	0	zh	cny	\N	3160714748_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:40.77	2026-03-21 12:02:24.261
cmmybq08y023sv3pkq8uzghcw	3203475426@qq.com	$2a$10$4EQvqFxNCBIt7UNpsA8bDuIQaj3rBtkJ4c8BmxvbeohYgfIJjYAhm	CLIENT	afaa29e2-5b75-46eb-bdee-650dabd65f19	REF-MMYBQ08W30Q	\N	0	zh	cny	\N	3203475426_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:40.642	2026-03-21 12:02:24.128
cmmybq03l023rv3pkpu0qn3w4	1307638152@qq.com	$2a$10$NxQkVmwcNEij4rnRUbZZM.c2me4y0TbbbTvZ/M8GM2eQ2C5eqHvt6	CLIENT	6d193fc0-a726-4126-b3b2-de8d26eba5d2	REF-MMYBQ03JGZB	\N	0	zh	cny	\N	1307638152_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:40.449	2026-03-21 12:02:23.994
cmmybq000023qv3pkn6bfoplm	wjs5050@qq.com	$2a$10$3ERy.NN0FjkdOfco9B35qeO9GW17mGVOpgx9pbF5fXaGvv9dzQ.Ju	CLIENT	836170cf-9627-4167-9746-8d345ea8e8b4	REF-MMYBPZZYCZK	\N	0	zh	cny	\N	wjs5050_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:40.32	2026-03-21 12:02:23.861
cmmybpzwl023pv3pkrly5ac42	yuqinglin_2023@qq.com	$2a$10$wGb0SwqgyMeI0p3IqsNv0e.A5KCa2p7zMWS8KVCfS.rPiEx99u1W2	CLIENT	7475e292-15d3-4d74-b686-9b4ff5d76c81	REF-MMYBPZWJEEH	\N	0	zh	cny	\N	yuqinglin_2023_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:40.197	2026-03-21 12:02:23.727
cmmybpzt4023ov3pkad8sxaz2	929270359@qq.com	$2a$10$Md7QqyV36m6yNVoubZHAROewyAEcT.F/sQkjxYuPktpDK3TNkClR6	CLIENT	62f182ea-e58b-4b1f-b189-85ba33222f8e	REF-MMYBPZT2SNE	\N	0	zh	cny	\N	929270359_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:40.072	2026-03-21 12:02:23.592
cmmybptee021zv3pkap9814ow	1573023718@qq.com	$2a$10$xgVWhp4eXM6goYdJ2L4fgu2/wB8glGthYxRTuH8U8SWRBB2W1/Vam	CLIENT	26daf4b1-15a3-4fc7-b423-e650e7a11aab	REF-MMYBPTECY1C	\N	0	zh	cny	\N	1573023718_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:31.766	2026-03-21 12:02:14.799
cmmybptay021yv3pkzn43zsas	18621088981@163.com	$2a$10$a.8c.z6lm9RZ5dNVHbGDLOOded5vKFAaqKElZcYSlk.380..KC5d.	CLIENT	fa9dc9a2-db49-4243-ac1f-34bc7e79661e	REF-MMYBPTAW820	\N	0	zh	cny	\N	18621088981_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:31.642	2026-03-21 12:02:14.664
cmmybpt5r021xv3pkfl1p073j	ngockienvo911@gmail.com	$2a$10$BXUDcqLTiNubvdKGtUDvoe8n2zgG3Y7X/0OJm91PptrzjyXTR.xPi	CLIENT	2a09dab9-8a3a-4c33-b3c6-7d1e79e224a2	REF-MMYBPT5N6AN	\N	0	zh	cny	\N	ngockienvo911_gmail_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-20 03:12:31.454	2026-03-21 12:02:14.46
cmn0a2vna000lv3pwyar5laz3	344474544@qq.com	$2a$10$V3OzFZEmU7N5VuzVEdMgTOyErwnyIDnDaNTbsp9o04IWJYXX1ULmu	CLIENT	c9ea67d2-ace5-45ed-b94c-d4414e5a3211	REF-MN0A2VN9O4X	\N	0	zh	cny	\N	344474544_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:14.327	2026-03-21 12:02:14.327
cmn0a2vjh000kv3pwnyhh2k9z	der145wertu@163.com	$2a$10$j3OShgB.oCLU/jdxLPLj7eneT94sAwZAaaAa3BagWn5vJ1l5ttyXC	CLIENT	0eeb2b2e-e408-4dcd-9813-77f4114a487d	REF-MN0A2VJGJ49	\N	0	zh	cny	\N	der145wertu_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:14.19	2026-03-21 12:02:14.19
cmn0a2vbs000iv3pw4uxw2oyq	3027676743@qq.com	$2a$10$34KDCEycSHPQ7RW7AoIo3.NOG9jHektrLaaJ0Mn3AasVTiJ0PU.GW	CLIENT	625162d0-e5af-462d-8fb0-ca7a00f59112	REF-MN0A2VBRPK4	\N	0	zh	cny	\N	3027676743_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:13.912	2026-03-21 12:02:13.912
cmn0a2v7u000hv3pwfzqpc2n1	1137771131@qq.com	$2a$10$VrOLRVzRqD45Ol5nmOJVV.vkTZNzr0Koz6Hon1fZUjfEazEgwAEWW	CLIENT	2dd4f721-2e10-42d0-8911-b332ae71bef8	REF-MN0A2V7TG9O	\N	0	zh	cny	\N	1137771131_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:13.77	2026-03-21 12:02:13.77
cmn0a2v43000gv3pwrziiof5v	1840459967@qq.com	$2a$10$5BVcAkz95bTs46gLSsH2HOOEArKRM7.vbYRIl8cstiJj3/iD.38bm	CLIENT	5bf5a2e6-4f07-4f10-b784-5ff66f6d3d90	REF-MN0A2V42ZBF	\N	0	zh	cny	\N	1840459967_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:13.635	2026-03-21 12:02:13.635
cmn0a2v09000fv3pwyz7nwm1h	892455559@qq.com	$2a$10$p5E90wtjbNPCZt46WbPTee5hdld5/GMp0kM4RMtTiwzFT43bNfyo2	CLIENT	277e4dac-a616-4b9c-ba19-0d6471f9d602	REF-MN0A2V08EP5	\N	0	zh	cny	\N	892455559_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:13.498	2026-03-21 12:02:13.498
cmn0a2uw8000ev3pw5qik72px	834127478@qq.com	$2a$10$anxVMqJdUpOn.h2eRRUhRuuMcOrZ3SN2ZOdeQmXG7S1E9Y9E12PLu	CLIENT	61a161e0-10e0-4ea2-b258-f478093f53bd	REF-MN0A2UW7K75	\N	0	zh	cny	\N	834127478_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:13.352	2026-03-21 12:02:13.352
cmn0a2uok000cv3pw4clqos9x	18624283611@163.com	$2a$10$C5PJ0NOEsxMDsRTGTzGSseuh.RPb99GPGHzQxSaJ36AjT.nf18v4S	CLIENT	03cfa07a-c421-404c-b207-15cd2682594a	REF-MN0A2UOJDDM	\N	0	zh	cny	\N	18624283611_163_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:13.076	2026-03-21 12:02:13.076
cmn0a2uku000bv3pwab87ec74	2465647213@qq.com	$2a$10$jDxkMGCZp3tB7m9R8DgAheQCEHPwdlN59mywyEDg.mT0.thSrCkKq	CLIENT	94a57ef7-2f4f-4c9c-9b4c-5e8d41e02dd7	REF-MN0A2UKTLBO	\N	0	zh	cny	\N	2465647213_qq_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:12.943	2026-03-21 12:02:12.943
cmn0a2uh4000av3pw07sxavxd	rxyycd@outlook.com	$2a$10$c0OPKM7OADiUdS9R5Qomy.GWI.P6a5N4fpAbTL1tx2IPvh.B1x7Fu	CLIENT	9e0ed193-181f-49a7-89f8-fb394c2b9e84	REF-MN0A2UH3DZC	\N	0	zh	cny	\N	rxyycd_outlook_com	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-21 12:02:12.808	2026-03-21 12:02:12.808
cmn1f16bb000bv3ugh6mkjb9q	beilehipi@gmail.com	$2a$12$sOFSuVgDwraY8eNPE7GyEOcUhfEAO.Seah80fXrwGVUlOT6ZS9CBy	CLIENT	d2bed672-561b-4e46-bb15-b702bae9c15e	REF-C90BD119	cmmybq2dr024cv3pkhe4gmicx	0	zh	cny	\N	\N	f	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-03-22 07:08:39.093	2026-03-22 07:08:52.726
\.


--
-- Data for Name: contest_winners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contest_winners (id, contest_id, client_id, place, prize_type, prize_value, applied_at, created_at) FROM stdin;
\.


--
-- Data for Name: contests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contests (id, name, start_at, end_at, prize1_type, prize1_value, prize2_type, prize2_value, prize3_type, prize3_value, conditions_json, draw_type, status, daily_message, start_notification_sent_at, created_at, updated_at) FROM stdin;
cmmvkuwlj000dv37soez8gnvv	xs	2026-03-18 05:04:45.372	2026-04-17 05:04:45.372	custom		custom		custom		\N	random	draft	\N	\N	2026-03-18 05:05:07.208	2026-03-18 05:05:07.208
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, client_id, token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, client_id, order_id, amount, currency, status, provider, external_id, tariff_id, proxy_tariff_id, singbox_tariff_id, remnawave_user_id, metadata, created_at, paid_at, referral_distributed_at) FROM stdin;
cmmvkgwu7000cv37sw0tqjgz1	cmmvi45nm0000v3vwu5z8rsre	f9450968-e35b-4a7f-afac-5fc5f905bb9b	0	USD	PAID	balance	\N	\N	\N	\N	\N	\N	2026-03-18 04:54:14.336	2026-03-18 04:54:14.332	2026-03-18 04:54:14.998
cmmx6faqc00ahv3pkar2kkdv1	cmmvi45nm0000v3vwu5z8rsre	aaba8a94-24be-4853-bd21-09c09e37670d	0	USD	PAID	balance	\N	\N	\N	\N	\N	\N	2026-03-19 07:56:36.756	2026-03-19 07:56:36.754	2026-03-19 07:56:37.407
\.


--
-- Data for Name: pending_email_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pending_email_links (id, client_id, email, verification_token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: pending_email_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pending_email_registrations (id, email, password_hash, preferred_lang, preferred_currency, referral_code, utm_source, utm_medium, utm_campaign, utm_content, utm_term, verification_token, expires_at, created_at) FROM stdin;
cmn09i4oh005sv3a0v7bd9676	beilehipigo@gmail.com	$2a$12$v1oYHvLWLlhF0NZrV4DN9eGJGIz/T0bKyLn45dwYUAIPAAfBF0mx.	zh	cny	\N	\N	\N	\N	\N	\N	17e0e36d179baddd78416860a069bf0cb9596b1bb2084bf9f7fcf03e87ec6951	2026-03-22 11:46:05.888	2026-03-21 11:46:06.258
\.


--
-- Data for Name: pending_telegram_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pending_telegram_links (id, client_id, code, expires_at, created_at) FROM stdin;
cmmvrdwmf0009v3d4oziy99as	cmmvi45nm0000v3vwu5z8rsre	166010	2026-03-18 08:17:51.396	2026-03-18 08:07:51.399
\.


--
-- Data for Name: promo_activations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_activations (id, promo_group_id, client_id, created_at) FROM stdin;
\.


--
-- Data for Name: promo_code_usages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_code_usages (id, promo_code_id, client_id, created_at) FROM stdin;
\.


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_codes (id, code, name, type, discount_percent, discount_fixed, squad_uuid, traffic_limit_bytes, device_limit, duration_days, max_uses, max_uses_per_client, is_active, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promo_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_groups (id, name, code, squad_uuid, traffic_limit_bytes, device_limit, duration_days, max_activations, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: proxy_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proxy_categories (id, name, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: proxy_nodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proxy_nodes (id, name, token, status, last_seen_at, public_host, socks_port, http_port, capacity, current_connections, traffic_in_bytes, traffic_out_bytes, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: proxy_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proxy_slots (id, node_id, client_id, proxy_tariff_id, login, password, expires_at, traffic_limit_bytes, connection_limit, traffic_used_bytes, current_connections, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: proxy_tariff_nodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proxy_tariff_nodes (id, tariff_id, node_id) FROM stdin;
\.


--
-- Data for Name: proxy_tariffs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proxy_tariffs (id, category_id, name, proxy_count, duration_days, traffic_limit_bytes, connection_limit, price, currency, sort_order, enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: referral_credits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referral_credits (id, referrer_id, payment_id, amount, level, created_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, admin_id, token, expires_at, created_at) FROM stdin;
cmmvhbxf4000bv3p05cw4pbtd	cmmvh8net0000v3p0iy9u32mw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21tdmg4bmV0MDAwMHYzcDBpeTl1MzJtdyIsImVtYWlsIjoiYWRtaW5AY29vbGdvLm5ldHdvcmsiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MzgwNDM4MiwiZXhwIjoxNzc0NDA5MTgyfQ.MTCyaT-c6k07lWNMYqgw6SGsOd0jynr5qqUVSt8LETI	2026-03-25 03:26:22.955	2026-03-18 03:26:22.959
cmmvpv0yc000av3igfejalgkx	cmmvh8net0000v3p0iy9u32mw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21tdmg4bmV0MDAwMHYzcDBpeTl1MzJtdyIsImVtYWlsIjoiYWRtaW5AY29vbGdvLm5ldHdvcmsiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3MzgxODcxMCwiZXhwIjoxNzc0NDIzNTEwfQ.Xu0azmvW4LnB15xdnYhvY2jfXk-sPI4u0fEruugb70c	2026-03-25 07:25:10.928	2026-03-18 07:25:10.93
cmmx0zsn5000av3pko4wq4ec1	cmmvh8net0000v3p0iy9u32mw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiY21tdmg4bmV0MDAwMHYzcDBpeTl1MzJtdyIsImVtYWlsIjoiYWRtaW5AY29vbGdvLm5ldHdvcmsiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc3Mzg5Nzg3NSwiZXhwIjoxNzc0NTAyNjc1fQ.KJ7JcQmYs-lifkwkHjz0C0Psk0xu1fukF8431tVWSMA	2026-03-26 05:24:35.389	2026-03-19 05:24:35.392
\.


--
-- Data for Name: singbox_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.singbox_categories (id, name, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: singbox_nodes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.singbox_nodes (id, name, token, status, last_seen_at, public_host, port, protocol, tls_enabled, capacity, current_connections, traffic_in_bytes, traffic_out_bytes, metadata, custom_config_json, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: singbox_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.singbox_slots (id, node_id, client_id, singbox_tariff_id, user_identifier, secret, expires_at, traffic_limit_bytes, traffic_used_bytes, current_connections, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: singbox_tariffs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.singbox_tariffs (id, category_id, name, slot_count, duration_days, traffic_limit_bytes, price, currency, sort_order, enabled, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, key, value) FROM stdin;
cmmvh8p4x0007v3p0tyaqvei5	category_emojis	{"ordinary":"📦","premium":"⭐"}
cmmvh8nwx0002v3p0viumt6qp	active_currencies	cny,rub,usd
cmmvhdyu00013v3p00omg6pbh	notification_telegram_group_id	
cmmvhdyvx0014v3p0bi2a2y75	platega_merchant_id	beilehipi@gmail.com
cmmvh8pme0009v3p0cmta1bc4	bot_menu_line_visibility	{"welcomeTitlePrefix":true,"welcomeGreeting":true,"balancePrefix":true,"tariffPrefix":true,"subscriptionPrefix":true,"expirePrefix":true,"daysLeftPrefix":true,"devicesLabel":true,"trafficPrefix":true,"linkLabel":true,"chooseAction":true}
cmmvhdxlq000fv3p0h7khvd5z	default_language	zh
cmmvhdxnl000gv3p0s7m7ebuu	default_currency	cny
cmmvhdyzr0016v3p09mc0ata6	yoomoney_client_id	
cmmvhdz1k0017v3p0lrd92tk7	yoomoney_receiver_wallet	beilehipi@gmail.com
cmmvh8o5o0003v3p05o1768za	default_referral_percent	10
cmmvhdz3f0018v3p015wnr5xx	yookassa_shop_id	beilehipi@gmail.com
cmmvhdz5g0019v3p010b27pyf	cryptopay_api_token	553173:AAlm26zXqPfDvjpYlfwahyFPOxlSjWZqf5W
cmmvhdz7a001av3p07db9s2y8	cryptopay_testnet	true
cmmvhdz94001bv3p0rdbir55i	heleket_merchant_id	
cmmvh8ow40006v3p0u1458hc6	bot_inner_button_styles	{"tariffPay":"success","topup":"primary","back":"danger","profile":"primary","trialConfirm":"success","lang":"primary","currency":"primary"}
cmmvhe4ej003yv3p0hflnmog8	landing_nav_benefits	
cmmvhe4gd003zv3p0t7nesz08	landing_nav_tariffs	
cmmvhe4i70040v3p0ki41mw8k	landing_nav_devices	
cmmvhdxrb000iv3p0ajmylo9i	referral_percent_level_2	3
cmmvhdxt5000jv3p08n2fbrqm	referral_percent_level_3	2
cmmvhe4k00041v3p0u29t71i6	landing_nav_faq	
cmmvhdzax001cv3p0cexiyvdz	groq_model	llama3-8b-8192
cmmvhdzcr001dv3p0fyh4tryg	ai_system_prompt	Ты — лучший менеджер техподдержки VPN-сервиса. Твоя цель — вежливо, быстро и точно помогать пользователям с настройкой VPN, тарифами и решением технических проблем. Отвечай кратко и по делу.
cmmvhe4lu0042v3p032m3eu5s	landing_benefits_badge	
cmmvhdzgi001fv3p03aus5bvz	bot_buttons_per_row	1
cmmvh8oee0004v3p0sip5mn10	trial_days	3
cmmvh8pdn0008v3p0qnlf3a72	bot_emojis	{"TRIAL":{"unicode":"🎁"},"PACKAGE":{"unicode":"📦"},"CARD":{"unicode":"💳"},"LINK":{"unicode":"🔗"},"SERVERS":{"unicode":"🌐"},"PUZZLE":{"unicode":"🧩"},"BACK":{"unicode":"◀️"},"MAIN_MENU":{"unicode":"👋"},"BALANCE":{"unicode":"💰"},"TARIFFS":{"unicode":"📦"},"HEADER":{"unicode":"🛡"}}
cmmvhe4nn0043v3p0glto77dm	landing_default_payment_text	
cmmvhe4pg0044v3p02ct2zti3	landing_button_choose_tariff	
cmmvhe4ra0045v3p0de79eitw	landing_no_tariffs_message	
cmmvhe4t30046v3p0a17nyx3u	landing_button_watch_tariffs	
cmmvhdxws000lv3p074s8yo8g	trial_squad_uuid	30310d26-d1d7-44d1-850c-871e43f8d88e
cmmvhdxyo000mv3p09yh5vn4g	trial_device_limit	1
cmmvhdy0n000nv3p0mqirg5x3	trial_traffic_limit	1073741824
cmmvh8on80005v3p0prhna0hb	service_name	Coolgo Network
cmmvhdzk5001hv3p0ut3whpec	bot_back_label	◀️ В меню
cmmvhe4uy0047v3p0vbutphk6	landing_button_start	
cmmvhe4wr0048v3p0jacb8a3r	landing_button_open_cabinet	
cmmvhdy9u000sv3p0h6cs1ted	remna_client_url	
cmmvh8nin0001v3p087y5phea	active_languages	en,ru,zh
cmmvhdybn000tv3p0f5m6oa5d	smtp_host	mail.spacemail.com
cmmvhdydi000uv3p0rjyvp7ip	smtp_port	465
cmmvhdyfc000vv3p0wu8t7rbo	smtp_secure	true
cmmvhdyh7000wv3p07axf6lzm	smtp_user	support@coolgo.network
cmmvhdyj1000xv3p065of0tf2	smtp_from_email	support@coolgo.network
cmmvhdykv000yv3p0b6icgyme	smtp_from_name	Coolgo Network
cmmvhdymp000zv3p0i2lz38ve	public_app_url	https://coolgo.network
cmmvhdyoi0010v3p0vfexsa0b	telegram_bot_token	8711041182:AAFhmYAaJLkarGo-cZ6PdSVl24ND1h1lW-8
cmmvhdyqd0011v3p0cmjlxeho	telegram_bot_username	coolgonet_bot
cmmvhdys70012v3p0rxw7n36h	bot_admin_telegram_ids	[]
cmmvhe1nc002hv3p0ivzflijq	custom_build_max_devices	10
cmmvhe0ta0023v3p0q61d9h05	sell_options_servers_enabled	false
cmmvhe1r0002jv3p05u8kpqs1	google_client_id	
cmmvhe0v30024v3p0517rv3rt	sell_options_servers_products	
cmmvhe1jo002fv3p0evjlasel	custom_build_currency	cny
cmmvhe1li002gv3p08d3l3u57	custom_build_max_days	360
cmmvhe1p6002iv3p04tz4o6ln	google_login_enabled	false
cmmvhe1su002kv3p0awm5heng	apple_login_enabled	false
cmmvhe1un002lv3p0hjikz06k	apple_client_id	
cmmvhe1wh002mv3p05t12vm1h	apple_team_id	
cmmvhe1yb002nv3p0jqgw055o	apple_key_id	
cmmvhe207002ov3p0so4rjguc	landing_enabled	false
cmmvhe221002pv3p03hzbmpno	landing_hero_title	自由无界，触手可及
cmmvhe23v002qv3p0e3ha41z5	landing_hero_subtitle	“”
cmmvhe25t002rv3p0zztyswjd	landing_hero_cta_text	立即开始
cmmvhe27n002sv3p0g18gcv5o	landing_show_tariffs	true
cmmvhe29h002tv3p0azh7thfa	landing_contacts	
cmmvhe2be002uv3p0i79ig3pv	landing_offer_link	
cmmvhe2d7002vv3p0qs0w3dcj	landing_privacy_link	
cmmvhe2f1002wv3p09of21a7l	landing_footer_text	
cmmvhe2gx002xv3p024n23gkk	landing_hero_badge	新用户优惠码：WELCOME
cmmvhe2ir002yv3p0f8o61zhv	landing_hero_hint	即刻启程，畅游世界
cmmvhe2km002zv3p0da16daps	landing_feature_1_label	数据加密
cmmvhe2mg0030v3p0hdtaaflu	landing_feature_1_sub	所有数据经过安全加密
cmmvhe2oa0031v3p09ggdp5l0	landing_feature_2_label	高速连接
cmmvhe2qe0032v3p0h6gccj0u	landing_feature_2_sub	我们已接入专线，无视晚高峰
cmmvhe2s70033v3p09tzv7282	landing_feature_3_label	40+地区节点
cmmvhe2w00035v3p0qziy8lt6	landing_feature_4_label	附加服务
cmmvhe2xy0036v3p0m7lp4c68	landing_feature_4_sub	Netflix、Gemini、ChatGPT、Couror 无障碍访问
cmmvhe2zt0037v3p0ayr094i2	landing_feature_5_label	7x16小时客服
cmmvhe31o0038v3p0gtoq0n56	landing_feature_5_sub	客服即时响应
cmmvhe35f003av3p0t4eg2o8c	landing_benefits_subtitle	我们让互联更便捷、更安全
cmmvhe379003bv3p09ebdzdox	landing_benefit_1_title	速度
cmmvhe393003cv3p0xgmc47zk	landing_benefit_1_desc	无限制的高速连接
cmmvhe3ay003dv3p0i8tr90q6	landing_benefit_2_title	
cmmvhe3cs003ev3p0ouov5vds	landing_benefit_2_desc	
cmmvhe3el003fv3p0qo770fsi	landing_benefit_3_title	
cmmvhe3gf003gv3p09k0q79k5	landing_benefit_3_desc	
cmmvhe3iq003hv3p0ajkhlf15	landing_benefit_4_title	
cmmvhe3kj003iv3p00mbhpmu5	landing_benefit_4_desc	
cmmvhe3mf003jv3p0u4fm9r7c	landing_benefit_5_title	
cmmvhe3q5003lv3p0bpmw03xd	landing_benefit_6_title	
cmmvhe3s7003mv3p0wqnukctm	landing_benefit_6_desc	
cmmvhe3u1003nv3p0ys3dkckj	landing_tariffs_title	我们的套餐
cmmvhe3vv003ov3p0um0v3dv9	landing_tariffs_subtitle	选择合适的方案
cmmvhe3xp003pv3p0z8utkl0w	landing_devices_title	所有设备
cmmvhe3zi003qv3p0r86c5yyx	landing_devices_subtitle	从任何设备连接
cmmvhe41d003rv3p029lc1sqm	landing_faq_title	常见问题
cmmvhe43a003sv3p01m11paux	landing_faq_json	
cmmvhe453003tv3p03pq9y8m2	landing_hero_headline_1	
cmmvhe46y003uv3p0y34wqiz8	landing_hero_headline_2	
cmmvhe48t003vv3p0995bzqjh	landing_header_badge	
cmmvhe4au003wv3p0ves175ce	landing_button_login	
cmmvhe4co003xv3p0xa17kq2t	landing_button_login_cabinet	
cmmvhdzri001lv3p0wo48i44n	bot_tariffs_text	Тарифы\n\n{{CATEGORY}}\n{{TARIFFS}}\n\nВыберите тариф для оплаты:
cmmvhdztc001mv3p043a5dswq	bot_tariffs_fields	{"name":true,"durationDays":false,"price":true,"currency":true,"trafficLimit":false,"deviceLimit":false}
cmmvhdzvi001nv3p0oaxsy3ks	bot_payment_text	Оплата: {{NAME}} — {{PRICE}}\n\n{{ACTION}}
cmmvhdzxc001ov3p0o9yulrz6	allow_user_theme_change	true
cmmvhdzz6001pv3p0e9f08z9l	theme_accent	cyan
cmmvhe017001qv3p08zlnyk7d	support_link	
cmmvhe030001rv3p0fhl8m87a	agreement_link	
cmmvhe04w001sv3p0obg3nf5a	offer_link	
cmmvhe06p001tv3p09a3vyd0e	instructions_link	
cmmvhe0c8001uv3p0k0n8x103	tickets_enabled	true
cmmvhe12f0028v3p0me172w21	ai_chat_enabled	true
cmmvhe0e1001vv3p0apwjllc8	force_subscribe_enabled	false
cmmvhe0jm001yv3p0bmu5y4um	sell_options_enabled	true
cmmvhe0fw001wv3p0w2m895bn	force_subscribe_channel_id	
cmmvhe0hq001xv3p0i1bky8fk	force_subscribe_message	
cmmvhe0pc0021v3p0mvxqj1ek	sell_options_devices_enabled	false
cmmvhe0lk001zv3p036liai2g	sell_options_traffic_enabled	true
cmmvhe0ni0020v3p0evp4gzfz	sell_options_traffic_products	[{"id":"traffic_1773993477806","name":"50G","trafficGb":50,"price":20,"currency":"cny"}]
cmmvhe0r50022v3p0v1dvpqh0	sell_options_devices_products	
cmmvhe0wx0025v3p0u3p1i9ki	admin_front_notifications_enabled	true
cmmvhe0yr0026v3p0fgfp47iu	skip_email_verification	false
cmmvhe164002av3p03saqm1hh	custom_build_price_per_day	0.2
cmmvhe1cc002bv3p0hx70xfrk	custom_build_price_per_device	1
cmmvhe1e5002cv3p08bb612k4	custom_build_traffic_mode	per_gb
cmmvhe10l0027v3p0et07q83f	use_remna_subscription_page	false
cmmvhe1480029v3p06hsx7wd3	custom_build_enabled	false
cmmvhe1g0002dv3p0mvbhin3m	custom_build_price_per_gb	0.2
cmmvhe1hu002ev3p0z447x72c	custom_build_squad_uuid	fc086ce7-f685-46cc-858f-1a955974d2b0
cmmvhe3o9003kv3p0mnlzt68x	landing_benefit_5_desc	
cmmvhe544004cv3p01fir108j	landing_experience_panels_json	[{"title":"Никаких зависаний","desc":"Смотри видео в 4K, играй в игры и работай без задержек."},{"title":"Мгновенное подключение","desc":"Достаточно нажать одну кнопку, чтобы оказаться в защищенной сети."},{"title":"Удобный кабинет","desc":"Управляй подпиской, устройствами и получай поддержку в пару кликов."}]
cmmvhe673004xv3p0knl0vln1	landing_quick_setup_desc	
cmmvhe68w004yv3p0as1ufn8g	landing_premium_service_title	
cmmvhe6aq004zv3p0y8obevab	landing_premium_service_para1	
cmmvhe6cl0050v3p0cykbq8zx	landing_premium_service_para2	
cmmvhe6eh0051v3p07cnan6fh	landing_how_it_works_title	
cmmvhe6ga0052v3p0zre9jhhi	landing_how_it_works_desc	
cmmvhe55x004dv3p03ewg0ynp	landing_devices_list_json	[{"name":"Windows"},{"name":"macOS"},{"name":"iPhone / iPad"},{"name":"Android"},{"name":"Linux"}]
cmmvhe580004ev3p0tyfd91ol	landing_quick_start_json	["Мгновенный доступ после оплаты","Подробные инструкции и техподдержка","Удобный личный кабинет в Telegram"]
cmmvhe59u004fv3p03sgs8ya8	landing_infra_title	
cmmvhe5bo004gv3p0yopn3lj8	landing_network_cockpit_text	
cmmvhe5di004hv3p0r6djh7zu	landing_pulse_title	
cmmvhe5fb004iv3p0jfrgm4a8	landing_comfort_title	
cmmvhe6i30053v3p0vi90my05	landing_stats_platforms	
cmmvhe6jx0054v3p046j8laq2	landing_stats_tariffs_label	
cmmvhe6lw0055v3p0rb8vhbh7	landing_stats_access_label	
cmmvhe6nq0056v3p0782lyokb	landing_stats_payment_methods	
cmmvhe6pk0057v3p0ft2f37pg	landing_ready_to_connect_eyebrow	
cmmvhe6rd0058v3p0vfcw8tz2	landing_ready_to_connect_title	
cmmvhe6t70059v3p0v8bqidnp	landing_ready_to_connect_desc	
cmmvhe5h4004jv3p0kekkap7l	landing_comfort_badge	
cmmvhe5ix004kv3p0g1ghzezh	landing_principles_title	
cmmvhe5kr004lv3p0v0tgne8f	landing_tech_title	
cmmvhe5ml004mv3p06bbgt4un	landing_tech_desc	
cmmvhe5of004nv3p0wtx1cw6n	landing_category_subtitle	
cmmvhe5q9004ov3p029l5sd1v	landing_tariff_default_desc	
cmmvhe5s3004pv3p0bvl8l13z	landing_tariff_bullet_1	
cmmvhe5u3004qv3p08xyyh3c0	landing_tariff_bullet_2	
cmmvhe4ym0049v3p0agn4miag	landing_journey_steps_json	[{"title":"Выбираешь сценарий","desc":"Доступны гибкие тарифы: выбери то, что подходит именно тебе, без переплат."},{"title":"Оплачиваешь как удобно","desc":"Карта, СБП, крипта — выбирай любой удобный и безопасный метод оплаты."},{"title":"Подключаешься без боли","desc":"После оплаты бот или личный кабинет сразу выдадут все инструкции. Настройка за 1 минуту."}]
cmmvhe52a004bv3p0lrpnsz4j	landing_trust_points_json	["Современные протоколы шифрования","Строгая политика Zero-Log: мы не храним данные","Высокая пропускная способность без ограничений"]
cmmvhe5vx004rv3p01p9j5f95	landing_tariff_bullet_3	
cmmvhe5xr004sv3p0cx61oxrb	landing_lowest_tariff_desc	
cmmvhe5zm004tv3p06j3gv76v	landing_devices_cockpit_text	
cmmvhe61f004uv3p0bhvxben4	landing_universality_title	
cmmvhe639004vv3p06cdcg2cl	landing_universality_desc	
cmmvhe659004wv3p0d9becvyq	landing_quick_setup_title	
d8f23a28-0b96-4bdd-a493-f5a48d202d18	bot_menu_texts_en	{"welcomeTitlePrefix":"🛡 ","welcomeGreeting":"👋 Welcome to ","balancePrefix":"💰 Balance: ","tariffPrefix":"💎 Your plan: ","subscriptionPrefix":"{{CHART}} Subscription status — ","statusInactive":"{{STATUS_INACTIVE}} Expired","statusActive":"{{STATUS_ACTIVE}} Active","statusExpired":"{{STATUS_EXPIRED}} Expired","statusLimited":"{{STATUS_LIMITED}} Limited","statusDisabled":"{{STATUS_DISABLED}} Disabled","expirePrefix":"📅 until ","daysLeftPrefix":"⏰ left ","devicesLabel":"📱 Devices: ","devicesAvailable":" available","trafficPrefix":"📈 Traffic — ","linkLabel":"🔗 Connection link:","chooseAction":"Choose an action:"}
f48b1233-391b-42c9-9308-9d42f6044168	bot_menu_texts_zh	{"welcomeTitlePrefix":"🛡 ","welcomeGreeting":"👋 欢迎使用 ","balancePrefix":"💰 余额：","tariffPrefix":"💎 您的套餐：","subscriptionPrefix":"{{CHART}} 订阅状态 — ","statusInactive":"{{STATUS_INACTIVE}} 已过期","statusActive":"{{STATUS_ACTIVE}} 活跃","statusExpired":"{{STATUS_EXPIRED}} 已过期","statusLimited":"{{STATUS_LIMITED}} 受限","statusDisabled":"{{STATUS_DISABLED}} 已禁用","expirePrefix":"📅 截止 ","daysLeftPrefix":"⏰ 剩余 ","devicesLabel":"📱 设备数：","devicesAvailable":" 可用","trafficPrefix":"📈 流量 — ","linkLabel":"🔗 连接链接：","chooseAction":"请选择操作："}
90acf819-9086-4539-99c3-17280dfd28bb	bot_menu_texts_ru	{"welcomeTitlePrefix":"🛡 ","welcomeGreeting":"👋 Добро пожаловать в ","balancePrefix":"💰 Баланс: ","tariffPrefix":"💎 Ваш тариф: ","subscriptionPrefix":"{{CHART}} Статус подписки — ","statusInactive":"{{STATUS_INACTIVE}} Истекла","statusActive":"{{STATUS_ACTIVE}} Активна","statusExpired":"{{STATUS_EXPIRED}} Истекла","statusLimited":"{{STATUS_LIMITED}} Ограничена","statusDisabled":"{{STATUS_DISABLED}} Отключена","expirePrefix":"📅 до ","daysLeftPrefix":"⏰ осталось ","devicesLabel":"📱 Устройств: ","devicesAvailable":" доступно","trafficPrefix":"📈 Трафик — ","linkLabel":"🔗 Ссылка подключения:","chooseAction":"Выберите действие:"}
cmmvhdzel001ev3p0aa1mhr2f	bot_buttons	[{"id":"tariffs","visible":true,"label":"📦 Тарифы","order":0,"style":"success","emojiKey":"PACKAGE"},{"id":"proxy","visible":true,"label":"🌐 Прокси","order":0.5,"style":"primary","emojiKey":"SERVERS"},{"id":"my_proxy","visible":true,"label":"📋 Мои прокси","order":0.6,"style":"primary","emojiKey":"SERVERS"},{"id":"singbox","visible":true,"label":"🔑 Доступы","order":0.55,"style":"primary","emojiKey":"SERVERS"},{"id":"my_singbox","visible":true,"label":"📋 Мои доступы","order":0.65,"style":"primary","emojiKey":"SERVERS"},{"id":"profile","visible":true,"label":"👤 Профиль","order":1,"style":"","emojiKey":"PUZZLE"},{"id":"devices","visible":true,"label":"📱 Устройства","order":1.5,"style":"primary","emojiKey":"DEVICES"},{"id":"topup","visible":true,"label":"💳 Пополнить баланс","order":2,"style":"success","emojiKey":"CARD"},{"id":"referral","visible":true,"label":"🔗 Реферальная программа","order":3,"style":"primary","emojiKey":"LINK"},{"id":"trial","visible":true,"label":"🎁 Попробовать бесплатно","order":4,"style":"success","emojiKey":"TRIAL"},{"id":"vpn","visible":true,"label":"🌐 Подключиться к VPN","order":5,"style":"danger","emojiKey":"SERVERS","onePerRow":true},{"id":"cabinet","visible":true,"label":"🌐 Web Кабинет","order":6,"style":"primary","emojiKey":"SERVERS"},{"id":"tickets","visible":true,"label":"🎫 Тикеты","order":6.5,"style":"primary","emojiKey":"NOTE"},{"id":"support","visible":true,"label":"🆘 Поддержка","order":7,"style":"primary","emojiKey":"NOTE"},{"id":"promocode","visible":true,"label":"🎟️ Промокод","order":8,"style":"primary","emojiKey":"STAR"},{"id":"extra_options","visible":true,"label":"➕ Доп. опции","order":9,"style":"primary","emojiKey":"PACKAGE"}]
cmmvhdzlz001iv3p0ceo0zvfk	bot_menu_texts	{"welcomeTitlePrefix":"🛡 ","welcomeGreeting":"👋 Добро пожаловать в ","balancePrefix":"💰 Баланс: ","tariffPrefix":"💎 Ваш тариф : ","subscriptionPrefix":"{{CHART}} Статус подписки — ","statusInactive":"{{STATUS_INACTIVE}} Истекла","statusActive":"{{STATUS_ACTIVE}} Активна","statusExpired":"{{STATUS_EXPIRED}} Истекла","statusLimited":"{{STATUS_LIMITED}} Ограничена","statusDisabled":"{{STATUS_DISABLED}} Отключена","expirePrefix":"📅 до ","daysLeftPrefix":"⏰ осталось ","devicesLabel":"📱 Устройств: ","devicesAvailable":" доступно","trafficPrefix":"📈 Трафик — ","linkLabel":"🔗 Ссылка подключения:","chooseAction":"Выберите действие:"}
cmmvhdyxq0015v3p0vw9ncuce	platega_methods	[{"id":2,"enabled":false,"label":"快速银行转账"},{"id":11,"enabled":false,"label":"银行卡"},{"id":12,"enabled":false,"label":"国际支付"},{"id":13,"enabled":false,"label":"加密货币"}]
cmmvhdy65000qv3p0mfp0sfkf	logo_bot	data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImNvcmVHcmFkaWVudCIgY3g9IjM1JSIgY3k9IjM1JSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMzYmM5ZGIiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzBlYTVlOSIgLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJnbG93Ij4KICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMiIgcmVzdWx0PSJjb2xvcmVkQmx1ciIvPgogICAgICA8ZmVNZXJnZT4KICAgICAgICA8ZmVNZXJnZU5vZGUgaW49ImNvbG9yZWRCbHVyIi8+CiAgICAgICAgPGZlTWVyZ2VOb2RlIGluPSJTb3VyY2VHcmFwaGljIi8+CiAgICAgIDwvZmVNZXJnZT4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICAKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMCwgMTApIj4KICAgIDxjaXJjbGUgY3g9IjM1IiBjeT0iNTAiIHI9IjE0IiBmaWxsPSJ1cmwoI2NvcmVHcmFkaWVudCkiIGZpbHRlcj0idXJsKCNnbG93KSIvPgogICAgPGNpcmNsZSBjeD0iMzIiIGN5PSI0NyIgcj0iNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC40Ii8+CiAgICA8cGF0aCBkPSJNIDY1IDIwIEEgMzUgMzUgMCAwIDEgNjUgODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPC9nPgo8L3N2Zz4=
cmmxmfj000198v3pkurjjcq05	smtp_password	Beilehipi#Go.1
cmmym65xj00brv33ca53k2wtf	platega_secret	B1eilehipi1!#
cmmym665d00bvv33cwyw2ptgf	yoomoney_notification_secret	B1eilehipi1!#
cmmym669200bxv33cvnbt2k6d	yookassa_secret_key	B1eilehipi1!#
cmmyk5ye50009v33c5pz97o7d	subscription_page_config	{\n  "locales": [\n    "en",\n    "ru",\n    "zh",\n    "fa",\n    "fr"\n  ],\n  "version": "1",\n  "uiConfig": {\n    "subscriptionInfoBlockType": "expanded",\n    "installationGuidesBlockType": "cards"\n  },\n  "platforms": {\n    "ios": {\n      "apps": [\n        {\n          "name": "Shadowrocket",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://apps.apple.com/ru/app/shadowrocket/id932747118",\n                  "text": {\n                    "en": "Open in App Store",\n                    "fa": "باز کردن در App Store",\n                    "fr": "Ouvre dans l’App Store",\n                    "ru": "Открыть в App Store",\n                    "zh": "在 App Store 打开"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Open the page in App Store and install the app. Launch it, in the VPN configuration permission window click Allow and enter your passcode.",\n                "fa": "صفحه را در App Store باز کنید و برنامه را نصب کنید. آن را اجرا کنید، در پنجره مجوز پیکربندی VPN روی Allow کلیک کنید و رمز عبور خود را وارد کنید.",\n                "fr": "Ouvre la page de l’App Store et installe l’app. Lance-la ; dans la fenêtre d’autorisation de configuration VPN, appuie sur « Allow » puis entre ton code.",\n                "ru": "Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.",\n                "zh": "在 App Store 打开页面并安装应用。启动应用后，在 VPN 配置权限窗口点击“允许”，并输入您的密码。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "shadowrocket://add/{{SUBSCRIPTION_LINK}}#{{USERNAME}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below — the app will open and the subscription will be added automatically",\n                "fa": "برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد",\n                "fr": "Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.",\n                "ru": "Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.",\n                "zh": "点击下方按钮，应用将会打开，并自动添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",\n                "fa": "در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.",\n                "fr": "Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.",\n                "ru": "В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.",\n                "zh": "在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": false\n        },\n        {\n          "name": "Stash",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349",\n                  "text": {\n                    "en": "Open in App Store",\n                    "fa": "باز کردن در App Store",\n                    "fr": "Ouvre dans l’App Store",\n                    "ru": "Открыть в App Store",\n                    "zh": "在 App Store 打开"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Open the App Store page and install the app.",\n                "fa": "صفحه App Store را باز کرده و برنامه را نصب کنید.",\n                "fr": "Ouvre la page de l’App Store et installe l’app.",\n                "ru": "Откройте страницу в App Store и установите приложение.",\n                "zh": "打开 App Store 页面并安装应用。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "stash://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Tap the button below — Stash will open and the configuration will be added automatically.",\n                "fa": "روی دکمه زیر ضربه بزنید — برنامه Stash باز می‌شود و پیکربندی به‌صورت خودکار اضافه خواهد شد.",\n                "fr": "Appuie sur le bouton ci-dessous — Stash s’ouvrira et la configuration sera ajoutée automatiquement.",\n                "ru": "Нажмите кнопку ниже — приложение Stash откроется, и конфигурация будет добавлена автоматически.",\n                "zh": "点击下方按钮，Stash 将会打开并自动添加配置。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "On the main screen, tap the Start button. When prompted, allow adding VPN configurations. After the profile is activated, open the Policy section and select the country you want to connect through.",\n                "fa": "در صفحه اصلی روی دکمه Start بزنید. در صورت نمایش درخواست، مجوز افزودن پیکربندی VPN را تأیید کنید. پس از فعال شدن پروفایل، وارد بخش Policy شوید و کشور موردنظر برای اتصال را انتخاب کنید.",\n                "fr": "Sur l’écran principal, appuie sur le bouton « Start ». Autorise ensuite l’ajout de la configuration VPN. Une fois le profil activé, ouvre la section « Policy » et choisis le pays de connexion.",\n                "ru": "На главном экране нажмите кнопку «Запуск». В появившемся окне разрешите добавление конфигураций VPN. После активации профиля перейдите в раздел «Политика» и выберите страну подключения.",\n                "zh": "在主界面点击「Start」按钮。在提示时允许添加 VPN 配置。配置启用后，进入「Policy（策略）」部分并选择要连接的国家。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": false\n        },\n        {\n          "name": "Happ",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",\n                  "text": {\n                    "en": "App Store (RU)",\n                    "fa": "اپ استور (RU)",\n                    "fr": "App Store (RU)",\n                    "ru": "App Store (RU)",\n                    "zh": "App Store (RU)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://apps.apple.com/us/app/happ-proxy-utility/id6504287215",\n                  "text": {\n                    "en": "App Store (Global)",\n                    "fa": "اپ استور (جهانی)",\n                    "fr": "App Store (Global)",\n                    "ru": "App Store (Global)",\n                    "zh": "App Store (Global)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Open the page in App Store and install the app. Launch it, in the VPN configuration permission window click Allow and enter your passcode.",\n                "fa": "صفحه را در App Store باز کنید و برنامه را نصب کنید. آن را اجرا کنید، در پنجره مجوز پیکربندی VPN روی Allow کلیک کنید و رمز عبور خود را وارد کنید.",\n                "fr": "Ouvre la page de l’App Store et installe l’app. Lance-la ; dans la fenêtre d’autorisation de configuration VPN, appuie sur « Allow » puis entre ton code.",\n                "ru": "Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.",\n                "zh": "在 App Store 打开页面并安装应用。启动应用后，在 VPN 配置权限窗口点击“允许”，并输入您的密码。"\n              },\n              "svgIconColor": "violet"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "happ://add/{{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below — the app will open and the subscription will be added automatically",\n                "fa": "برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد",\n                "fr": "Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.",\n                "ru": "Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.",\n                "zh": "点击下方按钮，应用将会打开，并自动添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",\n                "fa": "در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.",\n                "fr": "Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.",\n                "ru": "В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.",\n                "zh": "在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Streisand",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://apps.apple.com/ru/app/streisand/id6450534064",\n                  "text": {\n                    "en": "Open in App Store",\n                    "fa": "باز کردن در App Store",\n                    "fr": "Ouvre dans l’App Store",\n                    "ru": "Открыть в App Store",\n                    "zh": "在 App Store 打开"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Open the page in App Store and install the app. Launch it, in the VPN configuration permission window click Allow and enter your passcode.",\n                "fa": "صفحه را در App Store باز کنید و برنامه را نصب کنید. آن را اجرا کنید، در پنجره مجوز پیکربندی VPN روی Allow کلیک کنید و رمز عبور خود را وارد کنید.",\n                "fr": "Ouvre la page de l’App Store et installe l’app. Lance-la ; dans la fenêtre d’autorisation de configuration VPN, appuie sur « Allow » puis entre ton code.",\n                "ru": "Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.",\n                "zh": "在 App Store 打开页面并安装应用。启动应用后，在 VPN 配置权限窗口点击“允许”，并输入您的密码。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "streisand://import/{{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below — the app will open and the subscription will be added automatically",\n                "fa": "برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد",\n                "fr": "Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.",\n                "ru": "Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.",\n                "zh": "点击下方按钮，应用将会打开，并自动添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",\n                "fa": "در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.",\n                "fr": "Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.",\n                "ru": "В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.",\n                "zh": "在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": false\n        }\n      ],\n      "svgIconKey": "AppleIcon",\n      "displayName": {\n        "en": "iOS",\n        "fa": "iOS",\n        "fr": "iOS",\n        "ru": "iOS",\n        "zh": "iOS"\n      }\n    },\n    "android": {\n      "apps": [\n        {\n          "name": "Clash Meta",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/MetaCubeX/ClashMetaForAndroid/releases/download/v2.11.20/cmfa-2.11.20-meta-universal-release.apk",\n                  "text": {\n                    "en": "Download APK",\n                    "fa": "دانلود APK",\n                    "fr": "Télécharge l’APK",\n                    "ru": "Скачать APK",\n                    "zh": "下载 APK"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://f-droid.org/packages/com.github.metacubex.clash.meta/",\n                  "text": {\n                    "en": "Open in F-Droid",\n                    "fa": "در F-Droid باز کنید",\n                    "fr": "Ouvre dans F‑Droid",\n                    "ru": "Открыть в F-Droid",\n                    "zh": "在 F-Droid 打开"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Download and install Clash Meta APK",\n                "fa": "دانلود و نصب Clash Meta APK",\n                "fr": "Télécharge et installe l’APK Clash Meta.",\n                "ru": "Скачайте и установите Clash Meta APK",\n                "zh": "下载并安装 Clash Meta APK"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "clashmeta://install-config?name={{USERNAME}}&url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to open the profile creation window. You will need to specify the auto-update period, for example, 720 minutes. Click the Save button in the top right corner.",\n                "fa": "دکمه زیر را بزنید تا پنجره ایجاد پروفایل باز شود. شما باید دوره به‌روزرسانی خودکار را مشخص کنید، مثلاً ۷۲۰ دقیقه. دکمه ذخیره را در بالا سمت راست بزنید.",\n                "fr": "Clique sur le bouton ci‑dessous pour ouvrir la fenêtre de création de profil. Indique la période d’actualisation automatique, par exemple 720 minutes. Appuie sur « « Save » » en haut à droite.",\n                "ru": "Нажми кнопку ниже — откроется окно создания профиля. Тебе потребуется указать период автообновления, например, 720 минут. Справа вверху нажми на кнопку Сохранить.",\n                "zh": "点击下方按钮打开配置文件创建窗口。你需要指定自动更新周期，例如 720 分钟。点击右上角的保存按钮。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Go to the Profiles section and select the created profile, then return to the main page. Now you can connect by clicking the Stopped button.",\n                "fa": "به بخش پروفایل‌ها بروید و پروفایل ایجاد شده را انتخاب کنید، سپس به صفحه اصلی بازگردید. اکنون می‌توانید با زدن دکمه «متوقف شده» متصل شوید.",\n                "fr": "Va dans « Profiles » et sélectionne le profil créé, puis reviens à la page principale. Tu peux maintenant te connecter en appuyant sur « Stopped ».",\n                "ru": "Перейди в пункт Профили и выбери созданный профиль, затем вернись на главную страницу. Теперь ты можешь подключиться, нажав на кнопку Остановлен",\n                "zh": "进入“配置文件”部分并选择已创建的配置文件，然后返回主页面。现在你可以点击“已停止”按钮连接。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": false\n        },\n        {\n          "name": "FlClashX",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-android-arm64-v8a.apk",\n                  "text": {\n                    "en": "Download APK",\n                    "fa": "دانلود APK",\n                    "fr": "Télécharge l’APK",\n                    "ru": "Скачать APK",\n                    "zh": "下载 APK"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Download and install FlClashX APK",\n                "fa": "دانلود و نصب FlClashX APK",\n                "fr": "Télécharge et installe l’APK FlClashX.",\n                "ru": "Скачайте и установите FlClashX APK",\n                "zh": "下载并安装 FlClashX APK"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "flclashx://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک در برنامه نصب نشده است",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClashX, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send",\n                "fa": "اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClashX به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClashX, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить",\n                "zh": "如果点击按钮后没有反应，请手动添加订阅。在本页右上角点击获取链接按钮，复制链接。在 FlClashX 的 Profiles 部分点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the added profile in the Profiles section. In the Control Panel, click the Enable button in the bottom right corner. Once it's running, you can change the server you're connected to in the Proxy section.",\n                "fa": "پروفایل افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. در پنل کنترل، روی دکمه فعال‌سازی در گوشه پایین سمت راست کلیک کنید. پس از اجرا، می‌توانید در بخش پروکسی، سروری را که به آن متصل می‌شوید تغییر دهید.",\n                "fr": "Select the added profile in the « Profiles » section. In the Control Panel, click the « Enable » button in the bottom right corner. Once it's running, you can change the server you're connected to in the « Proxy » section.",\n                "ru": "Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.",\n                "zh": "在 Profiles 部分选择已添加的配置文件。在控制面板右下角点击启用按钮。启动后，你可以在 Proxy 部分更换连接的服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Happ",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://play.google.com/store/apps/details?id=com.happproxy",\n                  "text": {\n                    "en": "Open in Google Play",\n                    "fa": "باز کردن در Google Play",\n                    "fr": "Ouvre dans Google Play",\n                    "ru": "Открыть в Google Play",\n                    "zh": "在 Google Play 打开"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/Happ-proxy/happ-android/releases/latest/download/Happ.apk",\n                  "text": {\n                    "en": "Download APK",\n                    "fa": "دانلود APK",\n                    "fr": "Télécharge l’APK",\n                    "ru": "Скачать APK",\n                    "zh": "下载 APK"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Open the page in Google Play and install the app. Or install the app directly from the APK file if Google Play is not working.",\n                "fa": "صفحه را در Google Play باز کنید و برنامه را نصب کنید. یا برنامه را مستقیماً از فایل APK نصب کنید، اگر Google Play کار نمی کند.",\n                "fr": "Ouvre la page dans Google Play et installe l’app. Si Google Play ne fonctionne pas, installe‑la directement via l’APK.",\n                "ru": "Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.",\n                "zh": "在 Google Play 打开页面并安装应用。如果 Google Play 无法使用，也可以直接通过 APK 文件安装此应用。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "happ://add/{{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Open the app and connect to the server",\n                "fa": "برنامه را باز کنید و به سرور متصل شوید",\n                "fr": "Ouvre l’app et connecte‑toi au serveur.",\n                "ru": "Откройте приложение и подключитесь к серверу",\n                "zh": "打开应用并连接到服务器"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "v2rayNG",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/2dust/v2rayNG/releases/download/1.10.31/v2rayNG_1.10.31_universal.apk",\n                  "text": {\n                    "en": "Download APK",\n                    "fa": "دانلود APK",\n                    "fr": "Télécharge l’APK",\n                    "ru": "Скачать APK",\n                    "zh": "下载 APK"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Download and install v2rayNG APK",\n                "fa": "دانلود و نصب v2rayNG APK",\n                "fr": "Télécharge et installe l’APK v2rayNG.",\n                "ru": "Скачайте и установите v2rayNG APK",\n                "zh": "下载并安装 v2rayNG APK"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "v2rayng://install-config?name={{USERNAME}}&url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below — the app will open and the subscription will be added automatically",\n                "fa": "برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد",\n                "fr": "Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.",\n                "ru": "Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.",\n                "zh": "点击下方按钮，应用将会打开，并自动添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Update subscriptions",\n                "fa": "به‌روزرسانی اشتراک‌ها",\n                "fr": "Mettre à jour les abonnements",\n                "ru": "Обновление подписки",\n                "zh": "更新订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "Tap the three dots in the top-right corner and select Update subscription. After that, the available servers will appear in the list.",\n                "fa": "روی سه نقطه در گوشه بالا سمت راست کلیک کنید و گزینه به‌روزرسانی اشتراک را انتخاب کنید. سپس سرورهای موجود در لیست ظاهر می‌شوند.",\n                "fr": "Appuie sur les trois points en haut à droite et sélectionne « Update subscription ». Les serveurs disponibles apparaîtront alors dans la liste.",\n                "ru": "Нажмите на три точечки справа сверху и выберите Обновить подписку. После этого в списке появятся доступные серверы",\n                "zh": "点击右上角的三个点，选择“更新订阅”。之后，列表中会显示可用服务器。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the required server and click the Enable button in the bottom right corner.",\n                "fa": "سرور موردنظر را انتخاب کنید و روی دکمه فعال‌سازی در گوشه پایین سمت راست کلیک کنید.",\n                "fr": "Sélectionne le serveur souhaité puis appuie sur « Enable » en bas à droite.",\n                "ru": "Выберите требуемый сервер и нажмите кнопку Включить в правом нижнем углу",\n                "zh": "选择所需服务器并点击右下角的启用按钮。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": false\n        },\n        {\n          "name": "Exclave",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/dyhkwong/Exclave/releases/download/0.17.4/Exclave-0.17.4-arm64-v8a.apk",\n                  "text": {\n                    "en": "Download APK",\n                    "fa": "دانلود APK",\n                    "fr": "Télécharge l’APK",\n                    "ru": "Скачать APK",\n                    "zh": "下载 APK"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://f-droid.org/packages/com.github.dyhkwong.sagernet",\n                  "text": {\n                    "en": "Open in F-Droid",\n                    "fa": "در F-Droid باز کنید",\n                    "fr": "Ouvre dans F‑Droid",\n                    "ru": "Открыть в F-Droid",\n                    "zh": "在 F-Droid 打开"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Download and install Exclave APK",\n                "fa": "دانلود و نصب Exclave APK",\n                "fr": "Télécharge et installe l’APK Exclave.",\n                "ru": "Скачайте и установите Exclave APK",\n                "zh": "下载并安装 Exclave APK"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "exclave://subscription?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Enable subscription auto-renewal",\n                "fa": "تمدید خودکار اشتراک را فعال کنید",\n                "fr": "Activer le renouvellement automatique de l’abonnement",\n                "ru": "Включите автообновление подписки",\n                "zh": "启用订阅自动续期"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "In the Groups section, go to the editing mode of the added subscription and enable the toggle next to Auto-Renewal. You can also rename the subscription if needed.",\n                "fa": "در بخش گروه‌ها، وارد حالت ویرایش اشتراک اضافه‌شده شوید و گزینه تمدید خودکار را فعال کنید. همچنین در صورت نیاز می‌توانید نام اشتراک را تغییر دهید.",\n                "fr": "Dans la section « Groups », passe en mode édition de l’abonnement ajouté et active l’option « Auto‑Renewal ». Tu peux aussi renommer l’abonnement si nécessaire.",\n                "ru": "В разделе Группы перейдите в режим редактирования добавленной подписки, включите переключатель у пункта Автоматическое обновление. Так же вы можете переименовать подписку, если требуется.",\n                "zh": "在 Groups 部分进入已添加订阅的编辑模式，启用“自动续期”开关。如果需要，你还可以重命名订阅。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the desired server in the Configuration section and click the Enable button in the bottom right corner.",\n                "fa": "در بخش پیکربندی، سرور مورد نظر را انتخاب کرده و روی دکمه فعال‌سازی در گوشه پایین سمت راست کلیک کنید.",\n                "fr": "Dans la section « Configuration », choisis le serveur souhaité puis appuie sur « Enable » en bas à droite.",\n                "ru": "Выберите требуемый сервер в разделе Конфигурация и нажмите кнопку Включить в правом нижнем углу",\n                "zh": "在配置部分选择所需服务器并点击右下角的启用按钮。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": false\n        }\n      ],\n      "svgIconKey": "Android",\n      "displayName": {\n        "en": "Android",\n        "fa": "Android",\n        "fr": "Android",\n        "ru": "Android",\n        "zh": "Android"\n      }\n    },\n    "macos": {\n      "apps": [\n        {\n          "name": "FlClashX",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-macos-arm64.dmg",\n                  "text": {\n                    "en": "macOS (Apple Silicon)",\n                    "fa": "مک (Apple Silicon)",\n                    "fr": "macOS (Apple Silicon)",\n                    "ru": "macOS (Apple Silicon)",\n                    "zh": "macOS（Apple Silicon）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-macos-amd64.dmg",\n                  "text": {\n                    "en": "macOS (Intel)",\n                    "fa": "مک (اینتل)",\n                    "fr": "macOS (Intel)",\n                    "ru": "macOS (Intel)",\n                    "zh": "macOS（Intel）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the version for your device, click the button below and install the app.",\n                "fa": "نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید",\n                "fr": "Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.",\n                "ru": "Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.",\n                "zh": "选择适合您设备的版本，点击下方按钮并安装应用程序。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "flclashx://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک در برنامه نصب نشده است",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClashX, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send",\n                "fa": "اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClashX به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClashX, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить",\n                "zh": "如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 FlClashX 的“配置文件”部分，点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the added profile in the Profiles section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the TUN item. After launching, in the Proxy section, you can change the choice of the server to which you will be connected.",\n                "fa": "نمایه اضافه شده را در قسمت پروفایل ها انتخاب کنید. در داشبورد، روی دکمه فعال کردن در گوشه پایین سمت راست کلیک کنید و سپس سوئیچ کنار مورد TUN را روشن کنید. پس از راه اندازی در قسمت Proxy می توانید انتخاب سروری که به آن متصل خواهید شد را تغییر دهید.",\n                "fr": "Select the added profile in the « Profiles » section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the « TUN » item. After launching, in the « Proxy » section, you can change the choice of the server to which you will be connected.",\n                "ru": "Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.",\n                "zh": "在“配置文件”部分选择已添加的配置文件。在控制面板右下角点击启用按钮，然后打开 TUN 项旁边的开关。启动后，在代理部分可以更改所连接的服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Happ",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973",\n                  "text": {\n                    "en": "App Store (RU)",\n                    "fa": "اپ استور (RU)",\n                    "fr": "App Store (RU)",\n                    "ru": "App Store (RU)",\n                    "zh": "App Store (RU)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://apps.apple.com/us/app/happ-proxy-utility/id6504287215",\n                  "text": {\n                    "en": "App Store (Global)",\n                    "fa": "اپ استور (جهانی)",\n                    "fr": "App Store (Global)",\n                    "ru": "App Store (Global)",\n                    "zh": "App Store (Global)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the version for your device, click the button below and install the app.",\n                "fa": "نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید",\n                "fr": "Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.",\n                "ru": "Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.",\n                "zh": "选择适合您设备的版本，点击下方按钮并安装应用程序。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "happ://add/{{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below — the app will open and the subscription will be added automatically",\n                "fa": "برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد",\n                "fr": "Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.",\n                "ru": "Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.",\n                "zh": "点击下方按钮——应用将会打开，订阅会自动添加。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",\n                "fa": "در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.",\n                "fr": "Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.",\n                "ru": "В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.",\n                "zh": "在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Koala Clash",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_aarch64.dmg",\n                  "text": {\n                    "en": "macOS (Apple Silicon)",\n                    "fa": "مک (Apple Silicon)",\n                    "fr": "macOS (Apple Silicon)",\n                    "ru": "macOS (Apple Silicon)",\n                    "zh": "macOS（Apple Silicon）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_x64.dmg",\n                  "text": {\n                    "en": "macOS (Intel)",\n                    "fa": "مک (اینتل)",\n                    "fr": "macOS (Intel)",\n                    "ru": "macOS (Intel)",\n                    "zh": "macOS（Intel）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the version for your device, click the button below and install the app.",\n                "fa": "نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید",\n                "fr": "Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.",\n                "ru": "Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.",\n                "zh": "选择适合您设备的版本，点击下方按钮并安装应用程序。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Warning",\n                "fa": "هشدار",\n                "fr": "Avertissement",\n                "ru": "Предупреждение",\n                "zh": "警告"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash. ⚠️ Warning: If you get a notification that the application is corrupted when you run it on macOS, run this command in Terminal: sudo xattr -r -c /Applications/Koala\\\\ Clash.app",\n                "fa": "اگر قبلاً از Clash Verge Rev استفاده کرده‌اید، باید قبل از نصب Koala Clash آن را حذف کنید. ⚠️ هشدار: اگر هنگام اجرای برنامه در macOS پیامی مبنی بر خراب بودن برنامه دریافت کردید، این دستور را در ترمینال اجرا کنید: sudo xattr -r -c /Applications/Koala\\\\ Clash.app",\n                "fr": "If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash. ⚠️ Warning : If you get a notification that the application is corrupted when you run it on macOS, run this command in Terminal : sudo xattr -r -c /Applications/Koala\\\\ Clash.app.",\n                "ru": "Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash. ⚠️ Предупреждение: Если при запуске приложения на macOS появляется уведомление, что приложение повреждено, выполните эту команду в терминале: sudo xattr -r -c /Applications/Koala\\\\ Clash.app",\n                "zh": "如果您之前用过 Clash Verge Rev，请在安装 Koala Clash 前先卸载它。⚠️ 警告：如果在 macOS 上运行应用时收到应用已损坏的提示，请在终端运行以下命令：sudo xattr -r -c /Applications/Koala\\\\ Clash.app"\n              },\n              "svgIconColor": "red"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "koala-clash://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک اضافه نشد",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the Add Profile button, paste the link into the text field, and then click the Import button.",\n                "fa": "اگر پس از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در گوشه بالا سمت راست این صفحه کلیک کنید و لینک را کپی کنید. در برنامه Koala Clash به صفحه اصلی بروید، روی دکمه افزودن پروفایل کلیک کنید، لینک را در فیلد متنی قرار دهید و سپس روی دکمه وارد کردن کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the « Add Profile » button, paste the link into the text field, and then click the « Import » button.",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.",\n                "zh": "如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 Koala Clash 主页面点击“添加配置文件”按钮，将链接粘贴到文本框中，然后点击“导入”按钮。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.",\n                "fa": "می‌توانید سرور را در پایین صفحه اصلی انتخاب کنید و با کلیک روی دکمه بزرگ در مرکز صفحه اصلی، VPN را فعال کنید.",\n                "fr": "You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.",\n                "ru": "Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.",\n                "zh": "您可以在主页面底部选择服务器，并通过点击主页面中央的大按钮来启用 VPN。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Prizrak-Box",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/macos-arm64-dmg.zip",\n                  "text": {\n                    "en": "macOS (Apple Silicon)",\n                    "fa": "macOS (Apple Silicon)",\n                    "fr": "macOS (Apple Silicon)",\n                    "ru": "macOS (Apple Silicon)",\n                    "zh": "macOS（Apple Silicon）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/macos-amd64-dmg.zip",\n                  "text": {\n                    "en": "macOS (Intel)",\n                    "fa": "macOS (Intel)",\n                    "fr": "macOS (Intel)",\n                    "ru": "macOS (Intel)",\n                    "zh": "macOS（Intel）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Download the archive for your chip (Apple Silicon or Intel), unzip and move Prizrak-Box.app to Applications.",\n                "fa": "فایل مناسب (Apple Silicon یا Intel) را دانلود کرده، از حالت فشرده خارج و برنامه را به Applications منتقل کنید.",\n                "fr": "Download the archive for your chip (Apple Silicon or Intel), unzip and move Prizrak-Box.app to Applications.",\n                "ru": "Скачайте архив под ваш чип (Apple Silicon или Intel), распакуйте и переместите Prizrak-Box.app в Applications.",\n                "zh": "下载适合您芯片（Apple Silicon 或 Intel）的压缩包，解压后将 Prizrak-Box.app 移入 Applications。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Read before first launch",\n                "fa": "قبل از اولین اجرا بخوانید",\n                "fr": "Read before first launch",\n                "ru": "Прочти перед первым запуском",\n                "zh": "首次启动前阅读"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/blob/v3/doc/mac/mac.md",\n                  "text": {\n                    "en": "Mac Guide",\n                    "fa": "راهنمای مک",\n                    "fr": "Mac Guide",\n                    "ru": "Инструкция для Mac",\n                    "zh": "Mac 使用指南"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If macOS shows security warnings, follow this guide.",\n                "fa": "اگر macOS هشدار امنیتی نشان داد، این راهنما را دنبال کنید.",\n                "fr": "If macOS shows security warnings, follow this guide.",\n                "ru": "Если macOS показывает предупреждения безопасности — следуйте инструкции.",\n                "zh": "若 macOS 显示安全警告，请按指南操作。"\n              },\n              "svgIconColor": "red"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "prizrak-box://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add the subscription automatically.",\n                "fa": "روی دکمه زیر کلیک کنید تا اشتراک به صورت خودکار افزوده شود.",\n                "fr": "Click the button below to add the subscription automatically.",\n                "ru": "Нажмите кнопку ниже, чтобы автоматически добавить подписку.",\n                "zh": "点击下方按钮即可自动添加订阅。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک در برنامه نصب نشده است",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add the subscription manually. On this page, click the Get Link button in the upper right corner, copy the link. In Prizrak-Box, go to the Profiles section, click the + button, paste your copied link, and click Confirm.",\n                "fa": "اگر پس از کلیک بر روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در این صفحه، روی دکمه «دریافت پیوند» در گوشه بالا سمت راست کلیک کنید، پیوند را کپی کنید. در Prizrak-Box، به بخش «پروفایل‌ها» بروید، روی دکمه + کلیک کنید، پیوند کپی شده خود را جای‌گذاری کنید و روی «تأیید» کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add the subscription manually. On this page, click the « Get Link » button in the upper right corner, copy the link. In Prizrak-Box, go to the « Profiles » section, click the + button, paste your copied link, and click « Confirm ».",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку «Получить ссылку» в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел «Профили», нажмите кнопку «+», вставьте скопированную ссылку и нажмите «Подтвердить».",\n                "zh": "如果点击按钮后没有任何反应，请手动添加订阅。在此页面上，点击右上角的“获取链接”按钮，复制链接。在 Prizrak-Box 中，转到“配置文件”部分，点击 + 按钮，粘贴您复制的链接，然后点击“确认”。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the added subscription in the Profiles section. You can choose the server country in the Proxy (🚀) section. Set the TUN switch to ON.",\n                "fa": "اشتراک افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. می‌توانید کشور سرور را در بخش Proxy (🚀) انتخاب کنید. سوئیچ TUN را روی حالت روشن قرار دهید.",\n                "fr": "Select the added subscription in the « Profiles » section. You can choose the server country in the « Proxy » (🚀) section. Set the « TUN » switch to ON.",\n                "ru": "Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.",\n                "zh": "在“配置文件”部分选择已添加的订阅。可在“代理 (🚀)”部分选择服务器国家。将 TUN 开关切换到开启。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": false\n        }\n      ],\n      "svgIconKey": "macOS",\n      "displayName": {\n        "en": "macOS",\n        "fa": "macOS",\n        "fr": "macOS",\n        "ru": "macOS",\n        "zh": "macOS"\n      }\n    },\n    "windows": {\n      "apps": [\n        {\n          "name": "FlClashX",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-windows-amd64-setup.exe",\n                  "text": {\n                    "en": "Windows (Setup)",\n                    "fa": "ویندوز (نصب)",\n                    "fr": "Windows (Setup)",\n                    "ru": "Windows (Установщик)",\n                    "zh": "Windows（安装程序）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-windows-arm64-setup.exe",\n                  "text": {\n                    "en": "Windows on ARM (Setup)",\n                    "fa": "ویندوز ARM (نصب)",\n                    "fr": "Windows on ARM (Setup)",\n                    "ru": "Windows на ARM (Установщик)",\n                    "zh": "Windows on ARM（安装程序）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the version for your device, click the button below and install the app.",\n                "fa": "نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید",\n                "fr": "Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.",\n                "ru": "Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.",\n                "zh": "选择适合您设备的版本，点击下方按钮并安装应用程序。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "flclashx://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک در برنامه نصب نشده است",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClashX, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send",\n                "fa": "اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClashX به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClashX, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить",\n                "zh": "如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 FlClashX 的“配置文件”部分，点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the added profile in the Profiles section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the TUN item. After launching, in the Proxy section, you can change the choice of the server to which you will be connected.",\n                "fa": "نمایه اضافه شده را در قسمت پروفایل ها انتخاب کنید. در داشبورد، روی دکمه فعال کردن در گوشه پایین سمت راست کلیک کنید و سپس سوئیچ کنار مورد TUN را روشن کنید. پس از راه اندازی در قسمت Proxy می توانید انتخاب سروری که به آن متصل خواهید شد را تغییر دهید.",\n                "fr": "Select the added profile in the « Profiles » section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the « TUN » item. After launching, in the « Proxy » section, you can change the choice of the server to which you will be connected.",\n                "ru": "Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.",\n                "zh": "在“配置文件”部分选择已添加的配置文件。在控制面板右下角点击启用按钮，然后打开 TUN 项旁边的开关。启动后，在代理部分可以更改所连接的服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Happ",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe",\n                  "text": {\n                    "en": "Windows",\n                    "fa": "ویندوز",\n                    "fr": "Windows",\n                    "ru": "Windows",\n                    "zh": "Windows"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the version for your device, click the button below and install the app.",\n                "fa": "نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید",\n                "fr": "Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.",\n                "ru": "Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.",\n                "zh": "选择适合您设备的版本，点击下方按钮并安装应用程序。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "happ://add/{{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below — the app will open and the subscription will be added automatically",\n                "fa": "برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد",\n                "fr": "Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.",\n                "ru": "Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.",\n                "zh": "点击下方按钮——应用将会打开，订阅会自动添加。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",\n                "fa": "در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.",\n                "fr": "Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.",\n                "ru": "В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.",\n                "zh": "在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": false\n        },\n        {\n          "name": "Koala Clash",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_x64-setup.exe",\n                  "text": {\n                    "en": "Windows (Setup)",\n                    "fa": "ویندوز (نصب)",\n                    "fr": "Windows (Setup)",\n                    "ru": "Windows (Установщик)",\n                    "zh": "Windows（安装程序）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the version for your device, click the button below and install the app.",\n                "fa": "نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید",\n                "fr": "Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.",\n                "ru": "Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.",\n                "zh": "选择适合您设备的版本，点击下方按钮并安装应用程序。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Warning",\n                "fa": "هشدار",\n                "fr": "Avertissement",\n                "ru": "Предупреждение",\n                "zh": "警告"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash.",\n                "fa": "اگر قبلاً از Clash Verge Rev استفاده کرده‌اید، باید قبل از نصب Koala Clash آن را حذف کنید.",\n                "fr": "If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash.",\n                "ru": "Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash.",\n                "zh": "如果您之前用过 Clash Verge Rev，请在安装 Koala Clash 前先卸载它。"\n              },\n              "svgIconColor": "red"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "koala-clash://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک اضافه نشد",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the Add Profile button, paste the link into the text field, and then click the Import button.",\n                "fa": "اگر پس از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در گوشه بالا سمت راست این صفحه کلیک کنید و لینک را کپی کنید. در برنامه Koala Clash به صفحه اصلی بروید، روی دکمه افزودن پروفایل کلیک کنید، لینک را در فیلد متنی قرار دهید و سپس روی دکمه وارد کردن کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the « Add Profile » button, paste the link into the text field, and then click the « Import » button.",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.",\n                "zh": "如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 Koala Clash 主页面点击“添加配置文件”按钮，将链接粘贴到文本框中，然后点击“导入”按钮。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.",\n                "fa": "می‌توانید سرور را در پایین صفحه اصلی انتخاب کنید و با کلیک روی دکمه بزرگ در مرکز صفحه اصلی، VPN را فعال کنید.",\n                "fr": "You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.",\n                "ru": "Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.",\n                "zh": "您可以在主页面底部选择服务器，并通过点击主页面中央的大按钮来启用 VPN。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Prizrak-Box",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/windows-amd64.msi",\n                  "text": {\n                    "en": "Windows (Setup)",\n                    "fa": "ویندوز (نصب)",\n                    "fr": "Windows (Setup)",\n                    "ru": "Windows (Установщик)",\n                    "zh": "Windows（安装程序）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/windows-arm64.msi",\n                  "text": {\n                    "en": "Windows on ARM (Setup)",\n                    "fa": "ویندوز ARM (نصب)",\n                    "fr": "Windows on ARM (Setup)",\n                    "ru": "Windows на ARM (Установщик)",\n                    "zh": "Windows on ARM（安装程序）"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose your architecture (installer preferred for automatic integration) and install or unzip Prizrak-Box.",\n                "fa": "معماری مناسب را انتخاب کنید (نصب‌کننده ترجیح دارد) و Prizrak-Box را نصب یا از حالت فشرده خارج کنید.",\n                "fr": "Choose your architecture (installer preferred for automatic integration) and install or unzip Prizrak-Box.",\n                "ru": "Выберите архитектуру (предпочтительно установщик) и установите или распакуйте Prizrak-Box.",\n                "zh": "选择适合的架构（建议使用安装程序）并安装或解压 Prizrak-Box。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Warning",\n                "fa": "هشدار",\n                "fr": "Avertissement",\n                "ru": "Предупреждение",\n                "zh": "警告"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "Run the program as an administrator.",\n                "fa": "برنامه را به عنوان مدیر اجرا کنید.",\n                "fr": "Run the program as an administrator.",\n                "ru": "Запустите программу от имени администратора.",\n                "zh": "以管理员身份运行程序。"\n              },\n              "svgIconColor": "red"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "prizrak-box://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add the subscription automatically.",\n                "fa": "روی دکمه زیر کلیک کنید تا اشتراک به صورت خودکار افزوده شود.",\n                "fr": "Click the button below to add the subscription automatically.",\n                "ru": "Нажмите кнопку ниже, чтобы автоматически добавить подписку.",\n                "zh": "点击下方按钮即可自动添加订阅。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک در برنامه نصب نشده است",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add the subscription manually. On this page, click the Get Link button in the upper right corner, copy the link. In Prizrak-Box, go to the Profiles section, click the + button, paste your copied link, and click Confirm.",\n                "fa": "اگر پس از کلیک بر روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در این صفحه، روی دکمه «دریافت پیوند» در گوشه بالا سمت راست کلیک کنید، پیوند را کپی کنید. در Prizrak-Box، به بخش «پروفایل‌ها» بروید، روی دکمه + کلیک کنید، پیوند کپی شده خود را جای‌گذاری کنید و روی «تأیید» کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add the subscription manually. On this page, click the « Get Link » button in the upper right corner, copy the link. In Prizrak-Box, go to the « Profiles » section, click the + button, paste your copied link, and click « Confirm ».",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел Профили, нажмите кнопку +, вставьте вашу скопированную ссылку и нажмите Потдвердить.",\n                "zh": "如果点击按钮后没有任何反应，请手动添加订阅。在此页面上，点击右上角的“获取链接”按钮，复制链接。在 Prizrak-Box 中，转到“配置文件”部分，点击 + 按钮，粘贴您复制的链接，然后点击“确认”。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the added subscription in the Profiles section. You can choose the server country in the Proxy (🚀) section. Set the TUN switch to ON.",\n                "fa": "اشتراک افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. می‌توانید کشور سرور را در بخش Proxy (🚀) انتخاب کنید. سوئیچ TUN را روی حالت روشن قرار دهید.",\n                "fr": "Select the added subscription in the « Profiles » section. You can choose the server country in the « Proxy » (🚀) section. Set the « TUN » switch to ON.",\n                "ru": "Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.",\n                "zh": "在“配置文件”部分选择已添加的订阅。可在“代理 (🚀)”部分选择服务器国家。将 TUN 开关切换到开启。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        }\n      ],\n      "svgIconKey": "Windows",\n      "displayName": {\n        "en": "Windows",\n        "fa": "Windows",\n        "fr": "Windows",\n        "ru": "Windows",\n        "zh": "Windows"\n      }\n    },\n    "linux": {\n      "apps": [\n        {\n          "name": "FlClashX",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-linux-amd64.deb",\n                  "text": {\n                    "en": "amd64 (.deb)",\n                    "fa": "amd64 (.deb)",\n                    "fr": "amd64 (.deb)",\n                    "ru": "amd64 (.deb)",\n                    "zh": "amd64 (.deb)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-linux-amd64.AppImage",\n                  "text": {\n                    "en": "amd64 (AppImage)",\n                    "fa": "amd64 (AppImage)",\n                    "fr": "amd64 (AppImage)",\n                    "ru": "amd64 (AppImage)",\n                    "zh": "amd64 (AppImage)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-linux-amd64.rpm",\n                  "text": {\n                    "en": "amd64 (.rpm)",\n                    "fa": "amd64 (.rpm)",\n                    "fr": "amd64 (.rpm)",\n                    "ru": "amd64 (.rpm)",\n                    "zh": "amd64 (.rpm)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-linux-arm64.deb",\n                  "text": {\n                    "en": "arm64 (.deb)",\n                    "fa": "arm64 (.deb)",\n                    "fr": "arm64 (.deb)",\n                    "ru": "arm64 (.deb)",\n                    "zh": "arm64 (.deb)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the version for your device, click the button below and install the app.",\n                "fa": "نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید",\n                "fr": "Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.",\n                "ru": "Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.",\n                "zh": "选择适合您设备的版本，点击下方按钮并安装应用程序。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "flclashx://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک در برنامه نصب نشده است",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClashX, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send",\n                "fa": "اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClashX به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClashX, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClashX перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить",\n                "zh": "如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 FlClashX 的“配置文件”部分，点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the added profile in the Profiles section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the TUN item. After launching, in the Proxy section, you can change the choice of the server to which you will be connected.",\n                "fa": "نمایه اضافه شده را در قسمت پروفایل ها انتخاب کنید. در داشبورد، روی دکمه فعال کردن در گوشه پایین سمت راست کلیک کنید و سپس سوئیچ کنار مورد TUN را روشن کنید. پس از راه اندازی در قسمت Proxy می توانید انتخاب سروری که به آن متصل خواهید شد را تغییر دهید.",\n                "fr": "Select the added profile in the « Profiles » section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the « TUN » item. After launching, in the « Proxy » section, you can change the choice of the server to which you will be connected.",\n                "ru": "Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит.",\n                "zh": "在“配置文件”部分选择已添加的配置文件。在控制面板右下角点击启用按钮，然后打开 TUN 项旁边的开关。启动后，在代理部分可以更改所连接的服务器。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Koala Clash",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_amd64.deb",\n                  "text": {\n                    "en": "amd64 (.deb)",\n                    "fa": "amd64 (.deb)",\n                    "fr": "amd64 (.deb)",\n                    "ru": "amd64 (.deb)",\n                    "zh": "amd64 (.deb)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash.x86_64.rpm",\n                  "text": {\n                    "en": "amd64 (.rpm)",\n                    "fa": "amd64 (.rpm)",\n                    "fr": "amd64 (.rpm)",\n                    "ru": "amd64 (.rpm)",\n                    "zh": "amd64 (.rpm)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_arm64.deb",\n                  "text": {\n                    "en": "arm64 (.deb)",\n                    "fa": "arm64 (.deb)",\n                    "fr": "arm64 (.deb)",\n                    "ru": "arm64 (.deb)",\n                    "zh": "arm64 (.deb)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash.aarch64.rpm",\n                  "text": {\n                    "en": "arm64 (.rpm)",\n                    "fa": "arm64 (.rpm)",\n                    "fr": "arm64 (.rpm)",\n                    "ru": "arm64 (.rpm)",\n                    "zh": "arm64 (.rpm)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the version for your device, click the button below and install the app.",\n                "fa": "نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید",\n                "fr": "Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.",\n                "ru": "Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.",\n                "zh": "选择适合您设备的版本，点击下方按钮并安装应用程序。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Warning",\n                "fa": "هشدار",\n                "fr": "Avertissement",\n                "ru": "Предупреждение",\n                "zh": "警告"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash.",\n                "fa": "اگر قبلاً از Clash Verge Rev استفاده کرده‌اید، باید قبل از نصب Koala Clash آن را حذف کنید.",\n                "fr": "If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash.",\n                "ru": "Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash.",\n                "zh": "如果您之前用过 Clash Verge Rev，请在安装 Koala Clash 前先卸载它。"\n              },\n              "svgIconColor": "red"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "koala-clash://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add subscription",\n                "fa": "برای افزودن اشتراک روی دکمه زیر کلیک کنید",\n                "fr": "Clique sur le bouton ci‑dessous pour ajouter l’abonnement.",\n                "ru": "Нажмите кнопку ниже, чтобы добавить подписку",\n                "zh": "点击下方按钮以添加订阅"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک اضافه نشد",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the Add Profile button, paste the link into the text field, and then click the Import button.",\n                "fa": "اگر پس از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در گوشه بالا سمت راست این صفحه کلیک کنید و لینک را کپی کنید. در برنامه Koala Clash به صفحه اصلی بروید، روی دکمه افزودن پروفایل کلیک کنید، لینک را در فیلد متنی قرار دهید و سپس روی دکمه وارد کردن کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the « Add Profile » button, paste the link into the text field, and then click the « Import » button.",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.",\n                "zh": "如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 Koala Clash 主页面点击“添加配置文件”按钮，将链接粘贴到文本框中，然后点击“导入”按钮。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.",\n                "fa": "می‌توانید سرور را در پایین صفحه اصلی انتخاب کنید و با کلیک روی دکمه بزرگ در مرکز صفحه اصلی، VPN را فعال کنید.",\n                "fr": "You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.",\n                "ru": "Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.",\n                "zh": "您可以在主页面底部选择服务器，并通过点击主页面中央的大按钮来启用 VPN。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        },\n        {\n          "name": "Prizrak-Box",\n          "blocks": [\n            {\n              "title": {\n                "en": "App Installation",\n                "fa": "نصب برنامه",\n                "fr": "Installation de l'application",\n                "ru": "Установка приложения",\n                "zh": "应用安装"\n              },\n              "buttons": [\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/linux-amd64.deb",\n                  "text": {\n                    "en": "amd64 (.deb)",\n                    "fa": "amd64 (.deb)",\n                    "fr": "amd64 (.deb)",\n                    "ru": "amd64 (.deb)",\n                    "zh": "amd64 (.deb)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/linux-amd64.rpm",\n                  "text": {\n                    "en": "amd64 (.rpm)",\n                    "fa": "amd64 (.rpm)",\n                    "fr": "amd64 (.rpm)",\n                    "ru": "amd64 (.rpm)",\n                    "zh": "amd64 (.rpm)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/linux-arm64.deb",\n                  "text": {\n                    "en": "arm64 (.deb)",\n                    "fa": "arm64 (.deb)",\n                    "fr": "arm64 (.deb)",\n                    "ru": "arm64 (.deb)",\n                    "zh": "arm64 (.deb)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                },\n                {\n                  "link": "https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/linux-arm64.rpm",\n                  "text": {\n                    "en": "arm64 (.rpm)",\n                    "fa": "arm64 (.rpm)",\n                    "fr": "arm64 (.rpm)",\n                    "ru": "arm64 (.rpm)",\n                    "zh": "arm64 (.rpm)"\n                  },\n                  "type": "external",\n                  "svgIconKey": "ExternalLink"\n                }\n              ],\n              "svgIconKey": "DownloadIcon",\n              "description": {\n                "en": "Choose the package matching your architecture and install Prizrak-Box.",\n                "fa": "بسته مناسب معماری خود را انتخاب کرده و Prizrak-Box را نصب کنید.",\n                "fr": "Choose the package matching your architecture and install Prizrak-Box.",\n                "ru": "Выберите пакет под вашу архитектуру и установите Prizrak-Box.",\n                "zh": "选择适合您架构的安装包并安装 Prizrak-Box。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Warning",\n                "fa": "هشدار",\n                "fr": "Avertissement",\n                "ru": "Предупреждение",\n                "zh": "警告"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "Run the program.",\n                "fa": "برنامه را اجرا کنید.",\n                "fr": "Run the program.",\n                "ru": "Запустите программу.",\n                "zh": "运行程序。"\n              },\n              "svgIconColor": "red"\n            },\n            {\n              "title": {\n                "en": "Add Subscription",\n                "fa": "اضافه کردن اشتراک",\n                "fr": "Ajouter une souscription",\n                "ru": "Добавление подписки",\n                "zh": "添加订阅"\n              },\n              "buttons": [\n                {\n                  "link": "prizrak-box://install-config?url={{SUBSCRIPTION_LINK}}",\n                  "text": {\n                    "en": "Add Subscription",\n                    "fa": "اضافه کردن اشتراک",\n                    "fr": "Ajouter une souscription",\n                    "ru": "Добавить подписку",\n                    "zh": "添加订阅"\n                  },\n                  "type": "subscriptionLink",\n                  "svgIconKey": "Plus"\n                }\n              ],\n              "svgIconKey": "CloudDownload",\n              "description": {\n                "en": "Click the button below to add the subscription automatically.",\n                "fa": "روی دکمه زیر کلیک کنید تا اشتراک به صورت خودکار افزوده شود.",\n                "fr": "Click the button below to add the subscription automatically.",\n                "ru": "Нажмите кнопку ниже, чтобы автоматически добавить подписку.",\n                "zh": "点击下方按钮即可自动添加订阅。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "If the subscription is not added",\n                "fa": "اگر اشتراک در برنامه نصب نشده است",\n                "fr": "Si l’abonnement ne s’ajoute pas",\n                "ru": "Если подписка не добавилась",\n                "zh": "如果未添加订阅"\n              },\n              "buttons": [],\n              "svgIconKey": "Gear",\n              "description": {\n                "en": "If nothing happens after clicking the button, add the subscription manually. On this page, click the Get Link button in the upper right corner, copy the link. In Prizrak-Box, go to the Profiles section, click the + button, paste your copied link, and click Confirm.",\n                "fa": "اگر پس از کلیک بر روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در این صفحه، روی دکمه «دریافت پیوند» در گوشه بالا سمت راست کلیک کنید، پیوند را کپی کنید. در Prizrak-Box، به بخش «پروفایل‌ها» بروید، روی دکمه + کلیک کنید، پیوند کپی شده خود را جای‌گذاری کنید و روی «تأیید» کلیک کنید.",\n                "fr": "If nothing happens after clicking the button, add the subscription manually. On this page, click the « Get Link » button in the upper right corner, copy the link. In Prizrak-Box, go to the « Profiles » section, click the + button, paste your copied link, and click « Confirm ».",\n                "ru": "Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку «Получить ссылку» в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел «Профили», нажмите кнопку «+», вставьте скопированную ссылку и нажмите «Подтвердить».",\n                "zh": "如果点击按钮后没有任何反应，请手动添加订阅。在此页面上，点击右上角的“获取链接”按钮，复制链接。在 Prizrak-Box 中，转到“配置文件”部分，点击 + 按钮，粘贴您复制的链接，然后点击“确认”。"\n              },\n              "svgIconColor": "cyan"\n            },\n            {\n              "title": {\n                "en": "Connect and use",\n                "fa": "متصل شوید و استفاده کنید",\n                "fr": "Se connecter et utiliser",\n                "ru": "Подключение и использование",\n                "zh": "连接并使用"\n              },\n              "buttons": [],\n              "svgIconKey": "Check",\n              "description": {\n                "en": "Select the added subscription in the Profiles section. You can choose the server country in the Proxy (🚀) section. Set the TUN switch to ON.",\n                "fa": "اشتراک افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. می‌توانید کشور سرور را در بخش Proxy (🚀) انتخاب کنید. سوئیچ TUN را روی حالت روشن قرار دهید.",\n                "fr": "Select the added subscription in the « Profiles » section. You can choose the server country in the « Proxy » (🚀) section. Set the « TUN » switch to ON.",\n                "ru": "Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.",\n                "zh": "在“配置文件”部分选择已添加的订阅。可在“代理 (🚀)”部分选择服务器国家。将 TUN 开关切换到开启。"\n              },\n              "svgIconColor": "teal"\n            }\n          ],\n          "featured": true\n        }\n      ],\n      "svgIconKey": "Ubuntu",\n      "displayName": {\n        "en": "Linux",\n        "fa": "Linux",\n        "fr": "Linux",\n        "ru": "Linux",\n        "zh": "Linux"\n      }\n    }\n  },\n  "svgLibrary": {\n    "TV": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n      0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n      stroke-linejoin=\\"round\\"><path\\n      stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M3 7m0 2a2 2 0 0 1 2 -2h14a2\\n      2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z\\" /><path d=\\"M16 3l-4 4l-4\\n      -4\\" /></svg>",\n    "Gear": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n          0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n          stroke-linejoin=\\"round\\"><path\\n          stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M10.325 4.317c.426\\n          -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31\\n          .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724\\n          1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0\\n          0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573\\n          -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756\\n          -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826\\n          -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z\\" /><path d=\\"M9 12a3 3 0\\n          1 0 6 0a3 3 0 0 0 -6 0\\" /></svg>",\n    "Plus": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\"\\n            viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\"\\n            stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path stroke=\\"none\\" d=\\"M0 0h24v24H0z\\"\\n            fill=\\"none\\"/><path d=\\"M12 5v14\\" /><path d=\\"M5 12h14\\" /></svg>",\n    "Star": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z\\" /></svg>",\n    "Check": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n          0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n          stroke-linejoin=\\"round\\"><path\\n          stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M5 12l5 5l10 -10\\"\\n          /></svg>",\n    "macOS": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n      0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n      stroke-linejoin=\\"round\\"><path\\n      stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M3 4m0 1a1 1 0 0 1 1 -1h16a1\\n      1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z\\" /><path d=\\"M7 8v1\\" /><path\\n      d=\\"M17 8v1\\" /><path d=\\"M12.5 4c-.654 1.486 -1.26 3.443 -1.5 9h2.5c-.19 2.867\\n      .094 5.024 .5 7\\" /><path d=\\"M7 15.5c3.667 2 6.333 2 10 0\\" /></svg>",\n    "Ubuntu": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M12 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\\" /><path d=\\"M17.723 7.41a7.992 7.992 0 0 0 -3.74 -2.162m-3.971 0a7.993 7.993 0 0 0 -3.789 2.216m-1.881 3.215a8 8 0 0 0 -.342 2.32c0 .738 .1 1.453 .287 2.132m1.96 3.428a7.993 7.993 0 0 0 3.759 2.19m4 0a7.993 7.993 0 0 0 3.747 -2.186m1.962 -3.43a8.008 8.008 0 0 0 .287 -2.131c0 -.764 -.107 -1.503 -.307 -2.203\\" /><path d=\\"M5 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\\" /><path d=\\"M19 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\\" /></svg>",\n    "Android": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n      0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n      stroke-linejoin=\\"round\\"><path\\n      stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M4 10l0 6\\" /><path d=\\"M20\\n      10l0 6\\" /><path d=\\"M7 9h10v8a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-8a5 5 0 0 1\\n      10 0\\" /><path d=\\"M8 3l1 2\\" /><path d=\\"M16 3l-1 2\\" /><path d=\\"M9 18l0 3\\" /><path\\n      d=\\"M15 18l0 3\\" /></svg>",\n    "Windows": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n      0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n      stroke-linejoin=\\"round\\"><path\\n      stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M17.8 20l-12 -1.5c-1 -.1\\n      -1.8 -.9 -1.8 -1.9v-9.2c0 -1 .8 -1.8 1.8 -1.9l12 -1.5c1.2 -.1 2.2 .8 2.2 1.9v12.1c0\\n      1.2 -1.1 2.1 -2.2 1.9z\\" /><path d=\\"M12 5l0 14\\" /><path d=\\"M4 12l16 0\\" /></svg>",\n    "AppleIcon": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n      0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n      stroke-linejoin=\\"round\\"><path\\n      stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M8.286 7.008c-3.216 0\\n      -4.286 3.23 -4.286 5.92c0 3.229 2.143 8.072 4.286 8.072c1.165 -.05 1.799 -.538\\n      3.214 -.538c1.406 0 1.607 .538 3.214 .538s4.286 -3.229 4.286 -5.381c-.03 -.011\\n      -2.649 -.434 -2.679 -3.23c-.02 -2.335 2.589 -3.179 2.679 -3.228c-1.096 -1.606\\n      -3.162 -2.113 -3.75 -2.153c-1.535 -.12 -3.032 1.077 -3.75 1.077c-.729 0 -2.036\\n      -1.077 -3.214 -1.077z\\" /><path d=\\"M12 4a2 2 0 0 0 2 -2a2 2 0 0 0 -2 2\\" /></svg>",\n    "DownloadIcon": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n          0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n          stroke-linejoin=\\"round\\"><path\\n          stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M4 17v2a2 2 0 0 0\\n          2 2h12a2 2 0 0 0 2 -2v-2\\" /><path d=\\"M7 11l5 5l5 -5\\" /><path d=\\"M12 4l0\\n          12\\" /></svg>",\n    "ExternalLink": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\"\\n            viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\"\\n            stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><path stroke=\\"none\\" d=\\"M0\\n            0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0\\n            2 2h10a2 2 0 0 0 2 -2v-6\\" /><path d=\\"M11 13l9 -9\\" /><path d=\\"M15 4h5v5\\"\\n            /></svg>",\n    "CloudDownload": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" viewBox=\\"0\\n          0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\"\\n          stroke-linejoin=\\"round\\"><path\\n          stroke=\\"none\\" d=\\"M0 0h24v24H0z\\" fill=\\"none\\"/><path d=\\"M19 18a3.5 3.5 0 0\\n          0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4\\" /><path d=\\"M12 13l0\\n          9\\" /><path d=\\"M9 19l3 3l3 -3\\" /></svg>"\n  },\n  "baseSettings": {\n    "metaTitle": "Subscription",\n    "metaDescription": "Subscription",\n    "hideGetLinkButton": false,\n    "showConnectionKeys": false\n  },\n  "baseTranslations": {\n    "name": {\n      "en": "Username",\n      "fa": "نام کاربری",\n      "fr": "Nom d'utilisateur",\n      "ru": "Имя пользователя",\n      "zh": "用户名"\n    },\n    "active": {\n      "en": "Active",\n      "fa": "فعال",\n      "fr": "Actif",\n      "ru": "Активна",\n      "zh": "活跃"\n    },\n    "status": {\n      "en": "Status",\n      "fa": "وضعیت",\n      "fr": "Statut",\n      "ru": "Статус",\n      "zh": "状态"\n    },\n    "expired": {\n      "en": "Expired",\n      "fa": "منقضی شده در",\n      "fr": "Expiré",\n      "ru": "Истекла",\n      "zh": "已于"\n    },\n    "expires": {\n      "en": "Expires",\n      "fa": "منقضی می‌شود",\n      "fr": "Expire",\n      "ru": "Истекает",\n      "zh": "到期时间"\n    },\n    "getLink": {\n      "en": "Get Link",\n      "fa": "دریافت لینک",\n      "fr": "Obtenir le lien",\n      "ru": "Получение ссылки",\n      "zh": "获取链接"\n    },\n    "unknown": {\n      "en": "Unknown",\n      "fa": "نامعلوم",\n      "fr": "Inconnu",\n      "ru": "Неизвестно",\n      "zh": "未知"\n    },\n    "copyLink": {\n      "en": "Copy link",\n      "fa": "کپی لینک",\n      "fr": "Copier le lien",\n      "ru": "Скопировать ссылку",\n      "zh": "复制链接"\n    },\n    "inactive": {\n      "en": "Inactive",\n      "fa": "غیرفعال",\n      "fr": "Inactif",\n      "ru": "Неактивна",\n      "zh": "未激活"\n    },\n    "bandwidth": {\n      "en": "Bandwidth",\n      "fa": "پهنای باند",\n      "fr": "Bande passante",\n      "ru": "Трафик",\n      "zh": "流量"\n    },\n    "expiresIn": {\n      "en": "Expires",\n      "fa": "منقضی می‌شود در",\n      "fr": "Expire",\n      "ru": "Истекает",\n      "zh": "后到期"\n    },\n    "linkCopied": {\n      "en": "Likn copied",\n      "fa": "لینک کپی شد",\n      "fr": "Lien copié",\n      "ru": "Ссылка скопирована",\n      "zh": "链接已复制"\n    },\n    "scanQrCode": {\n      "en": "Scan the QR code above in the client",\n      "fa": "کد QR بالا را در کلاینت اسکن کنید",\n      "fr": "Scannez le code QR ci-dessus dans le client",\n      "ru": "Отсканируйте QR-код в приложении",\n      "zh": "在客户端中扫描上方二维码"\n    },\n    "indefinitely": {\n      "en": "Indefinitely",\n      "fa": "هیچوقت",\n      "fr": "Indéfiniment",\n      "ru": "Бессрочно",\n      "zh": "永久"\n    },\n    "scanToImport": {\n      "en": "Scan to import this key",\n      "fa": "برای وارد کردن این کلید اسکن کنید",\n      "fr": "Scannez pour importer cette clé",\n      "ru": "Отсканируйте QR-код для импорта ключа",\n      "zh": "扫描以导入此密钥"\n    },\n    "connectionKeysHeader": {\n      "en": "Connection Keys",\n      "fa": "کلیدهای اتصال",\n      "fr": "Clés de connexion",\n      "ru": "Ключи подключения",\n      "zh": "连接密钥"\n    },\n    "linkCopiedToClipboard": {\n      "en": "Link copied to clipboard",\n      "fa": "لینک به کلیپ‌بورد کپی شد",\n      "fr": "Lien copié dans le presse-papiers",\n      "ru": "Ссылка скопирована в буфер обмена",\n      "zh": "链接已复制到剪贴板"\n    },\n    "scanQrCodeDescription": {\n      "en": "Easily add the subscription to any client. There's another option: copy the link below and paste it into the client",\n      "fa": "افزودن آسان اشتراک به هر کلاینت. گزینه دیگری هم وجود دارد: لینک زیر را کپی کرده و در کلاینت جای‌گذاری کنید",\n      "fr": "Ajoutez facilement l'abonnement à n'importe quel client. Il y a une autre option : copiez le lien ci-dessous et collez-le dans le client",\n      "ru": "Простое добавление подписки в любой клиент. Есть и другой вариант: скопируйте ссылку ниже и вставьте в клиент.",\n      "zh": "轻松将订阅添加到任何客户端。还有另一种选择：复制下面的链接并粘贴到客户端中"\n    },\n    "installationGuideHeader": {\n      "en": "Installation",\n      "fa": "نصب",\n      "fr": "Installation",\n      "ru": "Установка",\n      "zh": "安装"\n    }\n  },\n  "brandingSettings": {\n    "title": "STEATLHNET ",\n    "logoUrl": "https://stealthnet.app/favicon.svg",\n    "supportUrl": "https://t.me/stealthnet_app"\n  }\n}
cmmvhe50g004av3p02cmn9je7	landing_signal_cards_json	[{"eyebrow":"privacy core","title":"Zero-log и аккуратная защита","desc":"Не ощущается как странный хак: нормальный продуктовый слой, чистый доступ и понятный контроль."},{"eyebrow":"global access","title":"Нужные сервисы открываются без драмы","desc":"Маршруты и сценарии уже собраны под реальные поездки, работу и привычные повседневные задачи."},{"eyebrow":"payments sync","title":"Оплата встроена в общий сценарий","desc":"Не отдельная форма из девяностых, а часть единого опыта: выбрал, оплатил, сразу подключился."}]
cmmvhdy4b000pv3p063vw0nk6	logo	data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImNvcmVHcmFkaWVudCIgY3g9IjM1JSIgY3k9IjM1JSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMzYmM5ZGIiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzBlYTVlOSIgLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJnbG93Ij4KICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMiIgcmVzdWx0PSJjb2xvcmVkQmx1ciIvPgogICAgICA8ZmVNZXJnZT4KICAgICAgICA8ZmVNZXJnZU5vZGUgaW49ImNvbG9yZWRCbHVyIi8+CiAgICAgICAgPGZlTWVyZ2VOb2RlIGluPSJTb3VyY2VHcmFwaGljIi8+CiAgICAgIDwvZmVNZXJnZT4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICAKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMCwgMTApIj4KICAgIDxjaXJjbGUgY3g9IjM1IiBjeT0iNTAiIHI9IjE0IiBmaWxsPSJ1cmwoI2NvcmVHcmFkaWVudCkiIGZpbHRlcj0idXJsKCNnbG93KSIvPgogICAgPGNpcmNsZSBjeD0iMzIiIGN5PSI0NyIgcj0iNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC40Ii8+CiAgICA8cGF0aCBkPSJNIDY1IDIwIEEgMzUgMzUgMCAwIDEgNjUgODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPC9nPgo8L3N2Zz4=
cmmvhdy7z000rv3p01nzpbr2a	favicon	data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImNvcmVHcmFkaWVudCIgY3g9IjM1JSIgY3k9IjM1JSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMzYmM5ZGIiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzBlYTVlOSIgLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJnbG93Ij4KICAgICAgPGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMiIgcmVzdWx0PSJjb2xvcmVkQmx1ciIvPgogICAgICA8ZmVNZXJnZT4KICAgICAgICA8ZmVNZXJnZU5vZGUgaW49ImNvbG9yZWRCbHVyIi8+CiAgICAgICAgPGZlTWVyZ2VOb2RlIGluPSJTb3VyY2VHcmFwaGljIi8+CiAgICAgIDwvZmVNZXJnZT4KICAgIDwvZmlsdGVyPgogIDwvZGVmcz4KICAKICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMCwgMTApIj4KICAgIDxjaXJjbGUgY3g9IjM1IiBjeT0iNTAiIHI9IjE0IiBmaWxsPSJ1cmwoI2NvcmVHcmFkaWVudCkiIGZpbHRlcj0idXJsKCNnbG93KSIvPgogICAgPGNpcmNsZSBjeD0iMzIiIGN5PSI0NyIgcj0iNSIgZmlsbD0iI2ZmZmZmZiIgb3BhY2l0eT0iMC40Ii8+CiAgICA8cGF0aCBkPSJNIDY1IDIwIEEgMzUgMzUgMCAwIDEgNjUgODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPC9nPgo8L3N2Zz4=
cmmypqmmc001dv31026owtq6f	epay_pid	1041
cmmypqmpx001ev310nt5b8ig1	epay_key	5J8J5T5TgCII11CC5HaZJ1Zl1m5viuVj
cmmypqmrs001fv310qy3ily57	epay_api_url	https://api.52luxing.com
cmmypqmtm001gv310kexiesa7	epay_methods	[{"type":"alipay","enabled":true,"label":"支付宝"},{"type":"wxpay","enabled":true,"label":"微信支付"},{"type":"usdt","enabled":false,"label":"USDT"}]
cmmvhe2u20034v3p0yjrfxue4	landing_feature_3_sub	畅游世界每一个角落
cmmvhe33l0039v3p0i41xs7r9	landing_benefits_title	为什么选择我们
\.


--
-- Data for Name: tariff_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tariff_categories (id, name, emoji_key, sort_order, created_at, updated_at) FROM stdin;
cmmvk8yc70058v3e0qul38b3w	STANDARD · 标准路线	ordinary	0	2026-03-18 04:48:03.031	2026-03-21 09:14:08.042
cmmvk9jpc0059v3e0cckp6jvd	PREMIUM · 高级路线	premium	1	2026-03-18 04:48:30.72	2026-03-21 09:14:08.042
cmn042i0p000bv3a0tjyvfwvr	PREMIUM · 高级路线 · 团队	\N	2	2026-03-21 09:13:58.969	2026-03-21 09:18:47.957
\.


--
-- Data for Name: tariffs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tariffs (id, category_id, name, description, duration_days, internal_squad_uuids, traffic_limit_bytes, device_limit, price, currency, sort_order, created_at, updated_at) FROM stdin;
cmmx4jykz00a4v3pk8zkdup5m	cmmvk8yc70058v3e0qul38b3w	30 DAYS	\N	30	{e613f409-a1d5-4864-8255-66d0e7a5b7b4}	107374182400	3	15	cny	1	2026-03-19 07:04:15.054	2026-03-21 16:41:37.199
cmmx4pybf00a6v3pkwfblmpdy	cmmvk8yc70058v3e0qul38b3w	365 DAYS	\N	365	{e613f409-a1d5-4864-8255-66d0e7a5b7b4}	1288490188800	5	149	cny	3	2026-03-19 07:08:54.651	2026-03-21 16:50:56.576
cmmvqwosd00a4v3igqeylk07q	cmmvk8yc70058v3e0qul38b3w	90 DAYS	\N	90	{e613f409-a1d5-4864-8255-66d0e7a5b7b4}	322122547200	5	39	cny	2	2026-03-18 07:54:28.093	2026-03-20 07:34:31.018
cmmx4z5na00adv3pksxu4gquu	cmmvk9jpc0059v3e0cckp6jvd	90 DAYS	\N	90	{fc086ce7-f685-46cc-858f-1a955974d2b0}	257698037760	5	69	cny	1	2026-03-19 07:16:04.054	2026-03-20 07:35:51.554
cmmvr15xy00a6v3ig1dnfqavs	cmmvk9jpc0059v3e0cckp6jvd	30 DAYS	\N	30	{fc086ce7-f685-46cc-858f-1a955974d2b0}	85899345920	3	29	cny	0	2026-03-18 07:57:56.95	2026-03-21 09:11:56.229
cmmx4u5kr00a8v3pk5iapgrww	cmmvk9jpc0059v3e0cckp6jvd	365 DAYS	\N	365	{fc086ce7-f685-46cc-858f-1a955974d2b0}	1030792151040	5	249	cny	2	2026-03-19 07:12:10.683	2026-03-21 09:12:08.793
cmn045ny8000dv3a0n3bsndtx	cmn042i0p000bv3a0tjyvfwvr	365 DAYS	\N	365	{fc086ce7-f685-46cc-858f-1a955974d2b0}	10737418240000	50	1999	cny	0	2026-03-21 09:16:26.623	2026-03-21 09:16:38.328
\.


--
-- Data for Name: ticket_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_messages (id, ticket_id, author_type, content, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tickets (id, client_id, subject, status, created_at, updated_at) FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: admin_notification_preferences admin_notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_notification_preferences
    ADD CONSTRAINT admin_notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: auto_broadcast_logs auto_broadcast_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_broadcast_logs
    ADD CONSTRAINT auto_broadcast_logs_pkey PRIMARY KEY (id);


--
-- Name: auto_broadcast_rules auto_broadcast_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_broadcast_rules
    ADD CONSTRAINT auto_broadcast_rules_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: contest_winners contest_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_winners
    ADD CONSTRAINT contest_winners_pkey PRIMARY KEY (id);


--
-- Name: contests contests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pending_email_links pending_email_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_email_links
    ADD CONSTRAINT pending_email_links_pkey PRIMARY KEY (id);


--
-- Name: pending_email_registrations pending_email_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_email_registrations
    ADD CONSTRAINT pending_email_registrations_pkey PRIMARY KEY (id);


--
-- Name: pending_telegram_links pending_telegram_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_telegram_links
    ADD CONSTRAINT pending_telegram_links_pkey PRIMARY KEY (id);


--
-- Name: promo_activations promo_activations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_activations
    ADD CONSTRAINT promo_activations_pkey PRIMARY KEY (id);


--
-- Name: promo_code_usages promo_code_usages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_code_usages
    ADD CONSTRAINT promo_code_usages_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: promo_groups promo_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_groups
    ADD CONSTRAINT promo_groups_pkey PRIMARY KEY (id);


--
-- Name: proxy_categories proxy_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_categories
    ADD CONSTRAINT proxy_categories_pkey PRIMARY KEY (id);


--
-- Name: proxy_nodes proxy_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_nodes
    ADD CONSTRAINT proxy_nodes_pkey PRIMARY KEY (id);


--
-- Name: proxy_slots proxy_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_slots
    ADD CONSTRAINT proxy_slots_pkey PRIMARY KEY (id);


--
-- Name: proxy_tariff_nodes proxy_tariff_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_tariff_nodes
    ADD CONSTRAINT proxy_tariff_nodes_pkey PRIMARY KEY (id);


--
-- Name: proxy_tariffs proxy_tariffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_tariffs
    ADD CONSTRAINT proxy_tariffs_pkey PRIMARY KEY (id);


--
-- Name: referral_credits referral_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_credits
    ADD CONSTRAINT referral_credits_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: singbox_categories singbox_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.singbox_categories
    ADD CONSTRAINT singbox_categories_pkey PRIMARY KEY (id);


--
-- Name: singbox_nodes singbox_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.singbox_nodes
    ADD CONSTRAINT singbox_nodes_pkey PRIMARY KEY (id);


--
-- Name: singbox_slots singbox_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.singbox_slots
    ADD CONSTRAINT singbox_slots_pkey PRIMARY KEY (id);


--
-- Name: singbox_tariffs singbox_tariffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.singbox_tariffs
    ADD CONSTRAINT singbox_tariffs_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tariff_categories tariff_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tariff_categories
    ADD CONSTRAINT tariff_categories_pkey PRIMARY KEY (id);


--
-- Name: tariffs tariffs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tariffs
    ADD CONSTRAINT tariffs_pkey PRIMARY KEY (id);


--
-- Name: ticket_messages ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: admin_notification_preferences_telegram_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_notification_preferences_telegram_id_key ON public.admin_notification_preferences USING btree (telegram_id);


--
-- Name: admins_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admins_email_key ON public.admins USING btree (email);


--
-- Name: auto_broadcast_logs_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auto_broadcast_logs_client_id_idx ON public.auto_broadcast_logs USING btree (client_id);


--
-- Name: auto_broadcast_logs_rule_id_client_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX auto_broadcast_logs_rule_id_client_id_key ON public.auto_broadcast_logs USING btree (rule_id, client_id);


--
-- Name: auto_broadcast_logs_rule_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auto_broadcast_logs_rule_id_idx ON public.auto_broadcast_logs USING btree (rule_id);


--
-- Name: clients_apple_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_apple_id_key ON public.clients USING btree (apple_id);


--
-- Name: clients_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_email_idx ON public.clients USING btree (email);


--
-- Name: clients_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_email_key ON public.clients USING btree (email);


--
-- Name: clients_google_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_google_id_key ON public.clients USING btree (google_id);


--
-- Name: clients_referral_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_referral_code_key ON public.clients USING btree (referral_code);


--
-- Name: clients_telegram_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_telegram_id_idx ON public.clients USING btree (telegram_id);


--
-- Name: clients_telegram_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX clients_telegram_id_key ON public.clients USING btree (telegram_id);


--
-- Name: clients_utm_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clients_utm_source_idx ON public.clients USING btree (utm_source);


--
-- Name: contest_winners_contest_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contest_winners_contest_id_idx ON public.contest_winners USING btree (contest_id);


--
-- Name: contest_winners_contest_id_place_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX contest_winners_contest_id_place_key ON public.contest_winners USING btree (contest_id, place);


--
-- Name: password_reset_tokens_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_client_id_idx ON public.password_reset_tokens USING btree (client_id);


--
-- Name: password_reset_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_expires_at_idx ON public.password_reset_tokens USING btree (expires_at);


--
-- Name: password_reset_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_reset_tokens_token_key ON public.password_reset_tokens USING btree (token);


--
-- Name: payments_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_client_id_idx ON public.payments USING btree (client_id);


--
-- Name: payments_order_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payments_order_id_key ON public.payments USING btree (order_id);


--
-- Name: payments_proxy_tariff_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_proxy_tariff_id_idx ON public.payments USING btree (proxy_tariff_id);


--
-- Name: payments_singbox_tariff_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_singbox_tariff_id_idx ON public.payments USING btree (singbox_tariff_id);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: payments_tariff_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_tariff_id_idx ON public.payments USING btree (tariff_id);


--
-- Name: pending_email_links_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_email_links_expires_at_idx ON public.pending_email_links USING btree (expires_at);


--
-- Name: pending_email_links_verification_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_email_links_verification_token_idx ON public.pending_email_links USING btree (verification_token);


--
-- Name: pending_email_links_verification_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pending_email_links_verification_token_key ON public.pending_email_links USING btree (verification_token);


--
-- Name: pending_email_registrations_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_email_registrations_email_idx ON public.pending_email_registrations USING btree (email);


--
-- Name: pending_email_registrations_verification_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_email_registrations_verification_token_idx ON public.pending_email_registrations USING btree (verification_token);


--
-- Name: pending_email_registrations_verification_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pending_email_registrations_verification_token_key ON public.pending_email_registrations USING btree (verification_token);


--
-- Name: pending_telegram_links_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_telegram_links_code_idx ON public.pending_telegram_links USING btree (code);


--
-- Name: pending_telegram_links_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX pending_telegram_links_code_key ON public.pending_telegram_links USING btree (code);


--
-- Name: pending_telegram_links_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pending_telegram_links_expires_at_idx ON public.pending_telegram_links USING btree (expires_at);


--
-- Name: promo_activations_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_activations_client_id_idx ON public.promo_activations USING btree (client_id);


--
-- Name: promo_activations_promo_group_id_client_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX promo_activations_promo_group_id_client_id_key ON public.promo_activations USING btree (promo_group_id, client_id);


--
-- Name: promo_activations_promo_group_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_activations_promo_group_id_idx ON public.promo_activations USING btree (promo_group_id);


--
-- Name: promo_code_usages_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_code_usages_client_id_idx ON public.promo_code_usages USING btree (client_id);


--
-- Name: promo_code_usages_promo_code_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX promo_code_usages_promo_code_id_idx ON public.promo_code_usages USING btree (promo_code_id);


--
-- Name: promo_codes_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX promo_codes_code_key ON public.promo_codes USING btree (code);


--
-- Name: promo_groups_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX promo_groups_code_key ON public.promo_groups USING btree (code);


--
-- Name: proxy_nodes_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proxy_nodes_token_key ON public.proxy_nodes USING btree (token);


--
-- Name: proxy_slots_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proxy_slots_client_id_idx ON public.proxy_slots USING btree (client_id);


--
-- Name: proxy_slots_node_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proxy_slots_node_id_idx ON public.proxy_slots USING btree (node_id);


--
-- Name: proxy_slots_node_id_login_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proxy_slots_node_id_login_key ON public.proxy_slots USING btree (node_id, login);


--
-- Name: proxy_slots_proxy_tariff_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proxy_slots_proxy_tariff_id_idx ON public.proxy_slots USING btree (proxy_tariff_id);


--
-- Name: proxy_slots_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proxy_slots_status_idx ON public.proxy_slots USING btree (status);


--
-- Name: proxy_tariff_nodes_node_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proxy_tariff_nodes_node_id_idx ON public.proxy_tariff_nodes USING btree (node_id);


--
-- Name: proxy_tariff_nodes_tariff_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proxy_tariff_nodes_tariff_id_idx ON public.proxy_tariff_nodes USING btree (tariff_id);


--
-- Name: proxy_tariff_nodes_tariff_id_node_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX proxy_tariff_nodes_tariff_id_node_id_key ON public.proxy_tariff_nodes USING btree (tariff_id, node_id);


--
-- Name: proxy_tariffs_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proxy_tariffs_category_id_idx ON public.proxy_tariffs USING btree (category_id);


--
-- Name: referral_credits_payment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referral_credits_payment_id_idx ON public.referral_credits USING btree (payment_id);


--
-- Name: referral_credits_referrer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX referral_credits_referrer_id_idx ON public.referral_credits USING btree (referrer_id);


--
-- Name: refresh_tokens_admin_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_admin_id_idx ON public.refresh_tokens USING btree (admin_id);


--
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_token_idx ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: singbox_nodes_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX singbox_nodes_token_key ON public.singbox_nodes USING btree (token);


--
-- Name: singbox_slots_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX singbox_slots_client_id_idx ON public.singbox_slots USING btree (client_id);


--
-- Name: singbox_slots_node_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX singbox_slots_node_id_idx ON public.singbox_slots USING btree (node_id);


--
-- Name: singbox_slots_node_id_user_identifier_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX singbox_slots_node_id_user_identifier_key ON public.singbox_slots USING btree (node_id, user_identifier);


--
-- Name: singbox_slots_singbox_tariff_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX singbox_slots_singbox_tariff_id_idx ON public.singbox_slots USING btree (singbox_tariff_id);


--
-- Name: singbox_slots_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX singbox_slots_status_idx ON public.singbox_slots USING btree (status);


--
-- Name: singbox_tariffs_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX singbox_tariffs_category_id_idx ON public.singbox_tariffs USING btree (category_id);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: tariffs_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tariffs_category_id_idx ON public.tariffs USING btree (category_id);


--
-- Name: ticket_messages_is_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_is_read_idx ON public.ticket_messages USING btree (is_read);


--
-- Name: ticket_messages_ticket_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ticket_messages_ticket_id_idx ON public.ticket_messages USING btree (ticket_id);


--
-- Name: tickets_client_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_client_id_idx ON public.tickets USING btree (client_id);


--
-- Name: tickets_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tickets_status_idx ON public.tickets USING btree (status);


--
-- Name: auto_broadcast_logs auto_broadcast_logs_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_broadcast_logs
    ADD CONSTRAINT auto_broadcast_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auto_broadcast_logs auto_broadcast_logs_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_broadcast_logs
    ADD CONSTRAINT auto_broadcast_logs_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.auto_broadcast_rules(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clients clients_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contest_winners contest_winners_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_winners
    ADD CONSTRAINT contest_winners_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contest_winners contest_winners_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contest_winners
    ADD CONSTRAINT contest_winners_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_proxy_tariff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_proxy_tariff_id_fkey FOREIGN KEY (proxy_tariff_id) REFERENCES public.proxy_tariffs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_singbox_tariff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_singbox_tariff_id_fkey FOREIGN KEY (singbox_tariff_id) REFERENCES public.singbox_tariffs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_tariff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tariff_id_fkey FOREIGN KEY (tariff_id) REFERENCES public.tariffs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: promo_activations promo_activations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_activations
    ADD CONSTRAINT promo_activations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promo_activations promo_activations_promo_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_activations
    ADD CONSTRAINT promo_activations_promo_group_id_fkey FOREIGN KEY (promo_group_id) REFERENCES public.promo_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promo_code_usages promo_code_usages_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_code_usages
    ADD CONSTRAINT promo_code_usages_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: promo_code_usages promo_code_usages_promo_code_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_code_usages
    ADD CONSTRAINT promo_code_usages_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proxy_slots proxy_slots_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_slots
    ADD CONSTRAINT proxy_slots_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proxy_slots proxy_slots_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_slots
    ADD CONSTRAINT proxy_slots_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.proxy_nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proxy_slots proxy_slots_proxy_tariff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_slots
    ADD CONSTRAINT proxy_slots_proxy_tariff_id_fkey FOREIGN KEY (proxy_tariff_id) REFERENCES public.proxy_tariffs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proxy_tariff_nodes proxy_tariff_nodes_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_tariff_nodes
    ADD CONSTRAINT proxy_tariff_nodes_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.proxy_nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proxy_tariff_nodes proxy_tariff_nodes_tariff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_tariff_nodes
    ADD CONSTRAINT proxy_tariff_nodes_tariff_id_fkey FOREIGN KEY (tariff_id) REFERENCES public.proxy_tariffs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proxy_tariffs proxy_tariffs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proxy_tariffs
    ADD CONSTRAINT proxy_tariffs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.proxy_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referral_credits referral_credits_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_credits
    ADD CONSTRAINT referral_credits_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: referral_credits referral_credits_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_credits
    ADD CONSTRAINT referral_credits_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: singbox_slots singbox_slots_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.singbox_slots
    ADD CONSTRAINT singbox_slots_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: singbox_slots singbox_slots_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.singbox_slots
    ADD CONSTRAINT singbox_slots_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.singbox_nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: singbox_slots singbox_slots_singbox_tariff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.singbox_slots
    ADD CONSTRAINT singbox_slots_singbox_tariff_id_fkey FOREIGN KEY (singbox_tariff_id) REFERENCES public.singbox_tariffs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: singbox_tariffs singbox_tariffs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.singbox_tariffs
    ADD CONSTRAINT singbox_tariffs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.singbox_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tariffs tariffs_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tariffs
    ADD CONSTRAINT tariffs_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.tariff_categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_messages ticket_messages_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tickets tickets_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vLbou1hZgwSjCb7d4ut9L91tbA71VPexHXcDIbvw8IZDwGmH5MdsPwZxcQFNig2

