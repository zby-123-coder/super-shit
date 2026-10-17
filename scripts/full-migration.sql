--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Homebrew)
-- Dumped by pg_dump version 16.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP INDEX IF EXISTS public.uk_teaching_pair;
DROP INDEX IF EXISTS public.uk_progress_chapter;
DROP INDEX IF EXISTS public.uk_profile_openid;
DROP INDEX IF EXISTS public.uk_lesson_account;
DROP INDEX IF EXISTS public.uk_guardian_pair;
DROP INDEX IF EXISTS public.uk_favorite;
DROP INDEX IF EXISTS public.uk_family_invite;
DROP INDEX IF EXISTS public.uk_auth_session_token;
DROP INDEX IF EXISTS public.uk_auth_credential_user;
DROP INDEX IF EXISTS public.uk_auth_credential_login;
DROP INDEX IF EXISTS public.uk_app_profile_user;
DROP INDEX IF EXISTS public.uk_app_profile_invite;
DROP INDEX IF EXISTS public.idx_wq_student;
DROP INDEX IF EXISTS public.idx_task_teacher;
DROP INDEX IF EXISTS public.idx_task_student;
DROP INDEX IF EXISTS public.idx_qb_kp;
DROP INDEX IF EXISTS public.idx_profile_family;
DROP INDEX IF EXISTS public.idx_message_user;
DROP INDEX IF EXISTS public.idx_ledger_student;
DROP INDEX IF EXISTS public.idx_course_teacher;
DROP INDEX IF EXISTS public.idx_course_student;
DROP INDEX IF EXISTS public.idx_checkin_task;
DROP INDEX IF EXISTS public.idx_checkin_student;
DROP INDEX IF EXISTS public.idx_auth_session_user;
DROP INDEX IF EXISTS public.idx_article_column;
ALTER TABLE IF EXISTS ONLY public.wrong_question DROP CONSTRAINT IF EXISTS wrong_question_pkey;
ALTER TABLE IF EXISTS ONLY public.teaching_link DROP CONSTRAINT IF EXISTS teaching_link_pkey;
ALTER TABLE IF EXISTS ONLY public.task_checkin DROP CONSTRAINT IF EXISTS task_checkin_pkey;
ALTER TABLE IF EXISTS ONLY public.study_task DROP CONSTRAINT IF EXISTS study_task_pkey;
ALTER TABLE IF EXISTS ONLY public.study_progress DROP CONSTRAINT IF EXISTS study_progress_pkey;
ALTER TABLE IF EXISTS ONLY public.question_bank DROP CONSTRAINT IF EXISTS question_bank_pkey;
ALTER TABLE IF EXISTS ONLY public.notice_message DROP CONSTRAINT IF EXISTS notice_message_pkey;
ALTER TABLE IF EXISTS ONLY public.lesson_ledger DROP CONSTRAINT IF EXISTS lesson_ledger_pkey;
ALTER TABLE IF EXISTS ONLY public.lesson_account DROP CONSTRAINT IF EXISTS lesson_account_pkey;
ALTER TABLE IF EXISTS ONLY public.guardian_link DROP CONSTRAINT IF EXISTS guardian_link_pkey;
ALTER TABLE IF EXISTS ONLY public.family DROP CONSTRAINT IF EXISTS family_pkey;
ALTER TABLE IF EXISTS ONLY public.course DROP CONSTRAINT IF EXISTS course_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_session DROP CONSTRAINT IF EXISTS auth_session_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_credential DROP CONSTRAINT IF EXISTS auth_credential_pkey;
ALTER TABLE IF EXISTS ONLY public.article DROP CONSTRAINT IF EXISTS article_pkey;
ALTER TABLE IF EXISTS ONLY public.article_favorite DROP CONSTRAINT IF EXISTS article_favorite_pkey;
ALTER TABLE IF EXISTS ONLY public.app_profile DROP CONSTRAINT IF EXISTS app_profile_pkey;
DROP TABLE IF EXISTS public.wrong_question;
DROP TABLE IF EXISTS public.teaching_link;
DROP TABLE IF EXISTS public.task_checkin;
DROP TABLE IF EXISTS public.study_task;
DROP TABLE IF EXISTS public.study_progress;
DROP TABLE IF EXISTS public.question_bank;
DROP TABLE IF EXISTS public.notice_message;
DROP TABLE IF EXISTS public.lesson_ledger;
DROP TABLE IF EXISTS public.lesson_account;
DROP TABLE IF EXISTS public.guardian_link;
DROP TABLE IF EXISTS public.family;
DROP TABLE IF EXISTS public.course;
DROP TABLE IF EXISTS public.auth_session;
DROP TABLE IF EXISTS public.auth_credential;
DROP TABLE IF EXISTS public.article_favorite;
DROP TABLE IF EXISTS public.article;
DROP TABLE IF EXISTS public.app_profile;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_profile (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(64) NOT NULL,
    role character varying(32) DEFAULT 'student'::character varying NOT NULL,
    name character varying(64),
    phone character varying(32),
    grade character varying(32),
    subject_tags character varying(255),
    avatar_url text,
    invite_code character varying(16),
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64),
    notify_mute boolean DEFAULT false NOT NULL,
    family_id uuid,
    wechat_openid character varying(64)
);


--
-- Name: article; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    column_type character varying(32) DEFAULT 'news'::character varying NOT NULL,
    cover_url text,
    summary text,
    content text NOT NULL,
    status character varying(32) DEFAULT 'published'::character varying NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    read_count integer DEFAULT 0 NOT NULL,
    author_user_id character varying(64),
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: article_favorite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_favorite (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(64) NOT NULL,
    article_id uuid NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: auth_credential; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_credential (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(64) NOT NULL,
    login_name character varying(64) NOT NULL,
    password_hash character varying(255) NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: auth_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(64) NOT NULL,
    token_hash character varying(64) NOT NULL,
    device_label character varying(255),
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: course; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_user_id character varying(64) NOT NULL,
    teacher_user_id character varying(64),
    subject character varying(64) NOT NULL,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    location character varying(255),
    status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    lesson_count integer DEFAULT 1 NOT NULL,
    remark text,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: family; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.family (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(64) NOT NULL,
    owner_user_id character varying(64) NOT NULL,
    invite_code character varying(16) NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: guardian_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_link (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_user_id character varying(64) NOT NULL,
    student_user_id character varying(64) NOT NULL,
    relation_type character varying(32) DEFAULT 'parent'::character varying NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: lesson_account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_user_id character varying(64) NOT NULL,
    subject character varying(64) NOT NULL,
    total_lessons integer DEFAULT 0 NOT NULL,
    used_lessons integer DEFAULT 0 NOT NULL,
    alert_threshold integer DEFAULT 3 NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: lesson_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_ledger (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_user_id character varying(64) NOT NULL,
    subject character varying(64) NOT NULL,
    change_amount integer NOT NULL,
    change_type character varying(32) NOT NULL,
    course_id uuid,
    operator_user_id character varying(64),
    remark text,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64),
    confirmed_at timestamp with time zone,
    confirmed_by character varying(64)
);


--
-- Name: notice_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notice_message (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(64) NOT NULL,
    msg_type character varying(32) DEFAULT 'system'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    link_path character varying(255),
    is_read boolean DEFAULT false NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64),
    priority character varying(16) DEFAULT 'normal'::character varying NOT NULL
);


--
-- Name: question_bank; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_bank (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    subject character varying(64) NOT NULL,
    chapter character varying(255),
    knowledge_point character varying(255),
    title text NOT NULL,
    answer text,
    analysis text,
    difficulty character varying(16) DEFAULT 'medium'::character varying NOT NULL,
    source character varying(32) DEFAULT 'manual'::character varying NOT NULL,
    use_count integer DEFAULT 0 NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: study_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_user_id character varying(64) NOT NULL,
    subject character varying(64) NOT NULL,
    chapter character varying(255) NOT NULL,
    percent integer DEFAULT 0 NOT NULL,
    current_point character varying(255),
    updated_by_user_id character varying(64),
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: study_task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.study_task (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_user_id character varying(64) NOT NULL,
    student_user_id character varying(64) NOT NULL,
    subject character varying(64),
    title character varying(255) NOT NULL,
    content text,
    due_at timestamp with time zone,
    status character varying(32) DEFAULT 'open'::character varying NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: task_checkin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_checkin (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    student_user_id character varying(64) NOT NULL,
    content text,
    image_urls text[],
    duration_min integer,
    status character varying(32) DEFAULT 'submitted'::character varying NOT NULL,
    review_comment text,
    reviewed_by_user_id character varying(64),
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: teaching_link; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teaching_link (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    teacher_user_id character varying(64) NOT NULL,
    student_user_id character varying(64) NOT NULL,
    subject character varying(64),
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: wrong_question; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wrong_question (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_user_id character varying(64) NOT NULL,
    subject character varying(64) NOT NULL,
    chapter character varying(255),
    title character varying(500) NOT NULL,
    reason character varying(255),
    knowledge_point character varying(255),
    status character varying(32) DEFAULT 'open'::character varying NOT NULL,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: app_profile app_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_profile
    ADD CONSTRAINT app_profile_pkey PRIMARY KEY (id);


--
-- Name: article_favorite article_favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_favorite
    ADD CONSTRAINT article_favorite_pkey PRIMARY KEY (id);


--
-- Name: article article_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article
    ADD CONSTRAINT article_pkey PRIMARY KEY (id);


--
-- Name: auth_credential auth_credential_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_credential
    ADD CONSTRAINT auth_credential_pkey PRIMARY KEY (id);


--
-- Name: auth_session auth_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_session
    ADD CONSTRAINT auth_session_pkey PRIMARY KEY (id);


--
-- Name: course course_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course
    ADD CONSTRAINT course_pkey PRIMARY KEY (id);


--
-- Name: family family_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.family
    ADD CONSTRAINT family_pkey PRIMARY KEY (id);


--
-- Name: guardian_link guardian_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_link
    ADD CONSTRAINT guardian_link_pkey PRIMARY KEY (id);


--
-- Name: lesson_account lesson_account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_account
    ADD CONSTRAINT lesson_account_pkey PRIMARY KEY (id);


--
-- Name: lesson_ledger lesson_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_ledger
    ADD CONSTRAINT lesson_ledger_pkey PRIMARY KEY (id);


--
-- Name: notice_message notice_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notice_message
    ADD CONSTRAINT notice_message_pkey PRIMARY KEY (id);


--
-- Name: question_bank question_bank_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank
    ADD CONSTRAINT question_bank_pkey PRIMARY KEY (id);


--
-- Name: study_progress study_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_progress
    ADD CONSTRAINT study_progress_pkey PRIMARY KEY (id);


--
-- Name: study_task study_task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.study_task
    ADD CONSTRAINT study_task_pkey PRIMARY KEY (id);


--
-- Name: task_checkin task_checkin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_checkin
    ADD CONSTRAINT task_checkin_pkey PRIMARY KEY (id);


--
-- Name: teaching_link teaching_link_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teaching_link
    ADD CONSTRAINT teaching_link_pkey PRIMARY KEY (id);


--
-- Name: wrong_question wrong_question_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wrong_question
    ADD CONSTRAINT wrong_question_pkey PRIMARY KEY (id);


--
-- Name: idx_article_column; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_article_column ON public.article USING btree (column_type, _created_at);


--
-- Name: idx_auth_session_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_session_user ON public.auth_session USING btree (user_id);


--
-- Name: idx_checkin_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_student ON public.task_checkin USING btree (student_user_id, _created_at);


--
-- Name: idx_checkin_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_checkin_task ON public.task_checkin USING btree (task_id);


--
-- Name: idx_course_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_student ON public.course USING btree (student_user_id, start_at);


--
-- Name: idx_course_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_teacher ON public.course USING btree (teacher_user_id, start_at);


--
-- Name: idx_ledger_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ledger_student ON public.lesson_ledger USING btree (student_user_id, _created_at);


--
-- Name: idx_message_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_user ON public.notice_message USING btree (user_id, _created_at);


--
-- Name: idx_profile_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_family ON public.app_profile USING btree (family_id);


--
-- Name: idx_qb_kp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qb_kp ON public.question_bank USING btree (subject, knowledge_point);


--
-- Name: idx_task_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_student ON public.study_task USING btree (student_user_id, due_at);


--
-- Name: idx_task_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_teacher ON public.study_task USING btree (teacher_user_id, due_at);


--
-- Name: idx_wq_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wq_student ON public.wrong_question USING btree (student_user_id, _created_at);


--
-- Name: uk_app_profile_invite; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_app_profile_invite ON public.app_profile USING btree (invite_code);


--
-- Name: uk_app_profile_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_app_profile_user ON public.app_profile USING btree (user_id);


--
-- Name: uk_auth_credential_login; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_auth_credential_login ON public.auth_credential USING btree (login_name);


--
-- Name: uk_auth_credential_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_auth_credential_user ON public.auth_credential USING btree (user_id);


--
-- Name: uk_auth_session_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_auth_session_token ON public.auth_session USING btree (token_hash);


--
-- Name: uk_family_invite; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_family_invite ON public.family USING btree (invite_code);


--
-- Name: uk_favorite; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_favorite ON public.article_favorite USING btree (user_id, article_id);


--
-- Name: uk_guardian_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_guardian_pair ON public.guardian_link USING btree (parent_user_id, student_user_id);


--
-- Name: uk_lesson_account; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_lesson_account ON public.lesson_account USING btree (student_user_id, subject);


--
-- Name: uk_profile_openid; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_profile_openid ON public.app_profile USING btree (wechat_openid) WHERE (wechat_openid IS NOT NULL);


--
-- Name: uk_progress_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_progress_chapter ON public.study_progress USING btree (student_user_id, subject, chapter);


--
-- Name: uk_teaching_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_teaching_pair ON public.teaching_link USING btree (teacher_user_id, student_user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict xAC3E51xftn1ox8hjLYlwZo9A7UUuaJXFO3fd8SuQyqqwIUe0N74abBHkFbJ5Ob

