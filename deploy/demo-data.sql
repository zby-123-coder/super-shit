--
-- PostgreSQL database dump
--

\restrict 9nhOhoN26XcuJ6IOaIl6uy8MU9IDfSO8ppIWAQBiFk9YSoK3INiLaTIqFTVV7ST

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admission_major; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admission_major (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(128) NOT NULL,
    category character varying(64),
    required_subjects text[],
    optional_subjects text[],
    employment text[],
    intro text,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: admission_school; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admission_school (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(128) NOT NULL,
    city character varying(64),
    province character varying(64),
    level character varying(64),
    tags text[],
    intro text,
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: ai_message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_message (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    role character varying(16) NOT NULL,
    content text NOT NULL,
    stage_at_time character varying(32),
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


--
-- Name: ai_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_user_id character varying(64) NOT NULL,
    wrong_question_id uuid,
    persona_id character varying(32) DEFAULT 'guide'::character varying NOT NULL,
    stage character varying(32) DEFAULT 'understand'::character varying NOT NULL,
    status character varying(16) DEFAULT 'active'::character varying NOT NULL,
    topic character varying(255),
    _created_at timestamp with time zone DEFAULT now() NOT NULL,
    _created_by character varying(64),
    _updated_at timestamp with time zone DEFAULT now() NOT NULL,
    _updated_by character varying(64)
);


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
-- Name: education_kb; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.education_kb (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stage character varying(16) DEFAULT 'gaokao'::character varying NOT NULL,
    category character varying(32) DEFAULT 'faq'::character varying NOT NULL,
    region character varying(64) DEFAULT '全国'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    question text,
    content text NOT NULL,
    keywords text[],
    source character varying(255),
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
-- Name: student_insight; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_insight (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_user_id character varying(64) NOT NULL,
    level character varying(16) NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    signals jsonb DEFAULT '{}'::jsonb NOT NULL,
    headline character varying(500),
    evidence jsonb DEFAULT '[]'::jsonb NOT NULL,
    actions jsonb DEFAULT '[]'::jsonb NOT NULL,
    executed boolean DEFAULT false NOT NULL,
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
    _updated_by character varying(64),
    review_stage integer DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    next_review_at timestamp with time zone,
    last_review_at timestamp with time zone,
    review_task_id uuid
);


--
-- Data for Name: admission_major; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admission_major (id, name, category, required_subjects, optional_subjects, employment, intro, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
0b149a88-c339-4c10-b8c6-a97da83d67f6	计算机科学与技术	工学	{物理}	{化学,生物,地理}	{互联网研发,算法工程,系统架构}	研究计算理论与系统实现，核心课程含数据结构、操作系统、计算机网络。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
99682b17-de53-43b0-a54e-41854233d153	软件工程	工学	{物理}	{化学,地理}	{软件开发,测试与质量,技术管理}	偏工程实践，重视项目开发、软件设计与团队协作能力。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
77066a4e-a6d6-4be8-9832-e87e5f9f7e40	人工智能	工学	{物理}	{化学,生物}	{算法研发,机器学习工程,数据科学}	交叉学科，涉及机器学习、深度学习、计算机视觉与自然语言处理。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
91c060cf-668c-41f1-bd7d-a2dfe3700ec8	电子信息工程	工学	{物理}	{化学,地理}	{芯片与硬件,通信工程,嵌入式开发}	研究电子系统与信号处理，硬件与软件结合紧密。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
52fd84c8-8919-4d20-b10d-ec30d9f8c257	临床医学	医学	{物理,化学}	{生物}	{临床医师,医学研究,公共卫生}	学制长、培养严格，需完成规培；对生物化学基础要求高。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
b3ec507d-0957-4e5c-b7d9-17561b9c1b0c	法学	法学	{}	{政治,历史,地理}	{律师,法务,公检法}	重视逻辑与表达，需通过法律职业资格考试；院校地域影响实习资源。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
582a10a8-0d83-438e-8465-4f35fe4c616b	金融学	经济学	{}	{政治,地理}	{银行证券,投研分析,企业财务}	数学与英语要求较高，名校与实习经历对就业影响明显。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
136378af-38ca-4956-a035-da52e0ceeb2d	会计学	管理学	{}	{政治,地理}	{审计,企业财务,税务咨询}	实务导向，CPA 等证书对职业发展帮助大。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
39c2fc68-b21a-473e-8913-c0cbedb976e5	汉语言文学	文学	{}	{历史,政治,地理}	{教育,出版传媒,公务文职}	重视阅读写作积累，师范方向需额外考取教师资格。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
1b1393af-f484-4986-8770-3cd7e5c610a1	新闻传播学	文学	{}	{政治,历史}	{媒体内容,品牌公关,新媒体运营}	实践性强，作品集与实习经历比单纯绩点更重要。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
dc96c21d-0b4d-4a47-815b-e04ffb98031a	机械工程	工学	{物理}	{化学,地理}	{装备制造,汽车工程,智能制造}	传统工科，涉及机械设计、制造工艺与自动化。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
92f63fcb-e457-4299-b568-7392ca1796db	数学与应用数学	理学	{物理}	{化学,生物}	{数据分析,算法研究,教育科研}	基础学科，转金融、计算机、AI 方向的研究生路径通畅。	2026-10-21 11:59:06.093884+08	\N	2026-10-21 11:59:06.093884+08	\N
\.


--
-- Data for Name: admission_school; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admission_school (id, name, city, province, level, tags, intro, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
927dc053-6d15-455e-b296-22947f79d9f6	浙江大学	杭州	浙江	本科·双一流	{985,211,综合类}	教育部直属综合性全国重点大学，学科覆盖广，工科与农学优势明显。	2026-10-21 11:59:06.090998+08	\N	2026-10-21 11:59:06.090998+08	\N
414f1c0a-970d-4324-b5a1-1675285cc13f	复旦大学	上海	上海	本科·双一流	{985,211,综合类}	教育部直属，文理医并重，新闻传播、经济学、临床医学声誉突出。	2026-10-21 11:59:06.090998+08	\N	2026-10-21 11:59:06.090998+08	\N
3f886887-4d6c-433c-8f2f-ae1b84dfbf36	上海交通大学	上海	上海	本科·双一流	{985,211,综合类}	工科与医学强势，船舶、机械、电子信息、临床医学为传统优势学科。	2026-10-21 11:59:06.090998+08	\N	2026-10-21 11:59:06.090998+08	\N
36a0f4ff-6538-4644-b101-f5b930916e55	南京大学	南京	江苏	本科·双一流	{985,211,综合类}	基础学科见长，物理、化学、天文、中文、计算机均有长期积累。	2026-10-21 11:59:06.090998+08	\N	2026-10-21 11:59:06.090998+08	\N
9b224bfa-4fd0-4ffd-aed7-2304c2e90dd3	中国科学技术大学	合肥	安徽	本科·双一流	{985,211,理工类}	以基础科学和高新技术为主，物理、数学、计算机方向培养严格。	2026-10-21 11:59:06.090998+08	\N	2026-10-21 11:59:06.090998+08	\N
5ef63f00-6525-4979-bd58-85c253797da6	杭州电子科技大学	杭州	浙江	本科	{省属,理工类}	电子信息特色鲜明，计算机、电子、通信、会计在省内就业认可度高。	2026-10-21 11:59:06.090998+08	\N	2026-10-21 11:59:06.090998+08	\N
345efe95-c091-48a2-a447-c7047bfc09a0	浙江工业大学	杭州	浙江	本科	{省属,理工类}	省属重点，化工、机械、材料、计算机等工科专业实力较强。	2026-10-21 11:59:06.090998+08	\N	2026-10-21 11:59:06.090998+08	\N
b2978cf4-1daf-4f9e-8211-0049594182e3	宁波大学	宁波	浙江	本科·双一流	{省属,综合类}	综合性省属重点，力学入选双一流建设学科，海洋与师范方向有特色。	2026-10-21 11:59:06.090998+08	\N	2026-10-21 11:59:06.090998+08	\N
\.


--
-- Data for Name: ai_message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_message (id, session_id, role, content, stage_at_time, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
9abcdb43-92ea-48c6-843b-7ff2b066f33f	18ce465c-2462-4d4c-b482-9bcc14ca9f97	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 11:34:44.343169+08	\N	2026-10-21 11:34:44.343169+08	\N
48f0417a-96ed-464f-9dca-14de3d163c57	4ff112de-ebcf-4dfe-b4c2-ce0baccc9b96	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 11:37:48.462743+08	\N	2026-10-21 11:37:48.462743+08	\N
a7071984-752e-4dd3-a682-16951c431ea7	4ff112de-ebcf-4dfe-b4c2-ce0baccc9b96	user	我不太会配方，看到二次函数就慌	understand	2026-10-21 11:37:48.49923+08	\N	2026-10-21 11:37:48.49923+08	\N
22757260-fe59-4384-a574-3392431686b4	4ff112de-ebcf-4dfe-b4c2-ce0baccc9b96	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 11:37:48.500535+08	\N	2026-10-21 11:37:48.500535+08	\N
44faac3a-75d3-411e-b23b-ff5e16c6aa57	4ff112de-ebcf-4dfe-b4c2-ce0baccc9b96	user	我试试先把 x²-4x 配方	understand	2026-10-21 11:37:48.551349+08	\N	2026-10-21 11:37:48.551349+08	\N
5623473b-1e34-4bf1-8a2a-b42bc63561c0	4ff112de-ebcf-4dfe-b4c2-ce0baccc9b96	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 11:37:48.553522+08	\N	2026-10-21 11:37:48.553522+08	\N
8997ae67-cb85-4dc4-b389-39c6a667a84c	44225279-df7f-40c3-bb4e-cf8c3a98a123	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 11:38:41.415551+08	\N	2026-10-21 11:38:41.415551+08	\N
06800641-09ea-48d2-bf0f-32952bba4ed9	44225279-df7f-40c3-bb4e-cf8c3a98a123	user	我的思路是第 1 步	understand	2026-10-21 11:38:41.44723+08	\N	2026-10-21 11:38:41.44723+08	\N
b02c0bb1-93ff-4a23-9a6c-93a0f4deb265	44225279-df7f-40c3-bb4e-cf8c3a98a123	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 11:38:41.448436+08	\N	2026-10-21 11:38:41.448436+08	\N
3a93dd37-fa25-42a5-a667-24c92bdae1d8	44225279-df7f-40c3-bb4e-cf8c3a98a123	user	我的思路是第 2 步	understand	2026-10-21 11:38:41.605761+08	\N	2026-10-21 11:38:41.605761+08	\N
eeeff58b-d377-47d3-b694-62e6338da361	44225279-df7f-40c3-bb4e-cf8c3a98a123	assistant	给你一个提示：先找出题目里的关键条件，看看它们能组成什么关系。你试试看这一步。	guide	2026-10-21 11:38:41.606859+08	\N	2026-10-21 11:38:41.606859+08	\N
6ac358ce-6deb-44e9-b03e-fe1f4a119efc	44225279-df7f-40c3-bb4e-cf8c3a98a123	user	我的思路是第 3 步	guide	2026-10-21 11:38:41.668112+08	\N	2026-10-21 11:38:41.668112+08	\N
89ea6523-6df6-42a1-bb15-7b984e218a7b	44225279-df7f-40c3-bb4e-cf8c3a98a123	assistant	你刚才那一步是对的。回想一下，这类题的关键是什么？说出来比算出来更重要。	consolidate	2026-10-21 11:38:41.669116+08	\N	2026-10-21 11:38:41.669116+08	\N
eb9784e9-f49a-4b60-89d3-47d4480a53df	73614043-fdab-4acd-86a0-1737b7794662	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 12:03:27.773461+08	\N	2026-10-21 12:03:27.773461+08	\N
243ad94a-b987-483c-89f4-12c9886d263e	73614043-fdab-4acd-86a0-1737b7794662	user	我卡在第一步	understand	2026-10-21 12:03:27.819832+08	\N	2026-10-21 12:03:27.819832+08	\N
cca0b9e9-dd02-4ac4-bd1b-39578799bbd9	73614043-fdab-4acd-86a0-1737b7794662	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 12:03:27.821593+08	\N	2026-10-21 12:03:27.821593+08	\N
08e6ed42-3033-4a6f-94e7-eff2fb3ed4bc	0c1c9413-f7ee-4f0f-878b-dc5f49fb2a68	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 17:48:15.893503+08	\N	2026-10-21 17:48:15.893503+08	\N
f6d3ed01-8ba7-49e7-9b22-eb11dccecf96	0c1c9413-f7ee-4f0f-878b-dc5f49fb2a68	user	我卡在第一步	understand	2026-10-21 17:48:15.986127+08	\N	2026-10-21 17:48:15.986127+08	\N
beec242d-2852-4f30-99ba-aca7507106b5	0c1c9413-f7ee-4f0f-878b-dc5f49fb2a68	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 17:48:15.987775+08	\N	2026-10-21 17:48:15.987775+08	\N
ae073aa5-7bd1-4c9e-841c-638f71221fea	29de9574-af85-4d9f-8e4a-8aa2c060f979	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 17:48:58.973396+08	\N	2026-10-21 17:48:58.973396+08	\N
5c337034-5036-4b7a-8a0e-d2fff64f2518	29de9574-af85-4d9f-8e4a-8aa2c060f979	user	我卡在第一步	understand	2026-10-21 17:48:59.085797+08	\N	2026-10-21 17:48:59.085797+08	\N
5bd92c01-efa2-4227-b809-3c725c94d6b1	29de9574-af85-4d9f-8e4a-8aa2c060f979	assistant	我们先不急着算。你能说说，这道题让你卡住的是哪一步吗？是读不懂题意，还是不知道怎么下手？	understand	2026-10-21 17:48:59.087427+08	\N	2026-10-21 17:48:59.087427+08	\N
0783050d-8958-4739-9928-1f624ad05281	a2b413f4-ac9d-458c-bef6-c96234583ec4	assistant	你好小赵，我是小引。听说你有道题卡住了，我们一起拆拆看。你现在是读题时没看懂意思，还是知道要考什么但想不出方法？	understand	2026-10-21 18:15:25.648193+08	\N	2026-10-21 18:15:25.648193+08	\N
cc899c87-3561-4174-a39c-cc2769cde69c	f808bd7f-55af-47da-be3f-995df6e0e2eb	assistant	小赵你好，我是小引。今天想先听听你的情况：你手上这道题，现在是读题时理不清条件，还是知道思路但算不下去？	understand	2026-10-21 18:15:54.877749+08	\N	2026-10-21 18:15:54.877749+08	\N
87bd3cdf-4b35-4b66-ba5f-c5da9f3a75b1	f808bd7f-55af-47da-be3f-995df6e0e2eb	user	老师我不懂，韦达定理是啥？考试老用它	understand	2026-10-21 18:15:54.889389+08	\N	2026-10-21 18:15:54.889389+08	\N
5dae1724-95e3-44f9-951b-8766ecaa6b75	f808bd7f-55af-47da-be3f-995df6e0e2eb	assistant	好问题，这个概念考试确实常考。咱们用个具体方程自己发现它：x²-5x+6=0，它的两根是2和3。\n\n你先算算：两根之和、两根之积分别是多少？再看看和方程里的-5、6有什么关系？	understand	2026-10-21 18:15:57.057725+08	\N	2026-10-21 18:15:57.057725+08	\N
e2e0e1f8-b060-4b55-ad97-ed3d5bcb3dc1	f808bd7f-55af-47da-be3f-995df6e0e2eb	user	所以 x1+x2 就是 5？	understand	2026-10-21 18:15:57.071782+08	\N	2026-10-21 18:15:57.071782+08	\N
7903c9f7-a897-4d19-9ead-6cece186d346	f808bd7f-55af-47da-be3f-995df6e0e2eb	assistant	对，2+3=5，算得没错。\n\n接下来是最关键的一步：方程里 x 的系数是 -5，而你算出的和是 5。你觉得这个 5 和 -5 之间，差的是哪个符号或哪一步运算？	understand	2026-10-21 18:15:58.232181+08	\N	2026-10-21 18:15:58.232181+08	\N
7420d60f-3900-4e62-a684-426dc68cb9c7	f808bd7f-55af-47da-be3f-995df6e0e2eb	user	懂了！那两根之积就是 6 对吧？	understand	2026-10-21 18:15:58.244439+08	\N	2026-10-21 18:15:58.244439+08	\N
1fe78042-3856-4ea2-b0dd-cf01d2ce13a9	f808bd7f-55af-47da-be3f-995df6e0e2eb	assistant	对，2×3=6，和常数项 6 完全一样。\n\n那现在把两个发现放一起：和是 5，对应系数 -5；积是 6，对应常数项 6。你能试着说说，一般的 x²+bx+c=0，两根之和、两根之积分别等于什么？	understand	2026-10-21 18:15:59.365871+08	\N	2026-10-21 18:15:59.365871+08	\N
cc97c12e-8b1f-40a6-a1f0-05e315958cc0	c192f534-0825-4148-8df1-80ec04cd7f5c	assistant	小赵，今天想啃哪道题？先跟我说说：你是读题时就没太明白题意，还是读完知道要考什么、但想不到下一步怎么下手？	understand	2026-10-21 18:16:12.774116+08	\N	2026-10-21 18:16:12.774116+08	\N
5cc7c039-960c-48f4-95a0-38c5aa6ff7b7	c192f534-0825-4148-8df1-80ec04cd7f5c	user	老师我不懂，韦达定理是啥？考试老用它	understand	2026-10-21 18:16:12.790362+08	\N	2026-10-21 18:16:12.790362+08	\N
ef4c877d-e8c0-466a-af60-e00ce4aee165	c192f534-0825-4148-8df1-80ec04cd7f5c	assistant	韦达定理说白了就是"两根之和、两根之积"跟系数的关系，一用就省事。先不背它，咱自己发现：x²−5x+6=0 你能求出两个根吗？求出来咱再看这俩数和系数有啥规律。	understand	2026-10-21 18:16:15.031355+08	\N	2026-10-21 18:16:15.031355+08	\N
5357d515-a1a7-4e3e-ba74-692c0fc3fd78	c192f534-0825-4148-8df1-80ec04cd7f5c	user	所以 x1+x2 就是 5？	understand	2026-10-21 18:16:15.039725+08	\N	2026-10-21 18:16:15.039725+08	\N
b21602c6-7a1d-4e74-93ef-23c82c27235d	c192f534-0825-4148-8df1-80ec04cd7f5c	assistant	对，2+3=5，这一步没错。那再看看方程的系数：x²−5x+6 里，-5 就是 x 的系数，6 是常数项。你猜 x1·x2 会等于哪个数？跟系数对一对看。	understand	2026-10-21 18:16:16.37389+08	\N	2026-10-21 18:16:16.37389+08	\N
24e2b4ca-1368-4171-867f-441fc75f22fe	c192f534-0825-4148-8df1-80ec04cd7f5c	user	懂了！那两根之积就是 6 对吧？	understand	2026-10-21 18:16:16.383019+08	\N	2026-10-21 18:16:16.383019+08	\N
0e6bdd47-40bc-47e1-afb7-d39077c446a3	c192f534-0825-4148-8df1-80ec04cd7f5c	assistant	对，2×3=6，正好是常数项。你已经把规律摸出来了。那把它推到一般方程 ax²+bx+c=0，你猜 x1+x2 和 x1·x2 该用 a、b、c 怎么表示？试试看。	understand	2026-10-21 18:16:17.896357+08	\N	2026-10-21 18:16:17.896357+08	\N
65ef738a-5c86-4fea-8947-3a913c234986	324ca7e8-cda5-4614-90c4-45346655f1df	assistant	小满你好呀，我是小引。今天想一起搞定哪道题？你先说说卡在哪儿——是题目读不明白，还是知道要算什么但想不到方法？	understand	2026-10-21 18:17:21.734303+08	\N	2026-10-21 18:17:21.734303+08	\N
fc78ee7b-32d4-4b95-a257-512fb67353e2	324ca7e8-cda5-4614-90c4-45346655f1df	user	我卡在第一步	understand	2026-10-21 18:17:21.851556+08	\N	2026-10-21 18:17:21.851556+08	\N
2bc542a0-cf41-4b90-aad5-a4ac0003abbf	324ca7e8-cda5-4614-90c4-45346655f1df	assistant	好的，愿意从第一步开始拆，这个思路很对。先让我看到题：你把题目发给我，再说说"第一步"你本来打算做什么，我看看能不能帮你找到入口。	understand	2026-10-21 18:17:23.454485+08	\N	2026-10-21 18:17:23.454485+08	\N
c299ca21-2015-4633-8a07-b4583b10e4a5	d57fb2b1-deda-4c16-8fbd-c1447df04386	assistant	小满你好，我是小引。今天想一起看哪道题？你先说说，读完题之后卡在哪个地方了——是没看懂题意、想不到用哪个方法，还是算到一半卡住了？	understand	2026-10-21 18:21:37.081624+08	\N	2026-10-21 18:21:37.081624+08	\N
9fe040da-4469-4b56-bf48-aefc420a248e	d57fb2b1-deda-4c16-8fbd-c1447df04386	user	我卡在第一步	understand	2026-10-21 18:21:37.324212+08	\N	2026-10-21 18:21:37.324212+08	\N
36a3bfe9-7e30-4740-b083-fb9de9c6f9f6	d57fb2b1-deda-4c16-8fbd-c1447df04386	assistant	好，能说清卡在第一步，这本身就是个不错的开始。那我们先把题摆出来——你能把题目内容说给我听吗？或者告诉我第一步你想做什么、为什么觉得做不下去。	understand	2026-10-21 18:21:38.645155+08	\N	2026-10-21 18:21:38.645155+08	\N
\.


--
-- Data for Name: ai_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_session (id, student_user_id, wrong_question_id, persona_id, stage, status, topic, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
18ce465c-2462-4d4c-b482-9bcc14ca9f97	u_f54e97f52836855b	\N	guide	understand	active	学习引导	2026-10-21 11:34:44.340687+08	\N	2026-10-21 11:34:44.340687+08	\N
4ff112de-ebcf-4dfe-b4c2-ce0baccc9b96	u_f54e97f52836855b	\N	guide	understand	active	学习引导	2026-10-21 11:37:48.461561+08	\N	2026-10-21 11:37:48.461561+08	\N
44225279-df7f-40c3-bb4e-cf8c3a98a123	u_f54e97f52836855b	\N	guide	consolidate	active	学习引导	2026-10-21 11:38:41.413706+08	\N	2026-10-21 11:38:41.413706+08	\N
73614043-fdab-4acd-86a0-1737b7794662	u_f54e97f52836855b	\N	guide	understand	active	学习引导	2026-10-21 12:03:27.771822+08	\N	2026-10-21 12:03:27.771822+08	\N
0c1c9413-f7ee-4f0f-878b-dc5f49fb2a68	u_f54e97f52836855b	\N	guide	understand	active	学习引导	2026-10-21 17:48:15.89078+08	\N	2026-10-21 17:48:15.89078+08	\N
29de9574-af85-4d9f-8e4a-8aa2c060f979	u_f54e97f52836855b	\N	guide	understand	active	学习引导	2026-10-21 17:48:58.971439+08	\N	2026-10-21 17:48:58.971439+08	\N
a2b413f4-ac9d-458c-bef6-c96234583ec4	u_6e32fb7c7f2b7fed	\N	guide	understand	active	学习引导	2026-10-21 18:15:24.584587+08	\N	2026-10-21 18:15:24.584587+08	\N
f808bd7f-55af-47da-be3f-995df6e0e2eb	u_6e32fb7c7f2b7fed	\N	guide	understand	active	学习引导	2026-10-21 18:15:54.004244+08	\N	2026-10-21 18:15:54.004244+08	\N
c192f534-0825-4148-8df1-80ec04cd7f5c	u_6e32fb7c7f2b7fed	\N	guide	understand	active	学习引导	2026-10-21 18:16:11.857336+08	\N	2026-10-21 18:16:11.857336+08	\N
324ca7e8-cda5-4614-90c4-45346655f1df	u_f54e97f52836855b	\N	guide	understand	active	学习引导	2026-10-21 18:17:20.899455+08	\N	2026-10-21 18:17:20.899455+08	\N
d57fb2b1-deda-4c16-8fbd-c1447df04386	u_f54e97f52836855b	\N	guide	understand	active	学习引导	2026-10-21 18:21:36.018794+08	\N	2026-10-21 18:21:36.018794+08	\N
\.


--
-- Data for Name: app_profile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_profile (id, user_id, role, name, phone, grade, subject_tags, avatar_url, invite_code, _created_at, _created_by, _updated_at, _updated_by, notify_mute, family_id, wechat_openid) FROM stdin;
b9d1a4de-39d0-4894-a75b-031a5910eee4	u_6e32fb7c7f2b7fed	admin	运营小赵	\N	\N	\N	\N	5D36AB	2026-10-13 15:07:39.49148+08	\N	2026-10-13 15:07:39.49148+08	\N	f	\N	\N
c9621553-61a9-4b54-a439-2b86cc24cc43	u_040f0825984aaec7	parent	林爸	\N	\N	\N	\N	9B8E55	2026-10-13 15:07:39.578582+08	\N	2026-10-13 15:07:39.578582+08	\N	f	d6330b7e-3d8c-423e-99d4-f264491b866d	\N
c1f42873-488b-4a8a-98e5-ef2c40efd7bd	u_747d2315fab64522	student	林小满	\N	初二	\N	\N	DXNKN2	2026-10-13 15:07:39.797376+08	\N	2026-10-13 15:07:39.797376+08	\N	f	d6330b7e-3d8c-423e-99d4-f264491b866d	\N
a8822bb5-c2ae-48e3-8e13-fb168592b349	u_df4fc0f2b5018074	parent	林妈	\N	\N	\N	\N	0D2286	2026-10-13 15:07:40.01727+08	\N	2026-10-13 15:07:40.01727+08	\N	f	d6330b7e-3d8c-423e-99d4-f264491b866d	\N
d8610c32-e64f-4ac0-b9dc-6254ffe05b66	u_63838e8eca74d816	teacher	周老师	\N	\N	\N	\N	0C6E3F	2026-10-13 15:07:40.260554+08	\N	2026-10-13 15:07:40.260554+08	\N	f	\N	\N
3c73e158-1b93-419d-8634-a0a2907fc647	u_d21e2a16db0d6ad8	teacher	陈老师	\N	\N	\N	\N	511DAC	2026-10-13 15:07:40.779421+08	\N	2026-10-13 15:07:40.779421+08	\N	f	\N	\N
7b4baa5e-b030-4236-942e-c20c926b5f34	u_f54e97f52836855b	student	林小满	\N	\N	\N	\N	6F6058	2026-10-13 21:54:58.353187+08	\N	2026-10-13 21:54:58.353187+08	\N	f	d6330b7e-3d8c-423e-99d4-f264491b866d	\N
\.


--
-- Data for Name: article; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.article (id, title, column_type, cover_url, summary, content, status, pinned, read_count, author_user_id, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
d2747667-fd9a-418e-a11c-1865d5af12e6	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 15:25:12.036219+08	\N	2026-10-12 15:25:12.036219+08	\N
7def1467-6278-46e3-824d-81f8aa4e1afc	联调测试案例	case	\N	s	c	published	f	2	u_f514226f1cf2533e	2026-10-12 15:28:52.172254+08	\N	2026-10-12 15:28:52.172254+08	\N
1cb07d78-3ae5-4386-828f-1d0a9c5b6bab	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 16:06:11.735933+08	\N	2026-10-12 16:06:11.735933+08	\N
60445894-8b16-4728-ba40-70351de20229	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 16:06:12.724516+08	\N	2026-10-12 16:06:12.724516+08	\N
f46a7e38-2c4f-406d-b992-2184fa925e7b	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 16:26:04.006327+08	\N	2026-10-12 16:26:04.006327+08	\N
d8d255b7-9bb6-4687-a76e-240bba4a6e26	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 16:51:37.604692+08	\N	2026-10-12 16:51:37.604692+08	\N
0640f913-812a-4f83-b483-38fd20258c94	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 17:00:15.310191+08	\N	2026-10-12 17:00:15.310191+08	\N
2b9a0c60-60e1-4e8f-8af2-0e24b21ae59b	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 17:06:12.055933+08	\N	2026-10-12 17:06:12.055933+08	\N
78ba5c12-dd6f-4f16-b45d-9e040d6efbdd	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 17:14:48.848537+08	\N	2026-10-12 17:14:48.848537+08	\N
858e01fa-dfa1-424b-9a88-792c94eeb488	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 17:19:09.720643+08	\N	2026-10-12 17:19:09.720643+08	\N
18c673b7-92c8-4f6d-9422-bfe2598d70a6	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 17:34:48.18978+08	\N	2026-10-12 17:34:48.18978+08	\N
bbad6c5b-1acd-438c-9e92-e4cb4d00071b	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 17:35:24.490211+08	\N	2026-10-12 17:35:24.490211+08	\N
b5fa47b9-869e-48a6-8da2-d1434ed1ce31	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 17:36:48.931458+08	\N	2026-10-12 17:36:48.931458+08	\N
fa276e67-8722-4c0b-a0dd-af6a5e01763f	联调测试案例	case	\N	s	c	published	f	0	u_f514226f1cf2533e	2026-10-12 18:02:23.759876+08	\N	2026-10-12 18:02:23.759876+08	\N
51609de2-7f14-4ae7-9382-0ba738a75740	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-13 21:54:59.356812+08	\N	2026-10-13 21:54:59.356812+08	\N
b0807dba-1895-4ccd-ab63-5300ef8e7cf5	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-13 22:00:48.269065+08	\N	2026-10-13 22:00:48.269065+08	\N
520246dc-5f38-428e-91d0-f5640927b5b2	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-13 22:01:49.078241+08	\N	2026-10-13 22:01:49.078241+08	\N
fe2e2418-766b-4dac-b75c-1350bce13016	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-13 22:02:18.022867+08	\N	2026-10-13 22:02:18.022867+08	\N
92e00724-46d9-41bc-98ff-00a4457ca424	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-13 22:02:36.148767+08	\N	2026-10-13 22:02:36.148767+08	\N
662770d1-887b-4f1f-a099-47e40b862e9a	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-13 22:32:30.750975+08	\N	2026-10-13 22:32:30.750975+08	\N
4bbfac74-8b39-4c3b-adb3-725a7b030d8e	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-17 16:31:40.206977+08	\N	2026-10-17 16:31:40.206977+08	\N
6c7c425e-c848-4503-82ed-0df440c7d6dd	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-17 16:31:53.79038+08	\N	2026-10-17 16:31:53.79038+08	\N
df8dd973-ab08-4bb6-8d1f-397b40bdd53d	初二数学重要信息	case	\N	素材摘要：本市中考数学新增动态几何题型占比提升	【信息摘要】素材摘要：本市中考数学新增动态几何题型占比提升\n\n【moments】\n杭州初二数学家长关注：本市中考数学新增动态几何题型占比提升 看懂这一条，少走半年弯路。详情私聊。\n【official】\n正文引导：本市中考数学新增动态几何题型占比提升\n\n本文为杭州初二数学家长解读相关政策与学习建议，文末可加学情诊断入口。	draft	f	0	\N	2026-10-17 17:23:53.142834+08	\N	2026-10-17 17:23:53.142834+08	\N
bd03bd85-9e79-48ec-913c-a773d41fe0ba	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-17 17:24:23.127441+08	\N	2026-10-17 17:24:23.127441+08	\N
30c47c29-15bb-4605-b4d5-6fb2bab1d7e8	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-17 17:24:43.353102+08	\N	2026-10-17 17:24:43.353102+08	\N
bd4d71e8-c8f4-4a22-b5d7-6e26a728588b	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-19 11:39:24.058011+08	\N	2026-10-19 11:39:24.058011+08	\N
84b6a717-56be-4c22-b432-9a9c93acb7d1	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-19 11:39:42.538064+08	\N	2026-10-19 11:39:42.538064+08	\N
7c584c0e-da98-4786-99d4-0157af5897f2	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-21 12:03:27.469568+08	\N	2026-10-21 12:03:27.469568+08	\N
54ae3c2d-4a58-4f69-9159-f731ec75f95e	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-21 17:48:15.358242+08	\N	2026-10-21 17:48:15.358242+08	\N
79d518a1-6a58-4a7d-90a8-4b7cd32ac7d8	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-21 17:48:58.488931+08	\N	2026-10-21 17:48:58.488931+08	\N
204bb775-25be-4995-b92d-dbf09ad2a0c3	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-21 18:17:01.720259+08	\N	2026-10-21 18:17:01.720259+08	\N
9d39a215-ee6f-423c-b5bc-e1a84e2e9df2	联调测试案例	case	\N	s	c	published	f	0	u_6e32fb7c7f2b7fed	2026-10-21 18:21:14.246024+08	\N	2026-10-21 18:21:14.246024+08	\N
\.


--
-- Data for Name: article_favorite; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.article_favorite (id, user_id, article_id, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
\.


--
-- Data for Name: auth_credential; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_credential (id, user_id, login_name, password_hash, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
5a8a6b1c-2601-4c0f-998a-4755eaa96fc1	u_6e32fb7c7f2b7fed	admin001	1a4ff25746f73cf1a4dc33b53c3cd949:31bda710167a6969d698375c57e365270f86b695533772a3c03b9842893bdb4d60d7899bdc42e03b13d5962bb50a522bf05da80d7212581aa15905dc7a50a95c	2026-10-13 15:07:39.545984+08	\N	2026-10-13 15:07:39.545984+08	\N
1aaa14e7-a743-41eb-b144-dc01953d823d	u_040f0825984aaec7	parent001	8a516c2df75164d94aa4f3e994d48998:4924008e164c08d2de18658175d59b208b319b2f41fb9779ca637d0fae4a423e477afe18a83fbf12f0738ac5b72d22f109ccea0901067d7e923911b8f7db772a	2026-10-13 15:07:39.631263+08	\N	2026-10-13 15:07:39.631263+08	\N
05ebeb21-6b0c-4eaf-b654-33ab3456e67e	u_747d2315fab64522	child001	d0d3b7800dfe268a647d2fc50bc0e3b6:39396405b1083518c21e1e8b3a99bff157be0f65430fbe65d7235af55e1fce834ade1a1a06c3c4ab029d4a2aff31638e5cfd73d3d15bb1194382cf23023bb72e	2026-10-13 15:07:39.850654+08	\N	2026-10-13 15:07:39.850654+08	\N
91f8b465-70ea-4d55-9524-87216664d075	u_df4fc0f2b5018074	parent002	90f5610ef87d32eb35fcd82b271033b3:91b9c3583693d35786aee033aa3258504ecd1a1c0a18607876817f43c203becde58eb7bade0ac965a914f0141b885a4788836851c9049ca07766a876ddec9d51	2026-10-13 15:07:40.069057+08	\N	2026-10-13 15:07:40.069057+08	\N
71a5a1ab-8eac-4961-abd1-1b897f2d7227	u_63838e8eca74d816	teacher001	6eeb4f56b8a5d360d92068c0208b578b:35db825416d56e3cdfe187e1af1d7d984f3d2c9b7faf57a754401f0b9fc32158a4374bc08f55fb7df23ff52e714c97a7d0b4e30a94cd423980f83b3639307a85	2026-10-13 15:07:40.313185+08	\N	2026-10-13 15:07:40.313185+08	\N
a3acee26-f811-4f8b-9167-753be5730a39	u_d21e2a16db0d6ad8	teacher002	54f1df246704e51e0e02a480d6115e8e:327da41cf78692324ee5abe85f7f362d1c814b862ffb641d2cff3da8956dc54de5a33afb99a28ef9cb3233e9ff6508fd29c4d7d32a33005b64f632edb14aa4df	2026-10-13 15:07:40.832026+08	\N	2026-10-13 15:07:40.832026+08	\N
e50c04b2-bf4f-47d5-a5dc-62dc4b36ae9d	u_f54e97f52836855b	student001	77fef1bf4f7ad5c26a0ac6e457fc90f3:239eb2effe5b227ff5378b4791d747e33ce1a528dfda51870c44e59f6be2710c458dd8ad846adc51e99370d2e16f095f2f7e95e7f4936027cc585bedbad89500	2026-10-13 21:54:58.40576+08	\N	2026-10-13 21:54:58.40576+08	\N
\.


--
-- Data for Name: auth_session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_session (id, user_id, token_hash, device_label, expires_at, revoked_at, last_used_at, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
07bbc282-b2f2-4b7f-891c-b423bd3c95de	u_63838e8eca74d816	863a77fb0e3215791961df8d923df8b49e46c2ead31185c9dba1abeba7cc138e	teacher	2026-11-12 22:02:15.817+08	\N	2026-10-13 22:02:18.115+08	2026-10-13 22:02:15.818171+08	\N	2026-10-13 22:02:15.818171+08	\N
496f8491-78df-434f-9dc6-85dc899f917c	u_040f0825984aaec7	139af0a400ae1b13e8dee2c5b82b704f2b990f7fa4c79c2fce85f3c1aca67ec5	parent	2026-11-12 22:01:48.194+08	\N	2026-10-13 22:01:48.904+08	2026-10-13 22:01:48.194447+08	\N	2026-10-13 22:01:48.194447+08	\N
a05750ab-46a1-40e7-a478-9554efada65b	u_040f0825984aaec7	c77d77042615f84d0ce0df0548cbf40691dbc096e208de1782fe7557d565c706	parent	2026-11-12 22:02:16.129+08	\N	2026-10-13 22:02:17.689+08	2026-10-13 22:02:16.129598+08	\N	2026-10-13 22:02:16.129598+08	\N
2a4182d2-237c-4434-be81-3b57645c9e9f	u_f54e97f52836855b	8d1dc58948d958af51f67ef006f27d91cba9b271c7c37ed08c8f8aecd4be5ce7	student	2026-11-12 22:02:16.345+08	\N	2026-10-13 22:02:18.146+08	2026-10-13 22:02:16.345765+08	\N	2026-10-13 22:02:16.345765+08	\N
d4f09f4e-a1ba-4a37-80ad-153a4d7d2dfc	u_040f0825984aaec7	208833f53affb510390a55db84e05b0d6c76cd3f148e7d6de9fae7911adc1a19	parent	2026-11-12 21:54:58.263+08	\N	2026-10-13 21:54:59.099+08	2026-10-13 21:54:58.264212+08	\N	2026-10-13 21:54:58.264212+08	\N
959021f0-5c87-4db1-8032-635fc16b4eb5	u_d21e2a16db0d6ad8	26d5fb4b68910d8f0c7f1817ffecab582bc21978b344da3b7f7fbad5dfc2a255	teacher	2026-11-12 21:54:58.108+08	\N	2026-10-13 21:54:59.185+08	2026-10-13 21:54:58.108531+08	\N	2026-10-13 21:54:58.108531+08	\N
c2dbac97-4028-43f9-8699-0d9852083ac1	u_63838e8eca74d816	4ca1f68c43611ea368478269441b286be4802cc80b5a7a805534fafeb4e7aef8	teacher	2026-11-12 22:11:01.727+08	\N	2026-10-13 22:11:01.748+08	2026-10-13 22:11:01.727508+08	\N	2026-10-13 22:11:01.727508+08	\N
42ead55a-5897-458c-a4f8-f1d6052fc8af	u_6e32fb7c7f2b7fed	fb96a3b31a431b68d482057253c32a7978f1cccad55739c20d1cd7d206e5a483	admin	2026-11-12 15:07:39.548+08	\N	2026-10-13 15:07:40.476+08	2026-10-13 15:07:39.548259+08	\N	2026-10-13 15:07:39.548259+08	\N
007f12a0-a3ca-4f12-8b13-4f8f22a27166	u_6e32fb7c7f2b7fed	7ea53ce99172dd8f2f7aa54be607d9cab248605530cca115a566cc2b616f6cef	admin	2026-11-12 21:54:57.788+08	\N	2026-10-13 21:54:59.353+08	2026-10-13 21:54:57.788322+08	\N	2026-10-13 21:54:57.788322+08	\N
c8d53fc1-857f-41a7-81c1-dbc32b04ba69	u_747d2315fab64522	4cdfaa63cae162dcc3544859e339f9b89f03bdae559c3b0d770ea7fcfd9c383c	student	2026-11-12 15:07:39.922+08	\N	2026-10-13 15:07:40.553+08	2026-10-13 15:07:39.923053+08	\N	2026-10-13 15:07:39.923053+08	\N
666629a6-80cb-4084-82c1-7185573a4bdd	u_63838e8eca74d816	52858e03501b35c4c04771324569a9382cea946a3df95e5bd5cc175d36ddb04a	teacher	2026-11-12 21:54:57.955+08	\N	2026-10-13 21:54:59.392+08	2026-10-13 21:54:57.955488+08	\N	2026-10-13 21:54:57.955488+08	\N
310d6198-b0b3-4427-98c3-1a86cc6a84c3	u_63838e8eca74d816	474d48ae86403ea41d8b601d6e328f4190904ac31b58b5fc2db7481f2ef8f157	teacher	2026-11-12 15:07:40.314+08	\N	2026-10-13 15:07:40.654+08	2026-10-13 15:07:40.314808+08	\N	2026-10-13 15:07:40.314808+08	\N
4076851d-01b0-4226-89d4-3600ee170238	u_f54e97f52836855b	99b40fac067e4cb1609ed6fbc7a255ea8dd4299655b81684a99b8ba079ced2cd	student	2026-11-12 21:54:58.407+08	\N	2026-10-13 21:54:59.411+08	2026-10-13 21:54:58.407943+08	\N	2026-10-13 21:54:58.407943+08	\N
c2f4b13a-d864-4d84-a983-321b754303da	u_df4fc0f2b5018074	9b654a09c30edd80b8df7273901bd9d217ac4e6cf80354dfe619a387ed972d01	parent	2026-11-12 15:07:40.07+08	\N	2026-10-13 15:07:40.755+08	2026-10-13 15:07:40.070732+08	\N	2026-10-13 15:07:40.070732+08	\N
45797d0f-8066-4de8-a444-ae90f9ca0b7c	u_d21e2a16db0d6ad8	dc66a4303c1240fb2c5bc780089fa84b6b685108f48ff2aacb1ab846da1dcf99	teacher	2026-11-12 15:07:40.833+08	\N	2026-10-13 15:07:40.859+08	2026-10-13 15:07:40.833575+08	\N	2026-10-13 15:07:40.833575+08	\N
13ae1839-2cb2-4aea-83a3-df669da79d8f	u_040f0825984aaec7	e016ba0ef4c835890f90ce7cd33b2afafd67bd8d5e26bc6af9612b31835c7530	parent	2026-11-12 15:07:39.632+08	\N	2026-10-13 15:07:40.879+08	2026-10-13 15:07:39.632867+08	\N	2026-10-13 15:07:39.632867+08	\N
37e726b5-9f14-465c-92ed-b5ee84cbbe0b	u_747d2315fab64522	355583feb57e222e45d6aab3cc1d052ac154e6da84724704a839096a2d295039	student	2026-11-12 16:24:30.488+08	\N	2026-10-13 16:24:30.51+08	2026-10-13 16:24:30.489458+08	\N	2026-10-13 16:24:30.489458+08	\N
70c3fd22-c6cf-428a-a0af-bede86ee110b	u_747d2315fab64522	c6ed6226212a72fdd0f6114107426c7cbfae82158b6d40281e9b9e6a1143b309	student	2026-11-12 16:26:00.735+08	\N	\N	2026-10-13 16:26:00.735512+08	\N	2026-10-13 16:26:00.735512+08	\N
6c7bff75-5953-4051-bbf2-73720421a26a	u_6e32fb7c7f2b7fed	c63319bf2ada198d81442e6b711cff1cb2ed29b23bc904d2e945d2c74d9cd19a	admin	2026-11-12 22:00:32.929+08	\N	\N	2026-10-13 22:00:32.930255+08	\N	2026-10-13 22:00:32.930255+08	\N
3ff0a9c3-5e68-4b11-a451-d22e0ae3f89e	u_747d2315fab64522	3e847a2a189295e8f7d3778e99324e275a59e52df66b3a21da7d9d1f33bdf108	student	2026-11-12 21:52:39.6+08	\N	2026-10-13 21:52:39.772+08	2026-10-13 21:52:39.601507+08	\N	2026-10-13 21:52:39.601507+08	\N
59096c0b-3bd3-44fc-b127-d9aab510588e	u_6e32fb7c7f2b7fed	efbe16c608ba7ad92c55c33347b2855d81b77fd434ce4e8b43e948e57809ded5	admin	2026-11-12 21:53:42.506+08	\N	\N	2026-10-13 21:53:42.507176+08	\N	2026-10-13 21:53:42.507176+08	\N
b0059193-c94d-4e1e-a91d-f1fcf5eb60de	u_63838e8eca74d816	49e17eb929dc147d41c77f078b1b651e557634a664054ccf178f91b70387346c	teacher	2026-11-12 21:53:42.672+08	\N	\N	2026-10-13 21:53:42.672505+08	\N	2026-10-13 21:53:42.672505+08	\N
80dd255c-894e-4fea-92ca-a485f376acaa	u_d21e2a16db0d6ad8	f05e644248e5b09a3254591aede7c22e6eac99e18bb5ecf31a4b11c260ad5125	teacher	2026-11-12 21:53:42.831+08	\N	\N	2026-10-13 21:53:42.832195+08	\N	2026-10-13 21:53:42.832195+08	\N
74229a37-0749-435c-aa70-a30bf295bd31	u_040f0825984aaec7	10381e9dfa0dfdbab57590a1dabb532c7039be053c8e2207adf8149ff7dc1c9a	parent	2026-11-12 21:53:43.132+08	\N	\N	2026-10-13 21:53:43.13299+08	\N	2026-10-13 21:53:43.13299+08	\N
1db3c0c4-8f66-4fb5-8e59-11e90f64e7b3	u_040f0825984aaec7	bfbd13a04d7209fe257c172b32b350ea9b6968586ed7f078f5b990ff802503e4	parent	2026-11-12 22:00:47.398+08	\N	2026-10-13 22:00:48.094+08	2026-10-13 22:00:47.3987+08	\N	2026-10-13 22:00:47.3987+08	\N
69799b84-710d-454d-b92a-f8af17cd261a	u_d21e2a16db0d6ad8	e45d917299ad83cb434a79ce014ae975ba6d941ff128d95cbc31d2058831359b	teacher	2026-11-12 22:01:48.036+08	\N	2026-10-13 22:01:49.053+08	2026-10-13 22:01:48.037152+08	\N	2026-10-13 22:01:48.037152+08	\N
33a06ce5-dfdc-453b-b44b-ce1b186f4233	u_6e32fb7c7f2b7fed	29d02b6dbf5265549e56ea80d2a4e0a2c5a4c2a0b4c283be50b01ad642af300f	admin	2026-11-12 22:01:47.739+08	\N	2026-10-13 22:01:49.076+08	2026-10-13 22:01:47.74019+08	\N	2026-10-13 22:01:47.74019+08	\N
a8dbc493-4f99-415a-a17a-df5fcd84da65	u_6e32fb7c7f2b7fed	b60212f1aeec25244fc8feb9f4da7cb1e93969ee5acc745092cca9fe840ed7c4	admin	2026-11-12 22:07:19.612+08	\N	2026-10-13 22:07:19.847+08	2026-10-13 22:07:19.615464+08	\N	2026-10-13 22:07:19.615464+08	\N
062add5f-b8de-458d-8fcc-1c395f6218cb	u_d21e2a16db0d6ad8	ed3a5f4ea69685ce7301f4f5ee06d37e2f47b6ecbd317c11d8047060e8bcaf30	teacher	2026-11-12 22:02:15.97+08	\N	2026-10-13 22:02:17.837+08	2026-10-13 22:02:15.970301+08	\N	2026-10-13 22:02:15.970301+08	\N
66b56e19-cfe8-4f22-9ebb-cfdbafa97f41	u_63838e8eca74d816	dc65e21671569b9974bc6084e89428e065ca70b9a15a678b49f4cab98149fa5d	teacher	2026-11-12 22:01:47.889+08	\N	2026-10-13 22:01:49.101+08	2026-10-13 22:01:47.889983+08	\N	2026-10-13 22:01:47.889983+08	\N
a167fb0b-1272-42e5-bb98-3be0f825c822	u_f54e97f52836855b	863e6c2bf877e3410cfe7fd529bd80d8e30ec10146a868fb15dfc19c1e165242	student	2026-11-12 22:01:48.421+08	\N	2026-10-13 22:01:49.12+08	2026-10-13 22:01:48.421552+08	\N	2026-10-13 22:01:48.421552+08	\N
d5f94e75-c09f-47a5-97f7-fb53c2e36965	u_d21e2a16db0d6ad8	11aad007b886c0c4413d2afdc906c2114f2e0c7ef2aabd4de8b7493509157dd6	teacher	2026-11-12 22:00:47.24+08	\N	2026-10-13 22:00:48.244+08	2026-10-13 22:00:47.240793+08	\N	2026-10-13 22:00:47.240793+08	\N
d5a18cf9-562a-4e8c-a2d7-628e9867aee8	u_6e32fb7c7f2b7fed	80ba23c4813387d5f1775a754d4a37577a0df953ad434a39dcf05302f3bc5c58	admin	2026-11-12 22:00:46.922+08	\N	2026-10-13 22:00:48.267+08	2026-10-13 22:00:46.923235+08	\N	2026-10-13 22:00:46.923235+08	\N
644cd24b-a447-4b9a-b6f7-ff084647bea7	u_63838e8eca74d816	5cd97fe442b220395c4b02c9995eef26c8097d27be06f20dffc1bfa780a256ed	teacher	2026-11-12 22:00:47.085+08	\N	2026-10-13 22:00:48.308+08	2026-10-13 22:00:47.085511+08	\N	2026-10-13 22:00:47.085511+08	\N
cea39152-67fe-4a4f-afa7-5d896cd84628	u_f54e97f52836855b	d13ffa73611ab69049a922933edff8ca090899f61b73c57e847a432ff5d40f4f	student	2026-11-12 22:00:47.619+08	\N	2026-10-13 22:00:48.329+08	2026-10-13 22:00:47.61927+08	\N	2026-10-13 22:00:47.61927+08	\N
f95c464e-f997-468d-9261-50a3dbfe9356	u_d21e2a16db0d6ad8	85516d3822a2ca60157648725e5df692a5003b3ffbdcb1303d890c26c5cbf17c	teacher	2026-11-12 22:02:35.078+08	\N	2026-10-13 22:02:36.127+08	2026-10-13 22:02:35.078334+08	\N	2026-10-13 22:02:35.078334+08	\N
78c06d03-0d49-4ebf-b330-29ce28721c46	u_6e32fb7c7f2b7fed	26a09d87e3294c331e46b99df05dbc12011dd953b8a937c89d594b9322a67f3a	admin	2026-11-12 22:02:15.654+08	\N	2026-10-13 22:02:18.012+08	2026-10-13 22:02:15.655096+08	\N	2026-10-13 22:02:15.655096+08	\N
ebc1b142-a955-416a-9cc5-db7a79074749	u_63838e8eca74d816	7410a392dd3101b5522d3e32a78c18b516b1cb53f69c74c619a6502607c3f73b	teacher	2026-11-12 22:02:34.922+08	\N	2026-10-13 22:02:36.173+08	2026-10-13 22:02:34.923136+08	\N	2026-10-13 22:02:34.923136+08	\N
b8630011-9fad-494a-9aa0-d9287d43c80b	u_040f0825984aaec7	f8d11a5728d7f99d70483ac8ed8b4f661ab6af57ec55f97b1385af8acc6d8c6a	parent	2026-11-12 22:02:35.232+08	\N	2026-10-13 22:02:35.989+08	2026-10-13 22:02:35.232764+08	\N	2026-10-13 22:02:35.232764+08	\N
059e5803-9dd6-4bc6-a908-c7db6dcc1041	u_6e32fb7c7f2b7fed	56fbe25c72b8e2161719778b68dcb93c9df0a2a886a0493139427c9dac87a377	admin	2026-11-12 22:02:34.742+08	\N	2026-10-13 22:02:36.146+08	2026-10-13 22:02:34.743888+08	\N	2026-10-13 22:02:34.743888+08	\N
b0ff2215-8d77-4771-b56c-20901b5cb2f6	u_f54e97f52836855b	b1a8daab7b023cb7708b1b5f2c14c43fb89591fae231acc3f468e7cfcbbf1b86	student	2026-11-12 22:02:35.458+08	\N	2026-10-13 22:02:36.191+08	2026-10-13 22:02:35.458952+08	\N	2026-10-13 22:02:35.458952+08	\N
195f3ddd-92fe-4bc2-afaa-846927efaf2d	u_6e32fb7c7f2b7fed	03240efca50d87768f6bfde019d77177632b8138ef61178b9d14fbe6e50afd21	admin	2026-11-12 22:11:01.621+08	\N	2026-10-13 22:11:01.658+08	2026-10-13 22:11:01.621695+08	\N	2026-10-13 22:11:01.621695+08	\N
df88b4f1-3a5d-49a7-8609-fd567b176a6e	u_6e32fb7c7f2b7fed	55b9aee8263283a7c8f267313ae8ec82f66629e5941fa26821d4d58532579d38	admin	2026-11-12 22:11:30.901+08	\N	2026-10-13 22:11:30.94+08	2026-10-13 22:11:30.901518+08	\N	2026-10-13 22:11:30.901518+08	\N
70ca9d1b-a438-476f-af53-ea50e7a883b6	u_63838e8eca74d816	806432571859d9e7f9be76c3d9b3485d2428abd2e734a8adbbb42b83eee46b73	teacher	2026-11-12 22:11:31.01+08	\N	2026-10-13 22:11:31.036+08	2026-10-13 22:11:31.010356+08	\N	2026-10-13 22:11:31.010356+08	\N
7b984cbe-a432-4cde-a05d-bc4dc16bef6b	u_040f0825984aaec7	b6a7b9d4ce192f757b5587b2faa936a2bc736567a437bb792dcbd6b87d46da9c	parent	2026-11-16 16:31:53.956+08	\N	2026-10-17 16:31:53.979+08	2026-10-17 16:31:53.956446+08	\N	2026-10-17 16:31:53.956446+08	\N
504d60e7-4365-4d00-9491-276b306fa5d6	u_6e32fb7c7f2b7fed	2db9be7e43eb2406a4ebd992e05ca7d52583aff11f3c902632ab13d78aa7b334	admin	2026-11-12 22:30:49.143+08	\N	2026-10-13 22:30:49.193+08	2026-10-13 22:30:49.144844+08	\N	2026-10-13 22:30:49.144844+08	\N
b7c1a227-1ae7-41de-a6dc-2256bbace870	u_040f0825984aaec7	f787a88e7dc8bb2ebe24d8dd75e6f6f1f1ea14a3c758ed782d789a354e8960a5	parent	2026-11-12 22:34:43.279+08	\N	2026-10-21 22:44:15.095+08	2026-10-13 22:34:43.279446+08	\N	2026-10-13 22:34:43.279446+08	\N
ecfb7515-4017-4789-9b54-1433f0793fbf	u_63838e8eca74d816	75bab9980067897a01b4ca5ce2dfe6574b201a691f4ac0555bcf74d79a2d07d9	teacher	2026-11-16 16:49:33.466+08	\N	2026-10-17 16:49:33.539+08	2026-10-17 16:49:33.467228+08	\N	2026-10-17 16:49:33.467228+08	\N
bc3db50c-5a53-43d3-a2d3-f962ca2a7bcc	u_747d2315fab64522	5aaf59ee82c3efa74e7bdcb994bc20b483452208a1e153a626bb3c6dda2a6b9e	student	2026-11-16 16:49:33.609+08	\N	2026-10-17 16:49:33.631+08	2026-10-17 16:49:33.609896+08	\N	2026-10-17 16:49:33.609896+08	\N
a3fee594-8fd3-4b43-a001-338569c1d2e7	u_040f0825984aaec7	a684e0cfb48d249f30cc8df2e02ff819548490b8db6f03d4adb6eeb1632a3e38	parent	2026-11-12 22:32:29.806+08	\N	2026-10-13 22:32:30.594+08	2026-10-13 22:32:29.80687+08	\N	2026-10-13 22:32:29.80687+08	\N
2b270536-cbb0-43fd-a7eb-5a125607a795	u_747d2315fab64522	ff965f59ef4a573256ea6ea2ca6845cb81cbd872e9a4ec80551d18c49e3fb465	student	2026-11-16 16:50:38.853+08	\N	2026-10-17 16:50:39.029+08	2026-10-17 16:50:38.854976+08	\N	2026-10-17 16:50:38.854976+08	\N
9acc3655-02a2-493a-a582-da85c9c2bf24	u_d21e2a16db0d6ad8	c7e543f0bbd6bba6f946da80d08f1b1bbcd4a3e2b34d139950c261fd97acae65	teacher	2026-11-16 16:50:39.007+08	\N	2026-10-17 16:50:39.048+08	2026-10-17 16:50:39.007505+08	\N	2026-10-17 16:50:39.007505+08	\N
200d6674-1b46-4ae1-8205-711eae0df20a	u_63838e8eca74d816	ef349559d253d196b7c04c3ea75f801eaf23ebbe25382d95c2a3d01620b2b4df	teacher	2026-11-16 16:50:38.932+08	\N	2026-10-17 16:50:39.068+08	2026-10-17 16:50:38.932627+08	\N	2026-10-17 16:50:38.932627+08	\N
1c32995e-6fa6-440e-aa75-e9688c86555a	u_d21e2a16db0d6ad8	7183e898dbe63de2b84965b0bb535a043825639c6e6d775d9badf31651601316	teacher	2026-11-12 22:32:29.648+08	\N	2026-10-13 22:32:30.73+08	2026-10-13 22:32:29.64864+08	\N	2026-10-13 22:32:29.64864+08	\N
53bdc39c-9228-49e7-b55f-fb3fd16d8f05	u_6e32fb7c7f2b7fed	ec2f38b9c80f6a1732a31530e418f2dd24511e46d3b023bdb16a58c4bb8d1b22	admin	2026-11-12 22:32:29.322+08	\N	2026-10-13 22:32:30.748+08	2026-10-13 22:32:29.323093+08	\N	2026-10-13 22:32:29.323093+08	\N
ad2d4704-65ac-4e11-a99b-534a85381544	u_63838e8eca74d816	f34ed0c3b83d1e6b4102017a368e949964f76fcf57606180940d424e621b1cd1	teacher	2026-11-12 22:32:29.485+08	\N	2026-10-13 22:32:30.778+08	2026-10-13 22:32:29.485452+08	\N	2026-10-13 22:32:29.485452+08	\N
3ef076f0-0b9d-4b64-8792-5996432fd133	u_f54e97f52836855b	167bc2f90fb425fd4a2a5fe2172f70c6c72fb17f0bdcb3cbd24621506e9222bf	student	2026-11-12 22:32:30.038+08	\N	2026-10-13 22:32:30.796+08	2026-10-13 22:32:30.038783+08	\N	2026-10-13 22:32:30.038783+08	\N
1b8fe370-752d-4a3c-9b09-4229dab788d9	u_f54e97f52836855b	df795eea35b996e9877e66b1ff0dff6ce7f5edaeec828187a4daed36871e60d4	student	2026-11-16 16:53:02.349+08	\N	2026-10-17 16:53:02.38+08	2026-10-17 16:53:02.35081+08	\N	2026-10-17 16:53:02.35081+08	\N
4e59edb6-2b5e-46e0-8ae9-524fa9e4cc3f	u_6e32fb7c7f2b7fed	675692a770e95e8c64182ee67186daae9738a3836e67a3c4e2b2a624db3e145c	admin	2026-11-16 16:32:25.35+08	\N	2026-10-17 16:32:37.395+08	2026-10-17 16:32:25.35122+08	\N	2026-10-17 16:32:25.35122+08	\N
977961d9-7bfe-4016-93ab-7cf7e9bdb2b1	u_040f0825984aaec7	df932c10949c6a28a0c416942f5f22c5bdc94234ecc3aef14199999fc85a28b7	parent	2026-11-16 16:31:52.82+08	\N	2026-10-17 16:31:53.61+08	2026-10-17 16:31:52.820365+08	\N	2026-10-17 16:31:52.820365+08	\N
b2cb1368-0753-483d-b06c-983101cd7c3f	u_040f0825984aaec7	3ea62b61ddccce55cce9ebeb8f1371a879b9bab06116301bd21e97c487a2e6c3	parent	2026-11-16 16:31:39.147+08	\N	2026-10-17 16:31:39.995+08	2026-10-17 16:31:39.147482+08	\N	2026-10-17 16:31:39.147482+08	\N
6fc66b4e-bcfa-43b7-9bc9-6f9698eb508f	u_f54e97f52836855b	af38cb160b27e49e4ebc6b0c3f4998661430addc43ca174089241f3013ebd1e7	student	2026-11-16 17:01:06.362+08	\N	2026-10-17 17:01:06.387+08	2026-10-17 17:01:06.362848+08	\N	2026-10-17 17:01:06.362848+08	\N
02f765f7-7777-499f-9627-c10e10fc9550	u_d21e2a16db0d6ad8	ce6107a9340b7c125158b31b03d982408091635a5b182ad877ffc5600b8374bd	teacher	2026-11-16 16:31:52.659+08	\N	2026-10-17 16:31:53.762+08	2026-10-17 16:31:52.659444+08	\N	2026-10-17 16:31:52.659444+08	\N
0df4c56d-bfa1-4745-accc-59c319911247	u_d21e2a16db0d6ad8	77be9156602378b79b2c331a172cd16d9c9cebb85f338b077d7420bc6fbbfd2c	teacher	2026-11-16 16:31:38.992+08	\N	2026-10-17 16:31:40.178+08	2026-10-17 16:31:38.992957+08	\N	2026-10-17 16:31:38.992957+08	\N
185dc099-d80f-457b-af08-8728259c5618	u_6e32fb7c7f2b7fed	399cbbc2e38184733401a8e1b679af4e9f05f96ee4356ffb64c27d2f296ea0ae	admin	2026-11-16 16:31:38.678+08	\N	2026-10-17 16:31:40.2+08	2026-10-17 16:31:38.680641+08	\N	2026-10-17 16:31:38.680641+08	\N
211be72c-4c09-4001-ad38-948b2b7a96ee	u_63838e8eca74d816	9d7b6947b12257a6f674bf7f862ece9f0703451a11c102ae556f7059cd41bb83	teacher	2026-11-16 16:31:38.84+08	\N	2026-10-17 16:31:40.247+08	2026-10-17 16:31:38.841001+08	\N	2026-10-17 16:31:38.841001+08	\N
9246130e-7c15-4d66-85f2-1f521fefb11e	u_f54e97f52836855b	63517b3cd3d04646982bccd070824fb7fee4867c11d0527d08f309aac4f491e3	student	2026-11-16 16:31:39.371+08	\N	2026-10-17 16:31:40.274+08	2026-10-17 16:31:39.371822+08	\N	2026-10-17 16:31:39.371822+08	\N
23dd184c-5d08-4c44-ba76-5b1a3446d33b	u_6e32fb7c7f2b7fed	a062784bddab115dbfdb13166b54a371b0f0c0d8fa038225c4c1cdb3c5745658	admin	2026-11-16 16:31:52.347+08	\N	2026-10-17 16:31:53.785+08	2026-10-17 16:31:52.347728+08	\N	2026-10-17 16:31:52.347728+08	\N
9d1654ea-01e6-4196-8f21-4ec88e10e022	u_63838e8eca74d816	a933916ee7cf089d16392ffca50c0b0629ef3aa1bf2a9eaf52212b418918e129	teacher	2026-11-16 16:31:52.505+08	\N	2026-10-17 16:31:53.825+08	2026-10-17 16:31:52.505811+08	\N	2026-10-17 16:31:52.505811+08	\N
b84277aa-3c18-4d2f-9056-a54c33a2bcdb	u_f54e97f52836855b	4ddb7324acd25d1c1cde81c5ecbf717761d24178274fd09cf9626b173abb3ea6	student	2026-11-16 16:31:53.045+08	\N	2026-10-17 16:31:53.848+08	2026-10-17 16:31:53.045798+08	\N	2026-10-17 16:31:53.045798+08	\N
7a31e427-beeb-4c39-875c-27f5d4952ad9	u_63838e8eca74d816	bfbb050961e343134f92fcd12576700ec92fb8a45aa26f73f2930c5e9985ee9c	teacher	2026-11-16 17:08:07.632+08	\N	2026-10-17 17:08:07.74+08	2026-10-17 17:08:07.63497+08	\N	2026-10-17 17:08:07.63497+08	\N
f487fccd-e487-4703-9dc4-6bb4a21800a4	u_6e32fb7c7f2b7fed	03e7701c231b74172c995bc4640f9d9b71e05a19987b437a05d87a7aa23bd646	admin	2026-11-16 16:32:53.883+08	\N	2026-10-17 16:32:56.093+08	2026-10-17 16:32:53.883906+08	\N	2026-10-17 16:32:53.883906+08	\N
9d5f65b7-2d31-41d6-b394-bf3914427805	u_6e32fb7c7f2b7fed	38b548984c7967b2061b36c6b69dc5dc641498a12ae87f245473f1ed881914ff	admin	2026-11-16 17:23:52.937+08	\N	2026-10-17 17:23:53.227+08	2026-10-17 17:23:52.938658+08	\N	2026-10-17 17:23:52.938658+08	\N
35abbf1c-94f9-41e6-8830-caa3c28f1c0a	u_f54e97f52836855b	d7a3c9bff9467914721b04f1f5599cc0f09553820f6e27891c979f5590245da7	student	2026-11-16 17:08:07.714+08	\N	2026-10-17 17:08:07.822+08	2026-10-17 17:08:07.714465+08	\N	2026-10-17 17:08:07.714465+08	\N
6bf9811d-c803-4d9e-9c4b-abde35b3aaa6	u_63838e8eca74d816	a95f583c9c44d9ee46e0ee5f857f57da6e1d4d7103e344b8629e9c2770b4127b	teacher	2026-11-16 17:12:19.739+08	\N	\N	2026-10-17 17:12:19.739699+08	\N	2026-10-17 17:12:19.739699+08	\N
70a3bc06-0582-4ab8-a69c-64ebffb68ec6	u_f54e97f52836855b	06dce05b56ffabdc64695a42ad1c9bbf303da096f2fbd7ff93d64515a7ba51ec	student	2026-11-16 17:14:11.454+08	\N	2026-10-17 17:14:11.501+08	2026-10-17 17:14:11.454908+08	\N	2026-10-17 17:14:11.454908+08	\N
ff496832-fef0-48c7-8ac7-6db7580938b3	u_63838e8eca74d816	82d32226e22ce52918d830b247343f2098699e08ee3404383270b1eb734d1d2e	teacher	2026-11-16 17:14:11.373+08	\N	2026-10-17 17:14:11.519+08	2026-10-17 17:14:11.374318+08	\N	2026-10-17 17:14:11.374318+08	\N
269be74e-29a6-4f5c-9d80-0390c45142ca	u_63838e8eca74d816	d1410992cdcc312fd2371bedbb08cf2ab9337ef86edefa4313dcc7b1f2e08b41	teacher	2026-11-16 17:24:21.75+08	\N	2026-10-17 17:24:23.17+08	2026-10-17 17:24:21.75047+08	\N	2026-10-17 17:24:21.75047+08	\N
63b4a9ce-345e-4dc4-8888-39fc8555441e	u_f54e97f52836855b	13e9579e338c8cf6b356ed3f451d9409c56ce0193c033e88c40df45e7a9ef0db	student	2026-11-16 17:23:53.018+08	\N	2026-10-17 17:23:53.21+08	2026-10-17 17:23:53.018971+08	\N	2026-10-17 17:23:53.018971+08	\N
d585abf8-af05-46cf-919e-3a04adf4853b	u_d21e2a16db0d6ad8	cbc3b684798a53d583cd865161725dbcc4de883701b8e05e8109bcfd7ab49917	teacher	2026-11-16 17:24:21.905+08	\N	2026-10-17 17:24:23.096+08	2026-10-17 17:24:21.906038+08	\N	2026-10-17 17:24:21.906038+08	\N
cf5a8716-a9ae-4263-a384-b70a52dbd603	u_6e32fb7c7f2b7fed	21ff9f838601db1b9f6a386efd418c2df6279da7c7bbed32d8534345efed6a85	admin	2026-11-16 17:24:21.591+08	\N	2026-10-17 17:24:23.122+08	2026-10-17 17:24:21.591314+08	\N	2026-10-17 17:24:21.591314+08	\N
7677fcbe-7140-4a3f-8338-c3ab80747be0	u_f54e97f52836855b	7f544c4886b1e3e4e138b6ec127a47e48f6ee14f34f58b95f3f7c80406054d00	student	2026-11-16 17:24:22.292+08	\N	2026-10-17 17:24:23.191+08	2026-10-17 17:24:22.292503+08	\N	2026-10-17 17:24:22.292503+08	\N
2a1ebe06-d544-4a13-8eea-df79c30cb6aa	u_63838e8eca74d816	6947eb07f05de28dadcec682731c6fdb4531c6685ba39e351dda9c4e0b73fe6e	teacher	2026-11-16 17:24:42.057+08	\N	2026-10-17 17:24:43.588+08	2026-10-17 17:24:42.058238+08	\N	2026-10-17 17:24:42.058238+08	\N
8ed59544-f11d-466d-be77-51d6ca50e4ea	u_040f0825984aaec7	279fa5a346387df75037a1ba58b35e7f012c48e0132f31e21d7cff47ea5fed5c	parent	2026-11-16 17:24:22.061+08	\N	2026-10-17 17:24:22.916+08	2026-10-17 17:24:22.061989+08	\N	2026-10-17 17:24:22.061989+08	\N
1bb99a47-e6c7-46ee-8403-ebb3838f6ea6	u_d21e2a16db0d6ad8	a636113ffd2dacb528b8842a01a0b5e8d57c44741f77916f273a97783228a079	teacher	2026-11-16 17:24:42.22+08	\N	2026-10-17 17:24:43.5+08	2026-10-17 17:24:42.220563+08	\N	2026-10-17 17:24:42.220563+08	\N
32039ffe-43b3-4d74-ba59-4945fadb2b89	u_6e32fb7c7f2b7fed	3d8e914fc5a4080e68d2d3c8c580932e7193afd9252afa5ec51faf83684cca7b	admin	2026-11-16 17:24:41.899+08	\N	2026-10-17 17:24:43.633+08	2026-10-17 17:24:41.900241+08	\N	2026-10-17 17:24:41.900241+08	\N
42fc029d-a03f-4558-bf96-15392e303d28	u_f54e97f52836855b	c4e3dc27369aca51d99abf9b74afe1070891af11302005db7c1e0280aa29adc2	student	2026-11-18 11:39:41.48+08	\N	2026-10-19 11:39:43.107+08	2026-10-19 11:39:41.480297+08	\N	2026-10-19 11:39:41.480297+08	\N
6729ed5a-abf8-4580-8f23-855268411ce7	u_d21e2a16db0d6ad8	47bf3a0e4db5a08595ab6c3535f4b5b6034e335b16e9c6d8db2a01d8af0f6d17	teacher	2026-11-20 11:37:48.849+08	\N	2026-10-21 11:37:48.861+08	2026-10-21 11:37:48.849927+08	\N	2026-10-21 11:37:48.849927+08	\N
f4d3a0b3-1de7-4d5d-a6d1-03f7aa79e20f	u_040f0825984aaec7	ddbc48b48be47ca59f11bc40f209bf89062abb6a92a6833666d2d4b415cb0a1f	parent	2026-11-16 17:24:42.378+08	\N	2026-10-17 17:24:43.168+08	2026-10-17 17:24:42.378279+08	\N	2026-10-17 17:24:42.378279+08	\N
0d83df04-cffe-4f8b-a573-643b0575b039	u_63838e8eca74d816	b3dde2435da092fdb162b15c066ccf44b5b7ec3243d2e5cdb5169863b6619610	teacher	2026-11-18 11:39:22.745+08	\N	2026-10-19 11:39:24.27+08	2026-10-19 11:39:22.746345+08	\N	2026-10-19 11:39:22.746345+08	\N
31bbbd65-ef4d-4bf8-88a1-306ee6766798	u_6e32fb7c7f2b7fed	ecdd60eeb87982d4361dc14325c33556a8cad94e17fd4ba95cb7a60f7d07fccc	admin	2026-11-20 12:03:26.666+08	\N	2026-10-21 12:03:27.74+08	2026-10-21 12:03:26.666659+08	\N	2026-10-21 12:03:26.666659+08	\N
a1e662e6-ae57-4210-8412-907484be1b1b	u_6e32fb7c7f2b7fed	93a7e271717fb08785060974a11edd685b70029f7dcae3f86b88c3692ed1d073	admin	2026-11-20 12:03:39.749+08	\N	2026-10-21 12:03:39.773+08	2026-10-21 12:03:39.749578+08	\N	2026-10-21 12:03:39.749578+08	\N
598fa921-3bc9-40cf-a9ef-f38e94b531ee	u_f54e97f52836855b	5f85190c69ada1984d862c4c160aa8c131eab400da8b9569a27da01c753b8a03	student	2026-11-20 12:02:57.582+08	\N	2026-10-21 12:02:57.697+08	2026-10-21 12:02:57.582728+08	\N	2026-10-21 12:02:57.582728+08	\N
a3c9770f-79b5-4bff-b045-34ecae902570	u_f54e97f52836855b	a093dabd291cc0403b59517736dea85995c3a480f8c144019c5aae625c14309f	student	2026-11-16 17:24:42.606+08	\N	2026-10-17 17:24:43.612+08	2026-10-17 17:24:42.606243+08	\N	2026-10-17 17:24:42.606243+08	\N
b677344b-a526-4709-998f-1c75fe36aaba	u_040f0825984aaec7	b13577f4085bfeb383b5d23d9887291f752ed3af73755c1a4b0e92fb3c59a661	parent	2026-11-18 10:33:56.028+08	\N	2026-10-19 10:33:56.069+08	2026-10-19 10:33:56.029827+08	\N	2026-10-19 10:33:56.029827+08	\N
c4ee1e78-9ea7-488b-a2fa-439e5eca0692	u_d21e2a16db0d6ad8	2abd2fe2b792e9f71f55922fe75b30cc962320251f0efa40457cec5d7f2b2feb	teacher	2026-11-18 10:34:17.591+08	\N	2026-10-19 10:34:17.688+08	2026-10-19 10:34:17.591729+08	\N	2026-10-19 10:34:17.591729+08	\N
b6f1bcf2-06b2-456b-90a7-5586a731fee5	u_040f0825984aaec7	8bebafd1b7a65e24884cee14f8072072ae914d80eef51b84dfd909d13e1cb8a6	parent	2026-11-18 10:34:17.806+08	\N	2026-10-19 10:34:17.843+08	2026-10-19 10:34:17.807262+08	\N	2026-10-19 10:34:17.807262+08	\N
ed97dcfe-c7fa-4f58-b89b-d79f1d50d431	u_d21e2a16db0d6ad8	b27cf4b5c35f19b6bd33dfb23a52e1da5149c28c330c2ebf33852aebdea8d49b	teacher	2026-11-18 11:39:22.92+08	\N	2026-10-19 11:39:24.37+08	2026-10-19 11:39:22.921563+08	\N	2026-10-19 11:39:22.921563+08	\N
5b815ec5-73bb-48da-9bad-19c0d6ea116e	u_f54e97f52836855b	09e267ca245f2e228323f10fb935181df7977f760514a700cf0f75e1b701c5be	student	2026-11-18 10:40:35.393+08	\N	2026-10-19 10:40:35.5+08	2026-10-19 10:40:35.394995+08	\N	2026-10-19 10:40:35.394995+08	\N
d5c6823a-23e5-4927-b45d-c1ecd48c8112	u_040f0825984aaec7	25de3904f4c5d21189d50ffc58200eea2fd8b8c724f892670fd64d17b7c6830c	parent	2026-11-18 11:39:23.083+08	\N	2026-10-19 11:39:24.394+08	2026-10-19 11:39:23.083881+08	\N	2026-10-19 11:39:23.083881+08	\N
40109294-edcf-4943-ae64-5d778358527f	u_f54e97f52836855b	349696f4d0a35fd03584aca059a758e489a62ed8030dbe78702d8d3e69a553e8	student	2026-11-18 10:57:38.155+08	\N	2026-10-19 10:57:38.302+08	2026-10-19 10:57:38.156553+08	\N	2026-10-19 10:57:38.156553+08	\N
46d2bfb3-4799-4fd1-a4a5-fc2b586410a1	u_63838e8eca74d816	97a672a460402f0e5d6719b3e3fcaf3ebcaa1743e445ce445caa46ea95da7936	teacher	2026-11-18 11:39:40.937+08	\N	2026-10-19 11:39:42.784+08	2026-10-19 11:39:40.937693+08	\N	2026-10-19 11:39:40.937693+08	\N
774c8848-1557-48eb-ab82-0f384750a48a	u_6e32fb7c7f2b7fed	fdc9afea3f4268762894305304035c3df0c8e23a2975e033d9afdd8bb05f318f	admin	2026-11-18 11:11:39.696+08	\N	2026-10-19 11:11:39.723+08	2026-10-19 11:11:39.696375+08	\N	2026-10-19 11:11:39.696375+08	\N
bcbbbe55-846f-42ae-9483-a8b0788a3cf6	u_6e32fb7c7f2b7fed	c19bcb63245749a86e2d263a0e4c32144f81d9d80883a0e9d740db753f8b1438	admin	2026-11-20 11:33:05.115+08	\N	2026-10-21 11:33:05.174+08	2026-10-21 11:33:05.116233+08	\N	2026-10-21 11:33:05.116233+08	\N
e9d507b3-bd8d-47c9-8074-c86ff3c42d5a	u_f54e97f52836855b	57da0f8de03ac146bb10029ff95ac2fe35ac49f047cb07c1c147acfd818aa310	student	2026-11-18 11:11:39.475+08	\N	2026-10-19 11:11:39.889+08	2026-10-19 11:11:39.476633+08	\N	2026-10-19 11:11:39.476633+08	\N
605987cf-b682-4018-85ae-53f982cd7e05	u_6e32fb7c7f2b7fed	c75f6352f63241999b5e46e7e5bded128ba4024480a96d6c79eab0672201d769	admin	2026-11-18 11:21:49.564+08	\N	2026-10-19 11:21:49.655+08	2026-10-19 11:21:49.565282+08	\N	2026-10-19 11:21:49.565282+08	\N
4f3aaee3-8756-435e-a182-3a999b0165a3	u_f54e97f52836855b	16762008b893f50dcd08a7c2a2c47a9f45b9796207bfa05cce808973e27c4e5d	student	2026-11-18 11:21:49.478+08	\N	2026-10-19 11:21:49.77+08	2026-10-19 11:21:49.480971+08	\N	2026-10-19 11:21:49.480971+08	\N
bb5ad840-dd2d-415f-811c-1abf2772950a	u_f54e97f52836855b	4214a7dcaf69dbcded88b549ddab1d1c53ae11eef52659e074b570f65c23e6b3	student	2026-11-18 11:36:09.345+08	\N	2026-10-19 11:36:09.378+08	2026-10-19 11:36:09.347367+08	\N	2026-10-19 11:36:09.347367+08	\N
3b44cf6a-017d-4ad5-b0b6-03e48399ee71	u_f54e97f52836855b	e14d3b10698745a8435aa6a7c9498f862b720ee4da65a9f491359b7b0d79adca	student	2026-11-20 11:34:39.602+08	\N	2026-10-21 11:34:39.659+08	2026-10-21 11:34:39.603359+08	\N	2026-10-21 11:34:39.603359+08	\N
8011b503-293a-429b-92e3-fc89c168326c	u_d21e2a16db0d6ad8	d4c8857da3579ef2d36cf95685c31c9716dfb5a004b65d195d5e2277925f6b92	teacher	2026-11-18 11:39:41.102+08	\N	2026-10-19 11:39:42.877+08	2026-10-19 11:39:41.103091+08	\N	2026-10-19 11:39:41.103091+08	\N
ea1ac2ab-4e3e-4aa8-92b5-a3ade2dbd546	u_6e32fb7c7f2b7fed	ff8c27f417e8aba23b23ff973e8de4aea8bdf97820513d9fa8ea2db12bc1c3dc	admin	2026-11-18 11:39:22.504+08	\N	2026-10-19 11:39:24.531+08	2026-10-19 11:39:22.505806+08	\N	2026-10-19 11:39:22.505806+08	\N
7401a4bc-3a9d-430f-95fa-0b084030e4fe	u_f54e97f52836855b	272d9825ef42ca520eb5266bc08c89641ddd9db1c207129464871df727b452e8	student	2026-11-18 11:39:23.309+08	\N	2026-10-19 11:39:24.572+08	2026-10-19 11:39:23.309347+08	\N	2026-10-19 11:39:23.309347+08	\N
31582d50-44eb-48be-a228-86201335554d	u_040f0825984aaec7	d151286d8383f3e9a4be79495a1d48286a02c4588f26c72a30e845685083413b	parent	2026-11-18 11:39:41.261+08	\N	2026-10-19 11:39:42.897+08	2026-10-19 11:39:41.261375+08	\N	2026-10-19 11:39:41.261375+08	\N
f9be8cb1-45e9-4592-b35d-3d1a242d74af	u_f54e97f52836855b	8394953a82cbc88e88a7226008fa37422ff6cfd0b83d86a951cf6a3ce8030a95	student	2026-11-20 11:34:44.325+08	\N	2026-10-21 11:34:44.338+08	2026-10-21 11:34:44.325469+08	\N	2026-10-21 11:34:44.325469+08	\N
923ae183-d54c-44ab-b4a9-e7720ceed4aa	u_f54e97f52836855b	6e71be87d3d7910cb9937ab49f49438ddcf09fc4bfae0b21c8e606c3909eb034	student	2026-11-20 11:38:41.394+08	\N	2026-10-21 11:38:41.664+08	2026-10-21 11:38:41.394898+08	\N	2026-10-21 11:38:41.394898+08	\N
9ec0b881-cf77-4e5d-b3c0-26d37700eedc	u_f54e97f52836855b	4a14135acacfcf6b673d558f17fe76e393ed3326a85e200b1521fbb0879aee16	student	2026-11-20 11:37:48.445+08	\N	2026-10-21 11:37:48.699+08	2026-10-21 11:37:48.445936+08	\N	2026-10-21 11:37:48.445936+08	\N
0cf99e64-84d4-4726-a043-ab153edfce20	u_747d2315fab64522	c9867d3c5184270d92f1dd21fcffcb909483a22f67f933f53b251b8710585198	student	2026-11-20 11:37:48.799+08	\N	2026-10-21 11:37:48.811+08	2026-10-21 11:37:48.79921+08	\N	2026-10-21 11:37:48.79921+08	\N
dcc759ba-9924-4545-9a3e-2caaa3e18577	u_6e32fb7c7f2b7fed	7fcf8ac8bb4a738a119bff0c78f873cb125f8bf49e0872d3a4baa46e0844e907	admin	2026-11-18 11:39:40.772+08	\N	2026-10-19 11:39:43.063+08	2026-10-19 11:39:40.773266+08	\N	2026-10-19 11:39:40.773266+08	\N
d8b7a592-be7b-4330-847e-a20cf6a3b1d8	u_6e32fb7c7f2b7fed	2911402de2c529cf8e40a400f6a2e9ec0b2921251eaa484c618df51b0154e1b4	admin	2026-11-20 11:52:51.09+08	\N	2026-10-21 11:52:51.201+08	2026-10-21 11:52:51.091752+08	\N	2026-10-21 11:52:51.091752+08	\N
2d4dcc05-47ae-4a2b-ae67-cd9c533dfc3d	u_f54e97f52836855b	9aa86e6d48417bba9e5ac1765a59fcd2edfec392d9e4e53cf9896b84b8536e31	student	2026-11-20 11:58:29.814+08	\N	2026-10-21 11:58:29.878+08	2026-10-21 11:58:29.815225+08	\N	2026-10-21 11:58:29.815225+08	\N
754035a8-7d60-4039-bbac-274647da2c26	u_63838e8eca74d816	646bc30a4e8cf4a69ae9393e39f332ec6b360d912c1c497da5416e2c283cd8c2	teacher	2026-11-20 11:58:29.863+08	\N	2026-10-21 11:58:29.924+08	2026-10-21 11:58:29.863306+08	\N	2026-10-21 11:58:29.863306+08	\N
b09b848b-5a10-4006-b3d9-0534e214976c	u_040f0825984aaec7	682c06482ea878c41bedd4a087f1be4ad420d7ea793d96c51e41e1e0cb8bb940	parent	2026-11-20 12:03:26.943+08	\N	2026-10-21 12:03:27.843+08	2026-10-21 12:03:26.94407+08	\N	2026-10-21 12:03:26.94407+08	\N
9295df3e-0106-4f6d-9d04-dc26dbd8992a	u_6e32fb7c7f2b7fed	1211bd576089bdb7715e30f7ec53cc71984e50c26323223ed6ecf15beac3f614	admin	2026-11-20 17:32:43.774+08	\N	2026-10-21 17:32:43.799+08	2026-10-21 17:32:43.778375+08	\N	2026-10-21 17:32:43.778375+08	\N
2b1136c7-1228-4a66-bbb2-790582d40efe	u_f54e97f52836855b	4128ceefd530f4d099555739c94ae5e18bc6d2205ca4cba73903fc0052b70458	student	2026-11-20 12:03:27.069+08	\N	2026-10-21 12:03:27.912+08	2026-10-21 12:03:27.069588+08	\N	2026-10-21 12:03:27.069588+08	\N
75521be1-74da-4ad4-9828-26f098891de3	u_63838e8eca74d816	6efce4bb8ffe67a8d305879bf7eaf09ff08f3284f1721c01b058cc568b55fb34	teacher	2026-11-20 12:03:26.753+08	\N	2026-10-21 12:03:27.855+08	2026-10-21 12:03:26.75349+08	\N	2026-10-21 12:03:26.75349+08	\N
cd331987-d157-4af3-bb79-2f008376eba8	u_d21e2a16db0d6ad8	494249041f101f365a175bd937cef5709af63b31eef4b1bd461ec0d61ec0c29a	teacher	2026-11-20 12:03:26.862+08	\N	2026-10-21 12:03:27.831+08	2026-10-21 12:03:26.862619+08	\N	2026-10-21 12:03:26.862619+08	\N
4d097582-3756-4a57-872d-3bbd95cd9300	u_6e32fb7c7f2b7fed	6e2cd76b7e6764de9d15e6559800d60e19f535187b33403e8e3fef4fd922250f	admin	2026-11-20 12:04:10.665+08	\N	2026-10-21 12:04:10.698+08	2026-10-21 12:04:10.66623+08	\N	2026-10-21 12:04:10.66623+08	\N
a66bbba8-1b76-49cd-aa18-0aa9a1bc7f5e	u_6e32fb7c7f2b7fed	38ba148adfdfd575761a44655da563f12df5934df5fc32cc8821181992905804	admin	2026-11-20 17:32:54.071+08	\N	2026-10-21 17:32:54.095+08	2026-10-21 17:32:54.072199+08	\N	2026-10-21 17:32:54.072199+08	\N
d5869997-6b4d-4f97-ad9d-01833862907f	u_6e32fb7c7f2b7fed	dcdd352e37dcd753d7ed7d60f52dfbc63c28ed57e2f1e92d10aaa398ff750c74	admin	2026-11-20 17:47:13.978+08	\N	2026-10-21 17:47:14.004+08	2026-10-21 17:47:13.979427+08	\N	2026-10-21 17:47:13.979427+08	\N
75d4adf2-3f4d-4dbf-84ec-21d76b70bc59	u_6e32fb7c7f2b7fed	068827ea34b75015264bc44bd2b443d05b62faa31a92fd20848ff1e468e601c3	admin	2026-11-20 18:17:00.187+08	\N	2026-10-21 18:17:16.139+08	2026-10-21 18:17:00.187572+08	\N	2026-10-21 18:17:00.187572+08	\N
da045d00-00cb-4fdf-bbf8-167f5fcde7b7	u_d21e2a16db0d6ad8	5cbb1f09d65cf1fba69867120cde2e9767622b5cbca03c2f07531d745097489c	teacher	2026-11-20 17:48:57.386+08	\N	2026-10-21 17:48:59.109+08	2026-10-21 17:48:57.386364+08	\N	2026-10-21 17:48:57.386364+08	\N
f78b2749-759e-4433-aec2-946fee975b08	u_040f0825984aaec7	63657c94cfee4a71145d56fdbcbc3c0cddef6588e084eb8fef953f2d29419241	parent	2026-11-20 17:48:57.54+08	\N	2026-10-21 17:48:59.131+08	2026-10-21 17:48:57.540389+08	\N	2026-10-21 17:48:57.540389+08	\N
be3636ad-f3a1-42fb-acf0-336acdba9c89	u_6e32fb7c7f2b7fed	e8c25053aac0456eef6bb6772719c0783b4fc2c525f67f56f5f8ed1c39481b80	admin	2026-11-20 17:47:56.686+08	\N	2026-10-21 17:47:56.742+08	2026-10-21 17:47:56.687092+08	\N	2026-10-21 17:47:56.687092+08	\N
d19daa8a-10e2-495a-9d0c-316e2d312151	u_63838e8eca74d816	61e34ae2ccbcd97635b23289ad39e0d7bf6fc231819a98e1e58202df2e23a835	teacher	2026-11-20 17:48:57.23+08	\N	2026-10-21 17:48:59.175+08	2026-10-21 17:48:57.2306+08	\N	2026-10-21 17:48:57.2306+08	\N
8b7fa28b-9b17-4827-b956-470ee6519030	u_f54e97f52836855b	b4eed40565a3848d0a0431852d7d569670690ee80ce026956bc489fb63c6f194	student	2026-11-20 18:17:00.881+08	\N	2026-10-21 18:17:30.62+08	2026-10-21 18:17:00.881717+08	\N	2026-10-21 18:17:00.881717+08	\N
19e84455-cb7f-4fe1-950b-fda963c4f88d	u_6e32fb7c7f2b7fed	3194369ec05145648a872f03e4cdc01c52b331a2ff50a5271306a7c7441611c2	admin	2026-11-20 18:13:47.328+08	\N	2026-10-21 18:13:50.471+08	2026-10-21 18:13:47.330196+08	\N	2026-10-21 18:13:47.330196+08	\N
37085662-5980-4dac-aa02-28a99df5f9db	u_6e32fb7c7f2b7fed	2c85827c619248ae3339d4a3ca2837b62ff0d847462bf4efacb39a7a983329e5	admin	2026-11-20 17:48:13.942+08	\N	2026-10-21 17:48:15.829+08	2026-10-21 17:48:13.942953+08	\N	2026-10-21 17:48:13.942953+08	\N
8b657358-650d-4219-8ea1-2254c8b12046	u_6e32fb7c7f2b7fed	5a5b1ac7c303e98a8d6895089506f8a5931a04214380dd36169b3b121a5263ac	admin	2026-11-20 18:20:08.133+08	\N	2026-10-21 18:20:08.146+08	2026-10-21 18:20:08.134796+08	\N	2026-10-21 18:20:08.134796+08	\N
24abcf87-0f27-4d7a-8c5a-9bd013ad83ad	u_6e32fb7c7f2b7fed	373e6f4df63615b95e0a30ce05b97b7c8af0ea16e8bd043124c208ddd0b02eeb	admin	2026-11-20 18:15:09.943+08	\N	2026-10-21 18:15:25.655+08	2026-10-21 18:15:09.945526+08	\N	2026-10-21 18:15:09.945526+08	\N
07e7e082-cca5-43d4-b0a0-41a2295ec330	u_d21e2a16db0d6ad8	ab493efa46ad31a1b26fe08690b04066820ad54dbc05f0ae12b9ab98de837610	teacher	2026-11-20 17:48:14.254+08	\N	2026-10-21 17:48:16.008+08	2026-10-21 17:48:14.254551+08	\N	2026-10-21 17:48:14.254551+08	\N
917c6af0-ad1a-4a0d-bc1a-48a37635f951	u_040f0825984aaec7	f50fcbfe419314a281a3e78f049a5b5946b6dfdac6c66a7cab95a828e0bc63fb	parent	2026-11-20 17:48:14.409+08	\N	2026-10-21 17:48:16.029+08	2026-10-21 17:48:14.410105+08	\N	2026-10-21 17:48:14.410105+08	\N
0c3c3ac2-d521-4c93-8b9e-ed7a62e50466	u_63838e8eca74d816	e13384f499001c3802f1e24587ea0e439d8586a550b2cfa53842b11678d30e1a	teacher	2026-11-20 17:48:14.099+08	\N	2026-10-21 17:48:16.053+08	2026-10-21 17:48:14.099953+08	\N	2026-10-21 17:48:14.099953+08	\N
68adb23d-1775-4b7b-bb8a-cbbde91b7928	u_d21e2a16db0d6ad8	a0baf0231ab56e640d4a17f1dfb18761d37a003becffe236f0256d2d7e1d18be	teacher	2026-11-20 18:17:00.504+08	\N	2026-10-21 18:17:23.486+08	2026-10-21 18:17:00.50519+08	\N	2026-10-21 18:17:00.50519+08	\N
2d73a2ab-e1bc-4a16-b7bd-cc136887efe6	u_040f0825984aaec7	d9d517d43a27a580a5e45820edaf94e43aecb24e3a0048fd2c6eeccbb690a48d	parent	2026-11-20 18:17:00.658+08	\N	2026-10-21 18:17:23.508+08	2026-10-21 18:17:00.658713+08	\N	2026-10-21 18:17:00.658713+08	\N
183a314b-eab9-4b4a-babe-5d7fbeffed6c	u_f54e97f52836855b	77ed3beeaebedd9a37dfef42a5f32687467184a03b2f9e3f2b964efaeca51cd7	student	2026-11-20 17:48:14.632+08	\N	2026-10-21 17:48:16.153+08	2026-10-21 17:48:14.632759+08	\N	2026-10-21 17:48:14.632759+08	\N
291e1e9f-af6c-45c9-b9ea-693a51d9ae27	u_f54e97f52836855b	1c3d4f5b138f6861614085f7abfada5ade7b3a2a649cff1399de72191f74f075	student	2026-11-20 17:48:57.758+08	\N	2026-10-21 17:48:59.399+08	2026-10-21 17:48:57.758599+08	\N	2026-10-21 17:48:57.758599+08	\N
4fbf7c8e-2401-496e-8da8-9c4ca951305a	u_6e32fb7c7f2b7fed	5b5189766f2fef2cfe777842aee663ac3378a9a706fdf23094c80d345fac8765	admin	2026-11-20 18:15:53.986+08	\N	2026-10-21 18:15:58.239+08	2026-10-21 18:15:53.986589+08	\N	2026-10-21 18:15:53.986589+08	\N
81009da5-f792-4261-9b71-eee3fa470650	u_63838e8eca74d816	1ddbeec645fd7db7eecca81ed2026a0afb7bb8458077e362afd8b7ed6309920d	teacher	2026-11-20 18:17:00.347+08	\N	2026-10-21 18:17:23.531+08	2026-10-21 18:17:00.347614+08	\N	2026-10-21 18:17:00.347614+08	\N
962caf39-ac6e-4057-90be-a5724af4fdd4	u_6e32fb7c7f2b7fed	0081545f6521a9c1dd662fc80e0110a33843a146acb86c7e14740c4b20a5975a	admin	2026-11-20 18:20:40.13+08	\N	2026-10-21 18:20:40.138+08	2026-10-21 18:20:40.130542+08	\N	2026-10-21 18:20:40.130542+08	\N
b34ad074-fd27-4819-a413-65a5bab4c41c	u_6e32fb7c7f2b7fed	da90ab9efccc9866750741a514f36296da05fe74f334cbf487072c495f6acf73	admin	2026-11-20 18:16:11.849+08	\N	2026-10-21 18:16:16.379+08	2026-10-21 18:16:11.849324+08	\N	2026-10-21 18:16:11.849324+08	\N
7c1c5499-a65e-45f2-95ad-f12fcb77a2e5	u_6e32fb7c7f2b7fed	ac28ecb4fc4ac7933df8c61f8d15e6c558405621cdaa1d8b5190ab09a665b2b1	admin	2026-11-20 18:10:01.76+08	\N	2026-10-21 18:10:01.815+08	2026-10-21 18:10:01.760873+08	\N	2026-10-21 18:10:01.760873+08	\N
308608c0-0576-48fa-a1ce-a8997a823c30	u_6e32fb7c7f2b7fed	95ebc0ba3675d25c6df461c86ebe1ad25d540fbeb89d3adec59917fd116e2777	admin	2026-11-20 18:16:49.764+08	\N	2026-10-21 18:16:49.784+08	2026-10-21 18:16:49.764866+08	\N	2026-10-21 18:16:49.764866+08	\N
e2271bc0-fb22-47ec-987e-1b0e56a4a208	u_6e32fb7c7f2b7fed	17f51609ce7a55245afea600582551c2e7e31b45d17fe80295003ab3a758d9be	admin	2026-11-20 17:48:57.073+08	\N	2026-10-21 17:48:58.913+08	2026-10-21 17:48:57.074201+08	\N	2026-10-21 17:48:57.074201+08	\N
0f847e7b-558c-420b-9913-4a99d36122c6	u_6e32fb7c7f2b7fed	adfd0ad33d4b49a859eb48360b72370c7870dc3cf01ad1b0239f7ecda42ae28b	admin	2026-11-20 18:12:58.529+08	\N	2026-10-21 18:13:10.199+08	2026-10-21 18:12:58.53105+08	\N	2026-10-21 18:12:58.53105+08	\N
f4a9594b-c868-43e7-8d4a-027f97edfd41	u_d21e2a16db0d6ad8	5f48dbe68a72df9aeb78ffe074915f99d0bf43ce8ffe988dc935a0d38263e959	teacher	2026-11-20 18:21:13.101+08	\N	2026-10-21 18:21:38.674+08	2026-10-21 18:21:13.102238+08	\N	2026-10-21 18:21:13.102238+08	\N
9248e8ef-6ad3-401f-9c9f-f3cba19dbaef	u_040f0825984aaec7	4923970f793e6699b310013b5ea3becab57d6495c537a94e58989ab3c0dce2a2	parent	2026-11-20 18:21:13.263+08	\N	2026-10-21 18:21:38.701+08	2026-10-21 18:21:13.263983+08	\N	2026-10-21 18:21:13.263983+08	\N
bfe84739-e5d4-435c-855b-bf906b3e8bec	u_63838e8eca74d816	1bceb9356f0457b664fe659b92ef6af79d8b93c119a8a38dc254c15108cd7526	teacher	2026-11-20 18:21:12.94+08	\N	2026-10-21 18:21:38.731+08	2026-10-21 18:21:12.940294+08	\N	2026-10-21 18:21:12.940294+08	\N
f9acef47-9914-4d67-ad44-e1a655d3d4f7	u_f54e97f52836855b	2fb1cdc417adbf3622f77dffcb2f5b085f534642a762d5a4f7b4f68c2e857712	student	2026-11-20 18:21:13.489+08	\N	2026-10-21 18:21:46.904+08	2026-10-21 18:21:13.489793+08	\N	2026-10-21 18:21:13.489793+08	\N
74b4456f-560f-4ec4-9c0f-e66660dd6b6a	u_6e32fb7c7f2b7fed	e0f34679b63e0b900b13392171b288cae74baaf488b3806c9bba61c109741fd5	admin	2026-11-20 18:21:12.779+08	\N	2026-10-21 18:21:32.138+08	2026-10-21 18:21:12.779747+08	\N	2026-10-21 18:21:12.779747+08	\N
\.


--
-- Data for Name: course; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.course (id, student_user_id, teacher_user_id, subject, start_at, end_at, location, status, lesson_count, remark, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
a341b2c2-86a3-48c2-9a51-7a8cf0e923d0	u_747d2315fab64522	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-13 15:07:40.450895+08	\N	2026-10-13 15:07:40.450895+08	\N
ec9f8059-6ae9-4136-83fa-bf8711adbc69	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	pending	1	\N	2026-10-13 22:00:47.822079+08	\N	2026-10-13 22:00:47.822079+08	\N
9458b75b-038e-4bc0-9048-d714cce307c7	u_f54e97f52836855b	u_d21e2a16db0d6ad8	数学	2026-10-16 02:30:00+08	2026-10-16 04:00:00+08	\N	done	1	\N	2026-10-13 22:00:47.849335+08	\N	2026-10-13 22:00:47.849335+08	\N
bfaecf23-103f-48de-b9ea-6dc131d55969	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	pending	1	\N	2026-10-13 22:01:48.635567+08	\N	2026-10-13 22:01:48.635567+08	\N
d18db07d-58ee-41df-af13-1eef4af9e06a	u_f54e97f52836855b	u_d21e2a16db0d6ad8	数学	2026-10-16 02:30:00+08	2026-10-16 04:00:00+08	\N	done	1	\N	2026-10-13 22:01:48.660158+08	\N	2026-10-13 22:01:48.660158+08	\N
55420c51-e19c-4a87-b617-04262e67847c	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	pending	1	\N	2026-10-13 22:02:17.423171+08	\N	2026-10-13 22:02:17.423171+08	\N
15a51c44-6399-4593-9f5c-0fad7a121257	u_f54e97f52836855b	u_d21e2a16db0d6ad8	数学	2026-10-16 02:30:00+08	2026-10-16 04:00:00+08	\N	done	1	\N	2026-10-13 22:02:17.451186+08	\N	2026-10-13 22:02:17.451186+08	\N
1b9c6957-6950-4c80-817f-ae060b4178a2	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-13 22:02:35.7564+08	\N	2026-10-13 22:02:35.7564+08	\N
636d7dfd-a758-4eb1-a1d4-51bfeae83403	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-13 22:32:30.350944+08	\N	2026-10-13 22:32:30.350944+08	\N
6438cfbf-10e8-4f4f-b910-52a38ece58d3	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-17 16:31:39.668014+08	\N	2026-10-17 16:31:39.668014+08	\N
a94861bf-b8dc-4de3-9470-a665b042b83f	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-17 16:31:53.344222+08	\N	2026-10-17 16:31:53.344222+08	\N
25763486-1926-4c81-900a-633728e83e62	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-17 17:24:22.604847+08	\N	2026-10-17 17:24:22.604847+08	\N
d8a3c7a8-f535-427e-9c1a-8d719aec770a	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-17 17:24:42.906245+08	\N	2026-10-17 17:24:42.906245+08	\N
5cef89aa-b925-41b8-9957-fcbd96ed59f9	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-19 11:39:23.644799+08	\N	2026-10-19 11:39:23.644799+08	\N
f3c2f712-bffe-4942-9941-a5f3acbdf96b	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-19 11:39:41.81249+08	\N	2026-10-19 11:39:41.81249+08	\N
206866ed-8396-464a-b880-06546e53b631	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-21 12:03:27.229892+08	\N	2026-10-21 12:03:27.229892+08	\N
a22069f0-29fa-4ab0-ab79-b9c9d60c99d7	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-21 17:48:14.957316+08	\N	2026-10-21 17:48:14.957316+08	\N
aa9fa17f-36f0-4428-a991-4403d74b5eca	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-21 17:48:58.080031+08	\N	2026-10-21 17:48:58.080031+08	\N
692c3964-94e3-4a9c-8199-e5920a06d209	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-21 18:17:01.247274+08	\N	2026-10-21 18:17:01.247274+08	\N
e645dcba-4fdc-4c54-a94d-e0d5a2da1a20	u_f54e97f52836855b	u_63838e8eca74d816	数学	2026-10-15 02:30:00+08	2026-10-15 04:00:00+08	线上	done	1	\N	2026-10-21 18:21:13.800261+08	\N	2026-10-21 18:21:13.800261+08	\N
\.


--
-- Data for Name: education_kb; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.education_kb (id, stage, category, region, title, question, content, keywords, source, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
c50e99bf-a73a-424a-a92f-414a97ae4877	gaokao	timeline	全国	高考考试时间：每年6月7日起	高考是哪几天？	全国统考固定在每年6月7日开始。新高考"3+1+2"省份一般考3天：6月7日语文/数学，6月8日物理或历史/外语，6月9日再选科目（化学/地理/政治/生物）。传统文理分科省份考2天。具体以本省考试院安排为准。	{高考时间,6月7日,考试安排,考试日程}	中国教育在线	2026-10-21 17:01:17.622191+08	\N	2026-10-21 17:01:17.622191+08	\N
0ee02201-8ea7-4527-8ae9-87897c00a4b4	gaokao	timeline	全国	高考报名时间：多集中在10月中旬至11月中旬	高考什么时候报名？	各省2026年高考报名多在2025年10-11月进行，分网上报名与资格确认两个阶段。例如安徽10月17-21日、上海10月13-17日、浙江11月1-10日。往届生/随迁子女需提前准备户籍学籍材料，逾期一般不予补报。	{高考报名,报名时间,网上报名}	中国教育在线 eol.cn	2026-10-21 17:01:17.624618+08	\N	2026-10-21 17:01:17.624618+08	\N
0f7999b8-8b6e-46c9-a39f-043846b973c8	gaokao	timeline	全国	高考出分与志愿填报时间：出分后分批错峰填报	高考成绩什么时候出？志愿什么时候填？	2026年各省查分集中在6月23-26日（上海23日、多数省份24-25日）。志愿填报全部在出分后进行，多省集中于6月25日-7月5日，分批次错峰；专科批次延后至7月下旬。志愿一旦锁定或截止，任何人都不能修改补填。	{查分,出分时间,志愿填报时间,填报截止}	各省教育考试院/中国教育在线	2026-10-21 17:01:17.626544+08	\N	2026-10-21 17:01:17.626544+08	\N
270d9411-8b30-4046-9dec-f68871eb7064	zhongkao	timeline	全国	中考时间：多集中在6月中下旬	中考是哪几天？	各地中考文化课考试多在6月中下旬：如宁波6月20-21日、达州6月12-14日、北京6月24-25日、深圳6月26-28日、广东部分地市6月30日-7月2日。5月为志愿填报月、6月为考试月、7月为录取月是大致节奏。	{中考时间,考试安排,中考日程}	各地市教育局官网	2026-10-21 17:01:17.626835+08	\N	2026-10-21 17:01:17.626835+08	\N
ba124c0b-d0e3-457b-a1d1-1130a1f748b6	zhongkao	timeline	浙江	浙江中考：全省统一命题、两考合一	浙江中考怎么安排？	浙江实行初中学业水平考试，毕业考试与招生考试"两考合一"，全省统一命题。杭州等地考试时间在6月中旬，考语文、数学、英语、科学、社会（开卷）与体育。各市单独划线录取，志愿在考后填报。	{浙江中考,两考合一,杭州中考}	浙江省教育考试院	2026-10-21 17:01:17.627122+08	\N	2026-10-21 17:01:17.627122+08	\N
570a306d-2b04-48d9-ac23-2e4a7f384020	gaokao	policy	全国	新高考"3+1+2"模式已覆盖29个省份	什么是3+1+2？	"3"为语数外统考；"1"为首选科目（物理/历史二选一）；"2"为再选科目（化学/生物/政治/地理四选二）。全国已有29个省份落地新高考，高校按物理类、历史类分列计划、分开划线、分别录取。再选科目采用等级赋分计入总分。	{3+1+2,新高考,首选科目,再选科目,等级赋分}	中国妇女网/教育部	2026-10-21 17:01:17.627436+08	\N	2026-10-21 17:01:17.627436+08	\N
eda828f7-79a9-43f8-be97-cb5db4eecc5c	gaokao	policy	全国	两依据一参考：统一高考+学业水平考试+综合素质评价	高校录取看什么？	高考招生实行"两依据、一参考"：以统一高考成绩和学业水平考试成绩为依据，综合素质评价作参考。这是破除"一考定终身"、多元录取的制度基础。	{两依据一参考,学业水平考试,综合素质评价}	教育部2025年招生工作通知	2026-10-21 17:01:17.627748+08	\N	2026-10-21 17:01:17.627748+08	\N
98b71391-2a7d-4460-8a39-f93a2395c210	zhongkao	policy	全国	指标分配：优质高中过半招生计划分配到初中	什么叫指标到校/名额分配？	多地要求优质普通高中将不低于50%-60%的招生计划分配到区域内初中学校（如北京不低于50%，山东部分县市达60%），促进生源均衡。指标生一般要求本校连续3年学籍，录取线可比统招线低50-100分（各地口径不同）。	{指标到校,名额分配,指标生,统配生}	北京/广州/德州等地中招文件	2026-10-21 17:01:17.628003+08	\N	2026-10-21 17:01:17.628003+08	\N
3c2c0b2a-df1f-4927-a6c3-25e40463d27e	zhongkao	policy	广东	深圳2026中考：总分630分，理化实验增至20分	深圳中考改革改了什么？	深圳2026年起中考总分630分：语数外、理化（含实验20分）、历史、道法（开卷）、体育（含过程性评价）。录取分自主招生、名额分配、统一招生三类五个批次。文化课考试6月26-28日。	{深圳中考,630分,理化实验,自主招生}	深圳市教育局	2026-10-21 17:01:17.6283+08	\N	2026-10-21 17:01:17.6283+08	\N
2df012d9-1b54-4de3-a6f1-5a8e7ca14056	zhongkao	policy	北京	北京2026中考：总分510分，普高扩招约1万人	北京中考满分多少？	北京2026年中招录取总分510分，文化课6月24-25日考试，道法允许携带指定教材进场。普高招生约9.5万人（较2025年增约1万），中职约3.3万人。新增平谷区登记入学试点，7月9日出分、7月13-17日填志愿。	{北京中考,510分,登记入学}	北京教育考试院	2026-10-21 17:01:17.628549+08	\N	2026-10-21 17:01:17.628549+08	\N
a0967c47-a1f5-48dd-81d8-99f8c61c1cb4	zhongkao	policy	全国	中考同分排序规则：先比单科再逐科累加	中考总分相同怎么录取？	各地都有明确的同分处理规则。如宁波：依次比较数学单科→语文+数学→语数英→语数英科→语数英科社五科总分，额满为止。填报前可查本市细则，压线考生尤其要注意。	{同分排序,同分处理,录取规则}	宁波市教育局	2026-10-21 17:01:17.628836+08	\N	2026-10-21 17:01:17.628836+08	\N
50af70d5-2bcf-4d7d-8aa9-963000c3717e	gaokao	zhiyuan	全国	平行志愿核心规则：分数优先、遵循志愿、一轮投档	平行志愿是怎么投档的？	投档时全体考生按分数排队，逐一检索每人所填志愿：从第1个开始，符合条件即投出，不符合再看下一个；档案一旦投出，本批次后续志愿全部失效（一轮投档）。退档后不能补投本批次，只能等征集志愿或下一批次。	{平行志愿,投档规则,一轮投档,分数优先}	江苏省教育考试院/阳光高考	2026-10-21 17:01:17.629115+08	\N	2026-10-21 17:01:17.629115+08	\N
34820af1-88f2-4671-81ee-2c4e9c4c305d	gaokao	zhiyuan	全国	"专业(类)+学校"模式：一个专业一个志愿，无调剂退档风险	什么是专业+学校志愿模式？	河北等省实行"专业(类)+学校"平行志愿：1个院校+1个专业为1个志愿，普通类每次最多96个。不设专业服从调剂，不必担心被调剂，但投档后若不符合该专业要求（体检/单科成绩）仍可能被退档。	{专业+学校,96个志愿,调剂}	河北省教育考试院	2026-10-21 17:01:17.629368+08	\N	2026-10-21 17:01:17.629368+08	\N
1fb8b641-23fc-4d83-811e-ebd32dc8b4bd	gaokao	zhiyuan	全国	"院校专业组"模式：45个组志愿，组内调剂	什么是院校专业组？	多数新高考省份实行"院校专业组"模式：同一院校内选科要求相同的专业组成一组，1个组为1个志愿（如内蒙古/安徽每批45个组志愿）。投档到组后，组内分专业录取，不服从调剂可能被退档。建议45个志愿尽量填满并选服从调剂。	{院校专业组,45个志愿,服从调剂}	安徽/内蒙古考试院	2026-10-21 17:01:17.629603+08	\N	2026-10-21 17:01:17.629603+08	\N
18eee378-f9c0-4c1d-87c3-b0f064126e42	gaokao	zhiyuan	全国	退档与滑档：原因与规避	什么是退档？什么是滑档？	退档：档案已投到高校但被退回（分数偏低且不服从调剂、体检/单科不符），退档后本批次不再投档。滑档：所填所有志愿都没够到投档线。规避方法：准确定位、冲稳保拉开梯度、填满志愿、慎选不服从调剂、避开体检受限专业。	{退档,滑档,冲稳保,梯度}	阳光高考/宿松县招办答疑	2026-10-21 17:01:17.629822+08	\N	2026-10-21 17:01:17.629822+08	\N
806180cb-0ee9-48ca-9d30-8f6ed9864011	gaokao	zhiyuan	全国	征集志愿：本批次未录满计划的补救机会	征集志愿是什么？	每轮平行志愿投档后，未完成计划的高校会公布缺额并征集志愿，退档/滑档考生可在规定时间内补填。征集志愿时间很短（常为半天到一天），需紧盯省考试院通知。	{征集志愿,补录,缺额计划}	广西招生考试院等	2026-10-21 17:01:17.630574+08	\N	2026-10-21 17:01:17.630574+08	\N
34ed2fb3-3960-49bd-8d98-82c56e8f1561	gaokao	zhiyuan	全国	提前批：录取了就不能再参加后面批次	提前批报了会怎样？	提前批在普通批次之前投档，被提前批录取后不再参加后续任何批次录取；未被录取则完全不影响后续批次。每位考生只参加一次录取且不得换录。报考前想清楚是否愿意放弃后面机会。	{提前批,批次顺序}	中国青年网高招答疑	2026-10-21 17:01:17.630837+08	\N	2026-10-21 17:01:17.630837+08	\N
e51c4dfe-6f34-4da4-b930-5e6762fcf814	gaokao	xuanke	全国	物化捆绑：55/92个专业类必选物理+化学	为什么选科要物化同选？	教育部《选考科目要求指引(通用版)》92个专业类中55个要求必选"物理+化学"（占59.78%）；理学、工学、农学、医学四大门类中该比例高达90.16%。2024年起医学、计算机、电子、人工智能等热门专业几乎全面绑定物化。	{物化捆绑,选科要求,指引,理工农医}	教育部选考科目要求指引	2026-10-21 17:01:17.631103+08	\N	2026-10-21 17:01:17.631103+08	\N
7cd5062e-4519-4a48-967d-99bd4df53906	gaokao	xuanke	全国	12种选科组合专业覆盖率：物化X约96%，史地政约45%-58%	各选科组合能报多少专业？	3+1+2共12种组合。含物化的组合（物化生/物化政/物化地）专业覆盖率约95%上下；历史类组合普遍低于50%（史地政约45%-58%）。覆盖率是"能报的专业面"，不是录取难度，历史组合适合人文社科方向且成绩占优的学生。	{选科组合,专业覆盖率,史地政,物化生}	百度百科/凤凰网教育	2026-10-21 17:01:17.631343+08	\N	2026-10-21 17:01:17.631343+08	\N
8cef65b9-f05e-4d63-903e-e8feb485af33	gaokao	xuanke	全国	等级赋分：再选科目按排名赋分，不比绝对分	赋分是怎么回事？	再选科目（化学/生物/政治/地理）按考生在全省同科目内的排名区间转换等级再赋分，计入高考的是赋分而非卷面分。因此再选科目比的是"相对排位"，选科人数多的科目赋分博弈更复杂。	{等级赋分,赋分,再选科目}	凤凰网教育	2026-10-21 17:01:17.631738+08	\N	2026-10-21 17:01:17.631738+08	\N
aef4094c-a010-44e5-a214-c396890710fa	gaokao	special	全国	强基计划：39所双一流，基础学科，校测+高考综合录取	强基计划是什么？怎么报？	面向36所原A类+若干双一流高校的基础学科（数理化生、历史、哲学、古文字学等）招生，按高考成绩（不低于85%）+校测综合录取。一般3-4月报名，高考后校测。入校后小班培养、本硕博衔接，通常不能转专业到非强基方向。	{强基计划,基础学科,校测}	阳光高考平台	2026-10-21 17:01:17.632031+08	\N	2026-10-21 17:01:17.632031+08	\N
d6414020-b587-4183-8c66-b8f65b10f6ad	gaokao	special	全国	综合评价招生：高考+校测+学考多维录取	综合评价怎么报？	综合评价按"高考成绩+高校测试+学业水平考试（+综合素质评价）"折算综合分录取，多省有试点（浙江三位一体、上海综评等）。适合综合成绩稳定、有一定面试/综合素质表现的考生，一般在4-5月报名。	{综合评价,三位一体,多元录取}	西部时报网等	2026-10-21 17:01:17.632243+08	\N	2026-10-21 17:01:17.632243+08	\N
24df228f-fd4a-411f-94ff-f290aa030667	gaokao	special	全国	三大专项计划：国家/高校/地方专项面向农村和脱贫地区	农村学生有什么降分升学通道？	国家专项：实施区域县户籍+当地3年学籍；高校专项（农村学生单独招生）：农村户籍+3年学籍，4月下旬前在阳光高考平台报名；地方专项：本省农村户籍，由省属重点高校承担。往年被专项录取后放弃入学的不再有资格。具体实施区域以本省文件为准。	{国家专项,高校专项,地方专项,农村专项}	教育部/各省教育厅通知	2026-10-21 17:01:17.632498+08	\N	2026-10-21 17:01:17.632498+08	\N
1272d703-97a8-426c-802a-1a933314fb06	gaokao	faq	全国	我考了XX分能上什么大学？怎么查分数线？	我考了580分能报哪些大学？	没有人能直接承诺某分能录某校。正规途径：①本省《普通高校招生录取分数分布统计》（一分一段）；②省考试院志愿填报辅助系统；③目标高校官网历年录取分数；④直接咨询高校招办。核心是用"位次"而不是裸分对比往年。	{分数线,一分一段,位次,查分}	中国青年网高招答疑	2026-10-21 17:01:17.63273+08	\N	2026-10-21 17:01:17.63273+08	\N
d217159c-cf0a-468f-836f-7f9936c4d4f6	gaokao	faq	全国	不予录取与不宜就读的区别	体检结论影响录取吗？	"不予录取"：学校不能录取，即使分数达标（如色盲报医学）；"不宜就读"：仅供参考，学校不得以此拒录达标考生。填报前务必对照《普通高等学校招生体检工作指导意见》和院校招生章程。	{体检,不予录取,不宜就读,招生章程}	阳光高考	2026-10-21 17:01:17.63292+08	\N	2026-10-21 17:01:17.63292+08	\N
0202cb60-001d-43c6-b04c-8cf8079d636c	gaokao	faq	全国	志愿填多少个？要不要填满？	志愿要填满吗？	建议填满。志愿越多风险越分散，用"冲稳保"三段拉开梯度：冲的略高于自己位次、稳的与位次相当、保的明显低于位次且服从调剂。只填几个热门志愿是滑档的最常见原因。	{填满,冲稳保,志愿数量}	安徽省教育厅在线答疑	2026-10-21 17:01:17.633156+08	\N	2026-10-21 17:01:17.633156+08	\N
29814bac-9aac-45a7-9d28-463adca46653	gaokao	faq	全国	志愿锁定/截止后不能修改，注意填报收尾	志愿提交后还能改吗？	志愿一旦"锁定"或填报时间截止，考生本人及任何单位都不能更改、补填（如广西明文规定）。建议提前1天完成提交并截图确认，避免最后一天系统拥堵或超时。	{锁定,修改志愿,截止}	广西招生考试院	2026-10-21 17:01:17.633412+08	\N	2026-10-21 17:01:17.633412+08	\N
856f53c2-1e9d-4a03-b54a-897de0a9de79	zhongkao	faq	广东	广州名额分配：户籍生升优质公办高中的主要途径	广州名额分配怎么报名？	名额分配是优质公办高中把部分计划分配到初中学校的招生方式，已成广州户籍生升优质公办高中的主要途径。省市属高中面向全市初中分配，区属高中只面向本区（老三区各自独立）。有最低录取控制线与校内排名竞争。	{广州,名额分配,指标生}	广州市招考办	2026-10-21 17:01:17.633609+08	\N	2026-10-21 17:01:17.633609+08	\N
7d2175bb-9cc3-41fb-a7e8-c5c0463022a7	zhongkao	faq	甘肃	兰州统配生：需三年在籍在校，线下50分内录取	统配生要什么条件？	兰州享受对口分配指标（统配生）需：划拨入学且三年在籍在校（市外转入需两年以上学籍）、综合素质评价2A3B且思想品德A、填报对口高中、成绩在统招线下50分以内。统配线按初中学校分别划定。	{兰州,统配生,对口分配}	兰州市政府	2026-10-21 17:01:17.633824+08	\N	2026-10-21 17:01:17.633824+08	\N
465bc1a3-bf83-41fc-aa0f-9889b97c8530	zhongkao	faq	山东	指标生资格：连续3年完整学籍是硬门槛	指标生为什么没资格？	多地（山东聊城等）规定自2022级新生起，须具有所在初中3年完整学籍才享受指标生政策；人籍分离、学籍不满年限的学生不享受。转学生家长要提前核验学籍状态。	{指标生资格,学籍,转学}	冠县教体局	2026-10-21 17:01:17.634051+08	\N	2026-10-21 17:01:17.634051+08	\N
4611d71c-f431-41c8-8e3e-ca01eeb44d07	zhongkao	faq	全国	自主招生/特长生：提前批录取，需专业测试	特长生怎么录取？	普通高中特色项目自主招生（含体艺特长生）一般在提前批，需先通过学校专业测试取得资格，再按中考投档分+专业成绩择优录取。已被自主招生录取的考生不能再参加后续统招批次。	{自主招生,特长生,提前批,专业测试}	莆田/德州等地中招文件	2026-10-21 17:01:17.634233+08	\N	2026-10-21 17:01:17.634233+08	\N
6b00ea45-bf79-430c-889e-5a10fccd6ae6	zhongkao	faq	全国	普职分流与综合高中：升学路径多元	中考没上普高线怎么办？	中考后有三条主要路径：普通高中、中职学校（可参加职教高考/高职分类考试升大学）、综合高中（普职融通，部分地区已纳入统一志愿批次，如达州2026年新增综合高中志愿）。普职比整体在放宽，选择面比以前大。	{普职分流,综合高中,中职,职教高考}	达州/北京中招文件	2026-10-21 17:01:17.63443+08	\N	2026-10-21 17:01:17.63443+08	\N
e6dd65ff-16a2-41c0-a63a-2de330dbef55	gaokao	faq	全国	模考成绩与高考差距：一般高考略高于模考	模考考砸了还有救吗？	模考的功能是暴露问题而非预测结果。通常一轮模考偏难、学生后期通过错题归因和专题补漏仍有明显提分空间；建议把模考失分按"概念不清/计算失误/审题偏差/步骤缺失"归因，配合针对性练习，这也是本平台错题本+遗忘曲线复习的设计逻辑。	{模考,错题,提分,备考}	平台教研整理	2026-10-21 17:01:17.634645+08	\N	2026-10-21 17:01:17.634645+08	\N
822109af-e70c-4df7-9dbb-3f3e5c1af1d0	gaokao	faq	全国	高考复习节奏：一轮全覆盖、二轮专题、三轮冲刺	高三怎么规划复习？	通用节奏：一轮复习（9月-次年2月）全覆盖打基础；二轮（3-4月）专题突破+综合卷；三轮（5月）真题模拟+回归课本错题。家教辅导应与学校节奏错位互补：一轮跟学校查漏，二三轮做个性化专题。	{一轮复习,二轮,三轮,备考规划}	平台教研整理	2026-10-21 17:01:17.634872+08	\N	2026-10-21 17:01:17.634872+08	\N
f95a5602-a13e-4fd8-a55a-828e8e757b0c	gaokao	faq	全国	itest临时条目	\N	itest 覆盖更新	{}	\N	2026-10-21 17:48:59.36324+08	\N	2026-10-21 18:21:46.886+08	\N
\.


--
-- Data for Name: family; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.family (id, name, owner_user_id, invite_code, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
d6330b7e-3d8c-423e-99d4-f264491b866d	林爸的家庭	u_040f0825984aaec7	9B8E55	2026-10-13 15:07:39.576628+08	\N	2026-10-13 15:07:39.576628+08	\N
\.


--
-- Data for Name: guardian_link; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guardian_link (id, parent_user_id, student_user_id, relation_type, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
357bb703-6411-4cd7-b68e-18dafb7d0855	u_c19a69234435324d	u_79d5fa6a29291a39	parent	2026-10-12 15:28:51.729621+08	\N	2026-10-12 15:28:51.729621+08	\N
7cfde6dc-263e-46b8-86d9-11bebb0bf673	u_834839c0a28fea41	u_732f2a19e581c741	parent	2026-10-12 22:52:54.267082+08	\N	2026-10-12 22:52:54.267082+08	\N
\.


--
-- Data for Name: lesson_account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lesson_account (id, student_user_id, subject, total_lessons, used_lessons, alert_threshold, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
46c31f1f-c48c-41ab-b0bc-1e218125c818	u_747d2315fab64522	数学	20	1	3	2026-10-13 15:07:40.48016+08	\N	2026-10-13 15:07:40.48016+08	\N
d785db47-c8d8-460b-9047-33f349210941	u_f54e97f52836855b	数学	320	19	3	2026-10-13 22:00:48.070557+08	\N	2026-10-13 22:00:48.070557+08	\N
\.


--
-- Data for Name: lesson_ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lesson_ledger (id, student_user_id, subject, change_amount, change_type, course_id, operator_user_id, remark, _created_at, _created_by, _updated_at, _updated_by, confirmed_at, confirmed_by) FROM stdin;
1c4db26b-9a27-42f1-8d54-e43450d93191	u_747d2315fab64522	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	后台发放课时	2026-10-13 15:07:40.481441+08	\N	2026-10-13 15:07:40.481441+08	\N	\N	\N
479f4fde-e2f0-428e-a6c4-6e609a4dc436	u_747d2315fab64522	数学	-1	consume	a341b2c2-86a3-48c2-9a51-7a8cf0e923d0	u_63838e8eca74d816	数学 课程消课	2026-10-13 15:07:40.658205+08	\N	2026-10-13 15:07:40.658205+08	\N	\N	\N
846f31f6-5a70-4a1a-bfb9-d26b9225a866	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-13 22:00:48.071526+08	\N	2026-10-13 22:00:48.071526+08	\N	\N	\N
d34112b0-d7ce-4e45-9686-948b258c6767	u_f54e97f52836855b	数学	-1	consume	9458b75b-038e-4bc0-9048-d714cce307c7	u_63838e8eca74d816	数学 课程消课	2026-10-13 22:00:48.142641+08	\N	2026-10-13 22:00:48.142641+08	\N	\N	\N
951ef710-3f72-4ef4-99d6-f496e1cbedd4	u_f54e97f52836855b	数学	-1	consume	9458b75b-038e-4bc0-9048-d714cce307c7	u_d21e2a16db0d6ad8	数学 课程消课	2026-10-13 22:00:48.172994+08	\N	2026-10-13 22:00:48.172994+08	\N	\N	\N
6d35ff38-fa98-4071-b5c3-2592f0690e77	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-13 22:01:48.879822+08	\N	2026-10-13 22:01:48.879822+08	\N	\N	\N
4242592b-c509-4599-920b-034183d9fa44	u_f54e97f52836855b	数学	-1	consume	d18db07d-58ee-41df-af13-1eef4af9e06a	u_63838e8eca74d816	数学 课程消课	2026-10-13 22:01:48.95423+08	\N	2026-10-13 22:01:48.95423+08	\N	\N	\N
f07bb6f8-6808-4772-8c2d-bd29ded542ba	u_f54e97f52836855b	数学	-1	consume	d18db07d-58ee-41df-af13-1eef4af9e06a	u_d21e2a16db0d6ad8	数学 课程消课	2026-10-13 22:01:48.981858+08	\N	2026-10-13 22:01:48.981858+08	\N	\N	\N
cdb65160-dcb3-4353-95de-98525c14a2bb	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-13 22:02:17.66932+08	\N	2026-10-13 22:02:17.66932+08	\N	\N	\N
b72565ee-e870-4f1d-ad8d-07ddd68691f9	u_f54e97f52836855b	数学	-1	consume	15a51c44-6399-4593-9f5c-0fad7a121257	u_63838e8eca74d816	数学 课程消课	2026-10-13 22:02:17.739165+08	\N	2026-10-13 22:02:17.739165+08	\N	\N	\N
3f53d0d2-4ffd-4ef7-9105-81411066f168	u_f54e97f52836855b	数学	-1	consume	15a51c44-6399-4593-9f5c-0fad7a121257	u_d21e2a16db0d6ad8	数学 课程消课	2026-10-13 22:02:17.76207+08	\N	2026-10-13 22:02:17.76207+08	\N	\N	\N
b7c9c9c5-d760-483a-ba76-4f06503ea036	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-13 22:02:35.96803+08	\N	2026-10-13 22:02:35.96803+08	\N	\N	\N
c4dbe1df-1795-40da-a43e-5a04bd6a8ee5	u_f54e97f52836855b	数学	-1	consume	1b9c6957-6950-4c80-817f-ae060b4178a2	u_63838e8eca74d816	数学 课程消课	2026-10-13 22:02:36.039555+08	\N	2026-10-13 22:02:36.039555+08	\N	\N	\N
5f79d074-7314-4c8f-a385-79f20da1f0f0	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-13 22:32:30.570651+08	\N	2026-10-13 22:32:30.570651+08	\N	\N	\N
966c3a0c-0670-43a2-8045-9c6244520ddd	u_f54e97f52836855b	数学	-1	consume	636d7dfd-a758-4eb1-a1d4-51bfeae83403	u_63838e8eca74d816	数学 课程消课	2026-10-13 22:32:30.643922+08	\N	2026-10-13 22:32:30.643922+08	\N	\N	\N
2d5c3629-222e-4dd4-8af4-4048bc9ef8f1	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-17 16:31:39.96587+08	\N	2026-10-17 16:31:39.96587+08	\N	\N	\N
c674114f-08dc-4b7b-91e0-23facf6203a2	u_f54e97f52836855b	数学	-1	consume	6438cfbf-10e8-4f4f-b910-52a38ece58d3	u_63838e8eca74d816	数学 课程消课	2026-10-17 16:31:40.063729+08	\N	2026-10-17 16:31:40.063729+08	\N	\N	\N
e5525966-475a-4c26-9ca1-e21d9693f7ba	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-17 16:31:53.584159+08	\N	2026-10-17 16:31:53.584159+08	\N	\N	\N
a5c532ba-9346-4a8a-ab8c-b29d2114fd6f	u_f54e97f52836855b	数学	-1	consume	a94861bf-b8dc-4de3-9470-a665b042b83f	u_63838e8eca74d816	数学 课程消课	2026-10-17 16:31:53.663406+08	\N	2026-10-17 16:31:53.663406+08	\N	\N	\N
8a77069a-3653-4820-9ce9-c828871e9b8b	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-17 17:24:22.887056+08	\N	2026-10-17 17:24:22.887056+08	\N	\N	\N
48a848b6-8dff-41b7-a85c-36895177b1b2	u_f54e97f52836855b	数学	-1	consume	25763486-1926-4c81-900a-633728e83e62	u_63838e8eca74d816	数学 课程消课	2026-10-17 17:24:22.974774+08	\N	2026-10-17 17:24:22.974774+08	\N	\N	\N
55e42b47-54c7-47ce-8aa1-8f9b48a72173	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-17 17:24:43.142653+08	\N	2026-10-17 17:24:43.142653+08	\N	\N	\N
37cc0e49-16cb-4cb7-8da1-83394c929b90	u_f54e97f52836855b	数学	-1	consume	d8a3c7a8-f535-427e-9c1a-8d719aec770a	u_63838e8eca74d816	数学 课程消课	2026-10-17 17:24:43.222141+08	\N	2026-10-17 17:24:43.222141+08	\N	\N	\N
732f5054-f22c-4764-bdb0-1ff8840f424e	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-19 11:39:23.868922+08	\N	2026-10-19 11:39:23.868922+08	\N	\N	\N
7439a5c4-d19b-4ee4-aac3-3339e0ca67dc	u_f54e97f52836855b	数学	-1	consume	5cef89aa-b925-41b8-9957-fcbd96ed59f9	u_63838e8eca74d816	数学 课程消课	2026-10-19 11:39:23.94301+08	\N	2026-10-19 11:39:23.94301+08	\N	\N	\N
012c8ca6-4435-401b-9a02-dcf687c8327c	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-19 11:39:42.222722+08	\N	2026-10-19 11:39:42.222722+08	\N	\N	\N
81d635fc-29a4-4fa7-9560-223f05d4952f	u_f54e97f52836855b	数学	-1	consume	f3c2f712-bffe-4942-9941-a5f3acbdf96b	u_63838e8eca74d816	数学 课程消课	2026-10-19 11:39:42.380563+08	\N	2026-10-19 11:39:42.380563+08	\N	\N	\N
c5efc140-b3dd-418f-9740-e863d266e141	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-21 12:03:27.356339+08	\N	2026-10-21 12:03:27.356339+08	\N	\N	\N
dba52f99-b59d-4f5d-a456-71144d62ae89	u_f54e97f52836855b	数学	-1	consume	206866ed-8396-464a-b880-06546e53b631	u_63838e8eca74d816	数学 课程消课	2026-10-21 12:03:27.40799+08	\N	2026-10-21 12:03:27.40799+08	\N	\N	\N
8d09559c-66b3-46ad-a04b-74036a533375	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-21 17:48:15.178689+08	\N	2026-10-21 17:48:15.178689+08	\N	\N	\N
d65919e1-2219-4352-ab31-2e21bc2a4921	u_f54e97f52836855b	数学	-1	consume	a22069f0-29fa-4ab0-ab79-b9c9d60c99d7	u_63838e8eca74d816	数学 课程消课	2026-10-21 17:48:15.247548+08	\N	2026-10-21 17:48:15.247548+08	\N	\N	\N
c9f8eb6a-3b8f-4733-9c88-6e893d71f0ed	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-21 17:48:58.294563+08	\N	2026-10-21 17:48:58.294563+08	\N	\N	\N
e1ee82fa-31fb-436f-990e-91cbbaa736c2	u_f54e97f52836855b	数学	-1	consume	aa9fa17f-36f0-4428-a991-4403d74b5eca	u_63838e8eca74d816	数学 课程消课	2026-10-21 17:48:58.37673+08	\N	2026-10-21 17:48:58.37673+08	\N	\N	\N
56a89c32-fc7b-4dc8-acb4-40646c97e192	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-21 18:17:01.502463+08	\N	2026-10-21 18:17:01.502463+08	\N	\N	\N
5aaa9a87-8cde-4bae-9c0a-b08650456aee	u_f54e97f52836855b	数学	-1	consume	692c3964-94e3-4a9c-8199-e5920a06d209	u_63838e8eca74d816	数学 课程消课	2026-10-21 18:17:01.592645+08	\N	2026-10-21 18:17:01.592645+08	\N	\N	\N
5c86ea2d-206d-4f12-8a87-43149333edd8	u_f54e97f52836855b	数学	20	purchase	\N	u_6e32fb7c7f2b7fed	联调用	2026-10-21 18:21:14.040558+08	\N	2026-10-21 18:21:14.040558+08	\N	\N	\N
ed464225-9281-452e-ba68-eab9b48e0802	u_f54e97f52836855b	数学	-1	consume	e645dcba-4fdc-4c54-a94d-e0d5a2da1a20	u_63838e8eca74d816	数学 课程消课	2026-10-21 18:21:14.12913+08	\N	2026-10-21 18:21:14.12913+08	\N	\N	\N
\.


--
-- Data for Name: notice_message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notice_message (id, user_id, msg_type, title, content, link_path, is_read, _created_at, _created_by, _updated_at, _updated_by, priority) FROM stdin;
e446ee01-5383-42cd-99cb-e75206ee59a2	u_747d2315fab64522	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 15:07:40.456621+08	\N	2026-10-13 15:07:40.456621+08	\N	normal
fed6ed1d-4911-4f29-9ccf-89241d3fc6b4	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 15:07:40.459034+08	\N	2026-10-13 15:07:40.459034+08	\N	normal
05e137d4-75b8-42e6-9771-4a351f3bb717	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 15:07:40.460513+08	\N	2026-10-13 15:07:40.460513+08	\N	normal
eb1b5f51-1ffd-44b8-9563-528dc1d75cb1	u_747d2315fab64522	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 15:07:40.484783+08	\N	2026-10-13 15:07:40.484783+08	\N	urgent
be8863a5-9ed3-4c68-bbc1-5414fe100690	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 15:07:40.485705+08	\N	2026-10-13 15:07:40.485705+08	\N	urgent
14d44fba-8e81-4e00-96d0-891ea66b10ac	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 15:07:40.48663+08	\N	2026-10-13 15:07:40.48663+08	\N	urgent
bab2e31f-66cf-4a0f-9713-4af8fba0b31c	u_747d2315fab64522	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 15:07:40.511273+08	\N	2026-10-13 15:07:40.511273+08	\N	normal
e271ca25-a3cf-4e1d-9511-d43322beaccd	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 15:07:40.513074+08	\N	2026-10-13 15:07:40.513074+08	\N	normal
1434525a-80d9-4561-8bf0-9834f3eb93b5	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 15:07:40.514769+08	\N	2026-10-13 15:07:40.514769+08	\N	normal
689eb303-2bb6-4987-92eb-420c46a10c4f	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-13 15:07:40.560364+08	\N	2026-10-13 15:07:40.560364+08	\N	normal
f4b84baa-e1c1-41ef-8939-d3a03eaaabb6	u_747d2315fab64522	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 15:07:40.612703+08	\N	2026-10-13 15:07:40.612703+08	\N	normal
fb1ea842-fda6-47df-bde4-567f4b67c57d	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 15:07:40.614625+08	\N	2026-10-13 15:07:40.614625+08	\N	normal
0f6170a7-f39a-4104-ac58-e6ea558db5b0	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 15:07:40.61624+08	\N	2026-10-13 15:07:40.61624+08	\N	normal
d13f38ad-bed6-4bb2-a0c1-c1153ac4edb4	u_747d2315fab64522	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 19 课时，请核对后确认	/lessons	f	2026-10-13 15:07:40.662614+08	\N	2026-10-13 15:07:40.662614+08	\N	urgent
7a1f0caa-eb3a-49b7-9644-95444706ec2a	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 19 课时，请核对后确认	/lessons	f	2026-10-13 15:07:40.663575+08	\N	2026-10-13 15:07:40.663575+08	\N	urgent
50766989-5c91-41be-a4d1-1212b291a8ab	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 19 课时，请核对后确认	/lessons	f	2026-10-13 15:07:40.664467+08	\N	2026-10-13 15:07:40.664467+08	\N	urgent
c65f62b4-43bc-4550-940a-172a2c3dc1d4	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 21:54:59.360302+08	\N	2026-10-13 21:54:59.360302+08	\N	normal
ecc389a3-8312-44b9-9b11-ad41edc6957a	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 21:54:59.363176+08	\N	2026-10-13 21:54:59.363176+08	\N	normal
5fc5156d-0e88-4350-acdd-c17e67b83b94	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 21:54:59.364032+08	\N	2026-10-13 21:54:59.364032+08	\N	normal
63d4cd89-68bb-4cd8-8f85-597b459f708d	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 21:54:59.364742+08	\N	2026-10-13 21:54:59.364742+08	\N	normal
bb3a4075-b568-49a1-b945-ed875a9fccf8	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 21:54:59.365609+08	\N	2026-10-13 21:54:59.365609+08	\N	normal
a0d8099d-5c9d-4267-878a-4f0c8e9a99ea	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 21:54:59.366651+08	\N	2026-10-13 21:54:59.366651+08	\N	normal
4133daac-8d9e-41f5-b5f5-073d1fd5c5a4	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 21:54:59.367601+08	\N	2026-10-13 21:54:59.367601+08	\N	normal
ac7c6044-c95b-4272-8634-33b5d2ec1ee8	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:00:47.827878+08	\N	2026-10-13 22:00:47.827878+08	\N	normal
1021ce48-111a-4555-9954-018af01f84a6	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:00:47.829049+08	\N	2026-10-13 22:00:47.829049+08	\N	normal
36e365f8-b161-478d-86f8-f27f83430e16	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:00:47.830071+08	\N	2026-10-13 22:00:47.830071+08	\N	normal
ab987761-14c8-4324-ac77-c9fbf76980ff	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:00:47.853451+08	\N	2026-10-13 22:00:47.853451+08	\N	normal
4ba7b9ac-9c19-4a0d-b405-ee30bd8870bc	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:00:47.854723+08	\N	2026-10-13 22:00:47.854723+08	\N	normal
4c596f0f-4a58-4e16-8e28-cf29397d4753	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:00:47.8559+08	\N	2026-10-13 22:00:47.8559+08	\N	normal
a287577b-8670-4e3c-afb4-d2d5622bda8c	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:00:47.883906+08	\N	2026-10-13 22:00:47.883906+08	\N	normal
29ddbfb9-6938-44b3-88bc-ab78a2cb5fe8	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:00:47.884909+08	\N	2026-10-13 22:00:47.884909+08	\N	normal
793afc40-ff0c-4150-a3e2-29dc778fdf88	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:00:47.885632+08	\N	2026-10-13 22:00:47.885632+08	\N	normal
e0c96d3b-00ce-4e72-b83a-fb7db526cf0c	u_f54e97f52836855b	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:00:47.908466+08	\N	2026-10-13 22:00:47.908466+08	\N	normal
0e2eac00-35b6-46a0-a76c-d6e9d48aec4d	u_040f0825984aaec7	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:00:47.909824+08	\N	2026-10-13 22:00:47.909824+08	\N	normal
33c35300-5eb8-49f3-9464-ccd5d59babfc	u_df4fc0f2b5018074	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:00:47.911489+08	\N	2026-10-13 22:00:47.911489+08	\N	normal
31ef7a3f-c29d-4af5-a578-b37fff2f5e79	u_d21e2a16db0d6ad8	task	学生已提交打卡	任务「越权任务」已提交，待批阅	/teacher	f	2026-10-13 22:00:47.976061+08	\N	2026-10-13 22:00:47.976061+08	\N	normal
7a400deb-15f1-4874-a4c6-f389def3f0c8	u_f54e97f52836855b	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:00:48.021815+08	\N	2026-10-13 22:00:48.021815+08	\N	normal
987f7450-696d-4cdb-8303-e974e21a65e1	u_040f0825984aaec7	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:00:48.022592+08	\N	2026-10-13 22:00:48.022592+08	\N	normal
8cd29f1f-c932-4d86-90e7-0da7d388fa9f	u_df4fc0f2b5018074	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:00:48.023299+08	\N	2026-10-13 22:00:48.023299+08	\N	normal
e1db7d64-e64b-4a22-add1-8e5ef4d018b1	u_f54e97f52836855b	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:00:48.04642+08	\N	2026-10-13 22:00:48.04642+08	\N	normal
f62ebec8-fc18-46a1-b292-8a1397441326	u_040f0825984aaec7	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:00:48.047042+08	\N	2026-10-13 22:00:48.047042+08	\N	normal
41752f48-2fae-4f2a-9b7e-44be919591f7	u_df4fc0f2b5018074	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:00:48.047634+08	\N	2026-10-13 22:00:48.047634+08	\N	normal
599f72e3-428d-4176-84c5-911600607b58	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:00:48.073083+08	\N	2026-10-13 22:00:48.073083+08	\N	urgent
f7dad03c-1816-4685-8b3a-4c86ea2edad8	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:00:48.073588+08	\N	2026-10-13 22:00:48.073588+08	\N	urgent
27c3fe01-dad7-4b83-b068-8bd7e2f4f645	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:00:48.074035+08	\N	2026-10-13 22:00:48.074035+08	\N	urgent
85718ed6-d028-408c-84d4-5f442c44fd23	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 19 课时，请核对后确认	/lessons	f	2026-10-13 22:00:48.147892+08	\N	2026-10-13 22:00:48.147892+08	\N	urgent
dd77a33c-e30e-49a5-a444-469548197e74	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 19 课时，请核对后确认	/lessons	f	2026-10-13 22:00:48.148406+08	\N	2026-10-13 22:00:48.148406+08	\N	urgent
d6a8798c-67ed-42c4-b02e-b6fc9eb5b097	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 19 课时，请核对后确认	/lessons	f	2026-10-13 22:00:48.150583+08	\N	2026-10-13 22:00:48.150583+08	\N	urgent
99be32ee-d9eb-495a-acb5-852b41d33088	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 18 课时，请核对后确认	/lessons	f	2026-10-13 22:00:48.176171+08	\N	2026-10-13 22:00:48.176171+08	\N	urgent
5c75f565-6c5d-4ee3-ba05-aefe0aa5dd00	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 18 课时，请核对后确认	/lessons	f	2026-10-13 22:00:48.176828+08	\N	2026-10-13 22:00:48.176828+08	\N	urgent
938bf8ef-b39e-4ab3-9d75-c17dbfa33266	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 18 课时，请核对后确认	/lessons	f	2026-10-13 22:00:48.177201+08	\N	2026-10-13 22:00:48.177201+08	\N	urgent
16feeba5-7c37-4e03-b1e8-b73f0f15da76	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:00:48.270415+08	\N	2026-10-13 22:00:48.270415+08	\N	normal
be810ace-5a0a-4caa-a7ed-26921f410df6	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:00:48.271122+08	\N	2026-10-13 22:00:48.271122+08	\N	normal
d6b689fd-d05b-45d2-a537-1a5a422b4fae	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:00:48.271839+08	\N	2026-10-13 22:00:48.271839+08	\N	normal
55d583f1-dccd-48d1-92a5-2a8a81374688	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:00:48.27267+08	\N	2026-10-13 22:00:48.27267+08	\N	normal
366ec9f2-96f3-4cf3-9fda-4d46c341b89c	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:00:48.2819+08	\N	2026-10-13 22:00:48.2819+08	\N	normal
62ba228d-7610-4506-958b-bb2347d69e12	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:00:48.283505+08	\N	2026-10-13 22:00:48.283505+08	\N	normal
77a4eeea-f958-42bc-8a79-e49e3fb15753	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:00:48.285837+08	\N	2026-10-13 22:00:48.285837+08	\N	normal
94d3d676-0a5f-4480-99c1-171a7caf6b2d	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:01:48.638129+08	\N	2026-10-13 22:01:48.638129+08	\N	normal
4e57544a-8c0f-4ef4-adf7-66aa91662c30	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:01:48.639623+08	\N	2026-10-13 22:01:48.639623+08	\N	normal
446500af-ee71-427e-8367-2b5d702ba834	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:01:48.640618+08	\N	2026-10-13 22:01:48.640618+08	\N	normal
23bc3224-da6f-4a09-a156-1027940f8d42	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:01:48.662379+08	\N	2026-10-13 22:01:48.662379+08	\N	normal
855d8057-1113-4295-8794-a761271f70f8	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:01:48.663492+08	\N	2026-10-13 22:01:48.663492+08	\N	normal
331b733b-9685-4832-b769-3b2b337333f5	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:01:48.664315+08	\N	2026-10-13 22:01:48.664315+08	\N	normal
644f0c8d-659e-47f9-b756-e726b5713502	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:01:48.690944+08	\N	2026-10-13 22:01:48.690944+08	\N	normal
2c435ee7-e598-4fc7-ae48-7ffe61d6655f	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:01:48.691878+08	\N	2026-10-13 22:01:48.691878+08	\N	normal
9adc71ea-4cf4-40ed-a7c5-e77473b1c132	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:01:48.692938+08	\N	2026-10-13 22:01:48.692938+08	\N	normal
4dddf716-1835-4962-8475-98cc10bae15e	u_f54e97f52836855b	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:01:48.715827+08	\N	2026-10-13 22:01:48.715827+08	\N	normal
cad5763b-48df-46d4-a2bb-daa640c27a86	u_040f0825984aaec7	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:01:48.716754+08	\N	2026-10-13 22:01:48.716754+08	\N	normal
0c5ed239-53ad-4559-ab56-708dbb082665	u_df4fc0f2b5018074	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:01:48.717597+08	\N	2026-10-13 22:01:48.717597+08	\N	normal
d7e19239-efcd-4540-b6b1-86942b3e2698	u_d21e2a16db0d6ad8	task	学生已提交打卡	任务「越权任务」已提交，待批阅	/teacher	f	2026-10-13 22:01:48.776709+08	\N	2026-10-13 22:01:48.776709+08	\N	normal
13f73163-bdf8-4d8d-846c-1f3c7fba348b	u_f54e97f52836855b	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:01:48.825911+08	\N	2026-10-13 22:01:48.825911+08	\N	normal
3c47c23c-8b9d-4079-86b1-53642ab15213	u_040f0825984aaec7	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:01:48.826955+08	\N	2026-10-13 22:01:48.826955+08	\N	normal
7ae2c7c6-cdf1-4139-b93c-57b46b9dee85	u_df4fc0f2b5018074	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:01:48.827793+08	\N	2026-10-13 22:01:48.827793+08	\N	normal
742f834d-a269-4ed7-9e82-266d149ba4f0	u_f54e97f52836855b	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:01:48.854098+08	\N	2026-10-13 22:01:48.854098+08	\N	normal
4ad5a49c-1789-4526-ad13-320a65bee0c5	u_040f0825984aaec7	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:01:48.855105+08	\N	2026-10-13 22:01:48.855105+08	\N	normal
d61b39be-2480-437c-a1a4-e00ce21b348d	u_df4fc0f2b5018074	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:01:48.856171+08	\N	2026-10-13 22:01:48.856171+08	\N	normal
9a1be1a5-87a1-420e-b631-71acba7ea2db	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:01:48.881461+08	\N	2026-10-13 22:01:48.881461+08	\N	urgent
518037a4-2b0b-4864-88f2-8fdc5211a6f2	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:01:48.881982+08	\N	2026-10-13 22:01:48.881982+08	\N	urgent
57d2d6db-c933-41d0-9afc-e73665e676b3	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:01:48.882693+08	\N	2026-10-13 22:01:48.882693+08	\N	urgent
bc161f37-6335-486c-b424-163125de7601	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 37 课时，请核对后确认	/lessons	f	2026-10-13 22:01:48.958433+08	\N	2026-10-13 22:01:48.958433+08	\N	urgent
87489e08-e05d-47c1-be4a-14f96abc568a	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 37 课时，请核对后确认	/lessons	f	2026-10-13 22:01:48.95908+08	\N	2026-10-13 22:01:48.95908+08	\N	urgent
08788665-5761-45c0-9ae9-10cc8fd6793c	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 37 课时，请核对后确认	/lessons	f	2026-10-13 22:01:48.959596+08	\N	2026-10-13 22:01:48.959596+08	\N	urgent
d3864e99-8e6c-449a-a9af-675800629866	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 36 课时，请核对后确认	/lessons	f	2026-10-13 22:01:48.984858+08	\N	2026-10-13 22:01:48.984858+08	\N	urgent
eca3cd04-0e78-453a-9c8e-240d8bd78cb0	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 36 课时，请核对后确认	/lessons	f	2026-10-13 22:01:48.985365+08	\N	2026-10-13 22:01:48.985365+08	\N	urgent
553a5f25-9156-4cdd-8368-e06347209728	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 36 课时，请核对后确认	/lessons	f	2026-10-13 22:01:48.985861+08	\N	2026-10-13 22:01:48.985861+08	\N	urgent
b82c8d55-4b4f-4637-becc-43b7e1a163d2	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:01:49.079236+08	\N	2026-10-13 22:01:49.079236+08	\N	normal
1281edae-727c-4170-8ad8-cde03c391a70	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:01:49.079912+08	\N	2026-10-13 22:01:49.079912+08	\N	normal
e7f537d8-d35f-422d-bb81-6e26cd79ba49	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:01:49.08056+08	\N	2026-10-13 22:01:49.08056+08	\N	normal
cf0a73bf-ec13-4db6-8773-072164564768	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:01:49.081159+08	\N	2026-10-13 22:01:49.081159+08	\N	normal
7d2ddd84-6306-4098-a5cf-8ab87179daa7	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:01:49.081678+08	\N	2026-10-13 22:01:49.081678+08	\N	normal
396f3166-14a0-4c87-a6d2-091d3675911f	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:01:49.082201+08	\N	2026-10-13 22:01:49.082201+08	\N	normal
65c2000e-8df2-42d6-819a-a240586fe35e	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:01:49.083383+08	\N	2026-10-13 22:01:49.083383+08	\N	normal
a0b8c4a7-14e0-4ca8-bcff-84ed893c4971	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:02:17.425528+08	\N	2026-10-13 22:02:17.425528+08	\N	normal
ffad9ef6-daeb-485c-9051-bc6a91233aed	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:02:17.427552+08	\N	2026-10-13 22:02:17.427552+08	\N	normal
5d73a888-81d2-4d64-891c-a3aaf2f11628	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:02:17.428824+08	\N	2026-10-13 22:02:17.428824+08	\N	normal
77336498-a2bb-4a77-8c11-4c51bb613900	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:02:17.454086+08	\N	2026-10-13 22:02:17.454086+08	\N	normal
bcd11823-30e4-4118-a107-e9af4939a394	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:02:17.454997+08	\N	2026-10-13 22:02:17.454997+08	\N	normal
70e008f3-d9a4-4b1f-b60d-6f512a123da3	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/16 02:30:00	/schedule	f	2026-10-13 22:02:17.455705+08	\N	2026-10-13 22:02:17.455705+08	\N	normal
12d7b150-436e-4552-a9bf-e25bfce4740e	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:02:17.483956+08	\N	2026-10-13 22:02:17.483956+08	\N	normal
c78cc56f-57d5-4c67-9ec4-65bc8dd792f0	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:02:17.485469+08	\N	2026-10-13 22:02:17.485469+08	\N	normal
3a35920b-5ade-4703-9859-c5c4469d37e6	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:02:17.486363+08	\N	2026-10-13 22:02:17.486363+08	\N	normal
ee716cce-26aa-4f7d-bcc2-e6da40120fd0	u_f54e97f52836855b	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:02:17.510222+08	\N	2026-10-13 22:02:17.510222+08	\N	normal
a604ab54-e743-4f56-bc1c-b1416161ba87	u_040f0825984aaec7	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:02:17.511203+08	\N	2026-10-13 22:02:17.511203+08	\N	normal
f0b1b72e-5ff8-4be8-a293-dd9fdb6c82d5	u_df4fc0f2b5018074	task	新的学习任务	陈老师布置了任务：越权任务	/tasks	f	2026-10-13 22:02:17.51195+08	\N	2026-10-13 22:02:17.51195+08	\N	normal
874711ff-e0e0-4c19-9ddc-460f62eb6529	u_d21e2a16db0d6ad8	task	学生已提交打卡	任务「越权任务」已提交，待批阅	/teacher	f	2026-10-13 22:02:17.560023+08	\N	2026-10-13 22:02:17.560023+08	\N	normal
38452723-5cfc-4e76-9616-229acd77fe82	u_f54e97f52836855b	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:02:17.6146+08	\N	2026-10-13 22:02:17.6146+08	\N	normal
5c905b5d-dfa8-4ba8-8396-0ed8a692f355	u_040f0825984aaec7	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:02:17.615418+08	\N	2026-10-13 22:02:17.615418+08	\N	normal
7226ebb1-ebac-4136-b9c9-59f9ebfe982e	u_df4fc0f2b5018074	task	打卡已通过	任务「越权任务」已通过：完成得不错	/tasks	f	2026-10-13 22:02:17.61614+08	\N	2026-10-13 22:02:17.61614+08	\N	normal
e38b9773-caad-40a3-8f57-aa55c114db17	u_f54e97f52836855b	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:02:17.643525+08	\N	2026-10-13 22:02:17.643525+08	\N	normal
5661d9c8-58db-4413-9e49-de638c177b8e	u_040f0825984aaec7	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:02:17.644466+08	\N	2026-10-13 22:02:17.644466+08	\N	normal
70062a06-824e-4c10-96ca-176ba389664f	u_df4fc0f2b5018074	task	打卡被退回	任务「越权任务」需要重做：越权尝试	/tasks	f	2026-10-13 22:02:17.645166+08	\N	2026-10-13 22:02:17.645166+08	\N	normal
91da0425-f3dd-44bf-8412-abe5a406c70e	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:02:17.671227+08	\N	2026-10-13 22:02:17.671227+08	\N	urgent
6f6735e2-df13-4b3a-ac2a-8baa6daefae6	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:02:17.671795+08	\N	2026-10-13 22:02:17.671795+08	\N	urgent
c2902aa7-0f9a-4898-a414-6c5ade2f99da	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:02:17.672383+08	\N	2026-10-13 22:02:17.672383+08	\N	urgent
2b7d3227-c3ef-4db8-835d-aece285b0528	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 55 课时，请核对后确认	/lessons	f	2026-10-13 22:02:17.74302+08	\N	2026-10-13 22:02:17.74302+08	\N	urgent
b5e650e9-c258-496c-a77a-6a116833ad29	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 55 课时，请核对后确认	/lessons	f	2026-10-13 22:02:17.743619+08	\N	2026-10-13 22:02:17.743619+08	\N	urgent
b109d03b-ad21-46c4-8830-b703127ad9df	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 55 课时，请核对后确认	/lessons	f	2026-10-13 22:02:17.744032+08	\N	2026-10-13 22:02:17.744032+08	\N	urgent
34d8634a-d4dd-4e4c-81b9-7721dbc124b4	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 54 课时，请核对后确认	/lessons	f	2026-10-13 22:02:17.764515+08	\N	2026-10-13 22:02:17.764515+08	\N	urgent
80072abd-ca43-43d2-b455-4a0204471c20	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 54 课时，请核对后确认	/lessons	f	2026-10-13 22:02:17.764875+08	\N	2026-10-13 22:02:17.764875+08	\N	urgent
e5fcfec7-ad61-4faf-82a6-9cc463de0d5d	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 54 课时，请核对后确认	/lessons	f	2026-10-13 22:02:17.765202+08	\N	2026-10-13 22:02:17.765202+08	\N	urgent
17fa06b9-21f2-461b-b5f3-632afe42a72b	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:18.035427+08	\N	2026-10-13 22:02:18.035427+08	\N	normal
1b07996f-1712-4fad-968b-e14c2d70a7ab	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:18.039712+08	\N	2026-10-13 22:02:18.039712+08	\N	normal
8df4abe3-b875-4272-9247-327e6d8e1326	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:18.046268+08	\N	2026-10-13 22:02:18.046268+08	\N	normal
0f54b649-1c39-444e-8ee8-71781be514c4	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:18.054065+08	\N	2026-10-13 22:02:18.054065+08	\N	normal
379c742b-d6c6-411c-a996-33d0ebfb70e0	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:18.062951+08	\N	2026-10-13 22:02:18.062951+08	\N	normal
d7ae7e81-ec1a-4b0b-834e-8d3c90e9c77b	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:18.065729+08	\N	2026-10-13 22:02:18.065729+08	\N	normal
18c2d421-604c-443f-bb19-ace426d6e4c6	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:18.073511+08	\N	2026-10-13 22:02:18.073511+08	\N	normal
71a999d8-e692-4985-b9eb-7ef865ae7df2	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:02:35.759858+08	\N	2026-10-13 22:02:35.759858+08	\N	normal
bb584c53-ce9c-4523-a175-2d4834eaac21	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:02:35.76098+08	\N	2026-10-13 22:02:35.76098+08	\N	normal
f88ce642-7d8d-49d1-be30-3af04ea8e853	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:02:35.76194+08	\N	2026-10-13 22:02:35.76194+08	\N	normal
3a2f40ee-9a79-4291-ab99-e56946242b9d	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:02:35.806981+08	\N	2026-10-13 22:02:35.806981+08	\N	normal
f232dc1b-7363-4b5d-a3b7-333517919e34	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:02:35.807926+08	\N	2026-10-13 22:02:35.807926+08	\N	normal
05c3e042-807f-44c1-9002-d60b70663cd3	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:02:35.809064+08	\N	2026-10-13 22:02:35.809064+08	\N	normal
f8e5482d-1262-42fb-91b0-71c0b3c07436	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-13 22:02:35.872735+08	\N	2026-10-13 22:02:35.872735+08	\N	normal
6db5a62d-7282-458a-a493-fcefecf0b267	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 22:02:35.923905+08	\N	2026-10-13 22:02:35.923905+08	\N	normal
b6c8cbce-2e6d-4c19-a5b6-e4c0f2d0e2ff	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 22:02:35.925351+08	\N	2026-10-13 22:02:35.925351+08	\N	normal
5376e91a-141a-4b8a-972d-da262dc44487	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 22:02:35.926389+08	\N	2026-10-13 22:02:35.926389+08	\N	normal
4594315f-f88f-4ea8-bbae-15d6cb32f8f8	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:02:35.970102+08	\N	2026-10-13 22:02:35.970102+08	\N	urgent
321a0923-56ef-4270-b166-ac2c106bae1c	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:02:35.970774+08	\N	2026-10-13 22:02:35.970774+08	\N	urgent
dadf0c5b-1edc-422a-bde0-0f53faf64f20	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:02:35.971249+08	\N	2026-10-13 22:02:35.971249+08	\N	urgent
4ff56dc6-aa2d-47d6-8b92-4b3346969c17	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 73 课时，请核对后确认	/lessons	f	2026-10-13 22:02:36.043606+08	\N	2026-10-13 22:02:36.043606+08	\N	urgent
c4064bff-d67e-4bfa-9613-840ed628b897	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 73 课时，请核对后确认	/lessons	f	2026-10-13 22:02:36.044237+08	\N	2026-10-13 22:02:36.044237+08	\N	urgent
5b577aae-34b2-45a4-941d-abe9fa68a026	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 73 课时，请核对后确认	/lessons	f	2026-10-13 22:02:36.044735+08	\N	2026-10-13 22:02:36.044735+08	\N	urgent
8795a9ba-d918-42a6-9e4d-46eb474a50d7	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:36.150131+08	\N	2026-10-13 22:02:36.150131+08	\N	normal
47d2aecd-9551-4fbf-9248-0fb484b7f1a8	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:36.150993+08	\N	2026-10-13 22:02:36.150993+08	\N	normal
df5f08c8-8652-4bd3-93ca-362b5532563b	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:36.151799+08	\N	2026-10-13 22:02:36.151799+08	\N	normal
d7a9491e-4d20-4833-99d0-26435a1568ad	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:36.152947+08	\N	2026-10-13 22:02:36.152947+08	\N	normal
01631182-99b6-464b-9097-d4494ac78519	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:36.153799+08	\N	2026-10-13 22:02:36.153799+08	\N	normal
2071a8a7-765d-4b9c-aab0-265a8ab19206	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:36.154568+08	\N	2026-10-13 22:02:36.154568+08	\N	normal
1b790d7e-8242-4b1f-a460-2db575316ee1	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:02:36.155313+08	\N	2026-10-13 22:02:36.155313+08	\N	normal
ae5ffa72-265b-4d5e-9c65-f16e3d95720c	u_6e32fb7c7f2b7fed	broadcast	t	c	/messages	f	2026-10-13 22:07:19.850165+08	\N	2026-10-13 22:07:19.850165+08	\N	normal
a5cf61c5-4b53-4691-8ce5-dc61b41bb0f0	u_040f0825984aaec7	broadcast	t	c	/messages	f	2026-10-13 22:07:19.851436+08	\N	2026-10-13 22:07:19.851436+08	\N	normal
9275a8ea-1212-418d-bb48-dc498701ef8a	u_747d2315fab64522	broadcast	t	c	/messages	f	2026-10-13 22:07:19.852195+08	\N	2026-10-13 22:07:19.852195+08	\N	normal
876fbe6a-3737-4e53-93d4-9fff97a7f13b	u_df4fc0f2b5018074	broadcast	t	c	/messages	f	2026-10-13 22:07:19.853166+08	\N	2026-10-13 22:07:19.853166+08	\N	normal
2823c80e-c44c-4a2d-9ded-d74b780c8d1b	u_63838e8eca74d816	broadcast	t	c	/messages	f	2026-10-13 22:07:19.853907+08	\N	2026-10-13 22:07:19.853907+08	\N	normal
3508fc68-764b-49e9-a138-4d7cc586e9f0	u_d21e2a16db0d6ad8	broadcast	t	c	/messages	f	2026-10-13 22:07:19.854622+08	\N	2026-10-13 22:07:19.854622+08	\N	normal
d497a078-bf72-4a99-a366-942129fecda9	u_f54e97f52836855b	broadcast	t	c	/messages	f	2026-10-13 22:07:19.856553+08	\N	2026-10-13 22:07:19.856553+08	\N	normal
7aa2b588-b8bb-4873-b0e4-012b884b7e3d	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:32:30.356416+08	\N	2026-10-13 22:32:30.356416+08	\N	normal
f079321b-9b81-4b05-96fb-7119b1c6f19b	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:32:30.358509+08	\N	2026-10-13 22:32:30.358509+08	\N	normal
021cf7f4-efc3-43a3-a81a-c636c336590c	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-13 22:32:30.360491+08	\N	2026-10-13 22:32:30.360491+08	\N	normal
36302b9e-bdad-41f9-b95d-b9dc441bc7dc	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:32:30.404409+08	\N	2026-10-13 22:32:30.404409+08	\N	normal
91133fa1-1219-4279-a429-075c00642c28	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:32:30.40556+08	\N	2026-10-13 22:32:30.40556+08	\N	normal
102ac39c-e054-4f61-a9d4-aa21438c8c3f	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-13 22:32:30.406647+08	\N	2026-10-13 22:32:30.406647+08	\N	normal
7edd48a5-7e95-4c24-936d-6298503bcbd5	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-13 22:32:30.477643+08	\N	2026-10-13 22:32:30.477643+08	\N	normal
50cde992-e1ff-4953-9e63-ad4485f9e36f	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 22:32:30.526658+08	\N	2026-10-13 22:32:30.526658+08	\N	normal
e8d8a50d-2158-4f64-81e0-986f1763477d	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 22:32:30.527727+08	\N	2026-10-13 22:32:30.527727+08	\N	normal
af880698-ab8b-4a7e-831a-6281ae26d153	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-13 22:32:30.528657+08	\N	2026-10-13 22:32:30.528657+08	\N	normal
467449e8-dd7c-4a97-b1bd-7ed323fc8eaf	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:32:30.572867+08	\N	2026-10-13 22:32:30.572867+08	\N	urgent
c7f5f7d5-a778-48eb-b4bc-962a65787f12	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:32:30.573421+08	\N	2026-10-13 22:32:30.573421+08	\N	urgent
df4793cc-d892-4a22-b6a9-af107994b0dd	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-13 22:32:30.573892+08	\N	2026-10-13 22:32:30.573892+08	\N	urgent
4b02e51f-3f2c-492f-8ec7-d4708c7e6d17	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 92 课时，请核对后确认	/lessons	f	2026-10-13 22:32:30.648819+08	\N	2026-10-13 22:32:30.648819+08	\N	urgent
6c7bd0c4-c6dc-4b29-b99a-e1f920e51d1e	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 92 课时，请核对后确认	/lessons	f	2026-10-13 22:32:30.649441+08	\N	2026-10-13 22:32:30.649441+08	\N	urgent
e0f175a7-82ef-41e2-9155-05efc31a3f02	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 92 课时，请核对后确认	/lessons	f	2026-10-13 22:32:30.650138+08	\N	2026-10-13 22:32:30.650138+08	\N	urgent
903dafe7-b4cb-4b5d-a3b0-4e54e0464010	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:32:30.753417+08	\N	2026-10-13 22:32:30.753417+08	\N	normal
1ff79bfa-d9d6-4477-a8ed-118b34d28570	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:32:30.754493+08	\N	2026-10-13 22:32:30.754493+08	\N	normal
75c0ff42-f9d3-48ac-9754-b7dca2450d2d	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:32:30.755445+08	\N	2026-10-13 22:32:30.755445+08	\N	normal
169d3ff8-8de2-4eaa-8438-473c2e9d4bb7	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:32:30.756368+08	\N	2026-10-13 22:32:30.756368+08	\N	normal
cf1c9555-2232-490d-bc54-8b2c9a26f1db	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:32:30.757357+08	\N	2026-10-13 22:32:30.757357+08	\N	normal
ff61ae91-e2b0-4c0c-88bd-a1e2698d835d	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:32:30.758215+08	\N	2026-10-13 22:32:30.758215+08	\N	normal
c60f64d1-75f3-4f91-8853-33b58568c015	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-13 22:32:30.759476+08	\N	2026-10-13 22:32:30.759476+08	\N	normal
27bddc5c-915e-4ce3-aa13-2f2639d08483	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 16:31:39.685277+08	\N	2026-10-17 16:31:39.685277+08	\N	normal
e7a0d807-d6ca-4a4d-ae2a-8977d12db87d	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 16:31:39.689209+08	\N	2026-10-17 16:31:39.689209+08	\N	normal
9c4bfc85-e0af-4d20-9bff-c92df86b9548	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 16:31:39.69099+08	\N	2026-10-17 16:31:39.69099+08	\N	normal
a5df9929-b4f7-43a1-8e1f-e6443d655bd9	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 16:31:39.746264+08	\N	2026-10-17 16:31:39.746264+08	\N	normal
be32e5ef-5f98-4032-902e-c45b4ba88c6b	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 16:31:39.747911+08	\N	2026-10-17 16:31:39.747911+08	\N	normal
f6063db0-9377-45a6-93d8-0236498f4e5a	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 16:31:39.750502+08	\N	2026-10-17 16:31:39.750502+08	\N	normal
000e875b-8d6d-4d3c-8d02-659d31413fc9	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-17 16:31:39.836587+08	\N	2026-10-17 16:31:39.836587+08	\N	normal
ee6423d6-9c0c-4d16-b40a-c0f84ebadfcb	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 16:31:39.90232+08	\N	2026-10-17 16:31:39.90232+08	\N	normal
68e718c1-ae2c-44e8-b4f7-043db7a09fd5	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 16:31:39.904415+08	\N	2026-10-17 16:31:39.904415+08	\N	normal
3ace6bd4-80da-4575-81ee-96c9698fdd24	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 16:31:39.906828+08	\N	2026-10-17 16:31:39.906828+08	\N	normal
1c461297-b429-4c90-97a7-6077c040e218	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 16:31:39.969771+08	\N	2026-10-17 16:31:39.969771+08	\N	urgent
f9d7e5a2-7100-495b-b0f5-b971522b6b17	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 16:31:39.970792+08	\N	2026-10-17 16:31:39.970792+08	\N	urgent
49917b32-3377-4cdf-9366-a075e3f37138	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 16:31:39.971964+08	\N	2026-10-17 16:31:39.971964+08	\N	urgent
b61243c0-0cc6-40b2-a7a6-ccf21e970164	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 111 课时，请核对后确认	/lessons	f	2026-10-17 16:31:40.071854+08	\N	2026-10-17 16:31:40.071854+08	\N	urgent
0e099688-9a6e-4b3d-8230-05cf75a89d8f	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 111 课时，请核对后确认	/lessons	f	2026-10-17 16:31:40.07276+08	\N	2026-10-17 16:31:40.07276+08	\N	urgent
f5e27ff9-5db9-4164-8790-8bea10f4ff47	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 111 课时，请核对后确认	/lessons	f	2026-10-17 16:31:40.073331+08	\N	2026-10-17 16:31:40.073331+08	\N	urgent
99baea0e-77d9-4f0f-bfab-89a85dd68064	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:40.211464+08	\N	2026-10-17 16:31:40.211464+08	\N	normal
ae50b2e4-4b60-4fb3-96a1-9204baec37eb	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:40.212536+08	\N	2026-10-17 16:31:40.212536+08	\N	normal
507454a9-b13f-4344-9a83-da21986736bb	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:40.214465+08	\N	2026-10-17 16:31:40.214465+08	\N	normal
b6482834-f53a-46b7-bdf9-4f0d57be6bf8	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:40.216193+08	\N	2026-10-17 16:31:40.216193+08	\N	normal
e93a149f-1305-472b-aab0-6f9b0979f5f9	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:40.218397+08	\N	2026-10-17 16:31:40.218397+08	\N	normal
b7624b17-6fd5-444b-a137-0c186c303537	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:40.220302+08	\N	2026-10-17 16:31:40.220302+08	\N	normal
baac8e23-42c7-49f1-9ae4-baa54217773d	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:40.222269+08	\N	2026-10-17 16:31:40.222269+08	\N	normal
61a3b8ec-ab3d-45d7-856f-aab28cc5a505	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 16:31:53.346876+08	\N	2026-10-17 16:31:53.346876+08	\N	normal
857dd4aa-1901-4e09-9166-f72a37e26bb6	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 16:31:53.348663+08	\N	2026-10-17 16:31:53.348663+08	\N	normal
f6455204-a88c-489e-b322-7dffa3deafcb	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 16:31:53.350298+08	\N	2026-10-17 16:31:53.350298+08	\N	normal
4c1bd49e-1563-4fa7-b959-4a6e00eb13d8	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 16:31:53.398134+08	\N	2026-10-17 16:31:53.398134+08	\N	normal
b6471d9e-6856-4bb3-9b45-9eb6b7f93461	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 16:31:53.399972+08	\N	2026-10-17 16:31:53.399972+08	\N	normal
939ca253-1827-49b5-a243-8d59e934316d	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 16:31:53.40178+08	\N	2026-10-17 16:31:53.40178+08	\N	normal
a3aaba48-3657-4419-8af1-92e74f90cea5	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-17 16:31:53.478574+08	\N	2026-10-17 16:31:53.478574+08	\N	normal
c6ef7b5c-778b-4b37-8ce6-3bf47ebb6d78	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 16:31:53.532318+08	\N	2026-10-17 16:31:53.532318+08	\N	normal
c6e2c57a-e2f2-4c27-b235-7673d8746034	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 16:31:53.534143+08	\N	2026-10-17 16:31:53.534143+08	\N	normal
9535ebf2-9950-416f-8033-964d8ef891f7	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 16:31:53.537536+08	\N	2026-10-17 16:31:53.537536+08	\N	normal
58c14507-6be3-4e34-9369-dd5f67402faf	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 16:31:53.587779+08	\N	2026-10-17 16:31:53.587779+08	\N	urgent
e8ce96a9-24d6-42e5-a872-1e540ff4b185	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 16:31:53.590257+08	\N	2026-10-17 16:31:53.590257+08	\N	urgent
5a3e5a7d-30f2-4e3a-b74d-e94597615000	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 16:31:53.59136+08	\N	2026-10-17 16:31:53.59136+08	\N	urgent
3add5bc1-4cd4-4ce5-8e87-695569807be6	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 130 课时，请核对后确认	/lessons	f	2026-10-17 16:31:53.671372+08	\N	2026-10-17 16:31:53.671372+08	\N	urgent
3cdd2b49-20bd-4408-bfb7-2032922b83b1	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 130 课时，请核对后确认	/lessons	f	2026-10-17 16:31:53.672263+08	\N	2026-10-17 16:31:53.672263+08	\N	urgent
be8db123-491b-4ae5-8a97-9bbb8b0ef928	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 130 课时，请核对后确认	/lessons	f	2026-10-17 16:31:53.673237+08	\N	2026-10-17 16:31:53.673237+08	\N	urgent
c2e3fa02-d0fe-40ff-9ec1-ebbadf2abd94	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:53.792903+08	\N	2026-10-17 16:31:53.792903+08	\N	normal
f2e5b223-75a9-4cc2-ae3f-ff1a15a21d39	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:53.794082+08	\N	2026-10-17 16:31:53.794082+08	\N	normal
8ef02c71-af42-4d24-80d5-95bb097f0bdf	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:53.795552+08	\N	2026-10-17 16:31:53.795552+08	\N	normal
bb4e636d-37a6-4673-833e-1873c757a573	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:53.797058+08	\N	2026-10-17 16:31:53.797058+08	\N	normal
c5df0317-8467-4e9b-993d-fabebd24e604	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:53.798446+08	\N	2026-10-17 16:31:53.798446+08	\N	normal
fe6881ec-836b-425c-9437-6a547e4d8bcc	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:53.800193+08	\N	2026-10-17 16:31:53.800193+08	\N	normal
e970c99b-02e8-46a2-ae6f-0705ba33d1db	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 16:31:53.801818+08	\N	2026-10-17 16:31:53.801818+08	\N	normal
1122cd42-eddf-4344-b5c1-a9b9f8ec089b	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 17:24:22.614765+08	\N	2026-10-17 17:24:22.614765+08	\N	normal
32385d90-4ec6-4554-9f7e-4c98a05d8e1d	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 17:24:22.617771+08	\N	2026-10-17 17:24:22.617771+08	\N	normal
7c26be0b-0f68-45c9-a8ff-6bbbc63c8c8c	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 17:24:22.619628+08	\N	2026-10-17 17:24:22.619628+08	\N	normal
9497aa16-21db-4a8a-86c5-b58fcdcda2b3	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 17:24:22.683165+08	\N	2026-10-17 17:24:22.683165+08	\N	normal
aefaa297-de71-4f36-9722-b807af0ed216	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 17:24:22.684819+08	\N	2026-10-17 17:24:22.684819+08	\N	normal
d11b4711-6bf5-4c10-b936-bf18bcad9f80	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 17:24:22.686657+08	\N	2026-10-17 17:24:22.686657+08	\N	normal
37c76f44-cd03-43df-91be-fa37dbd471eb	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-17 17:24:22.769577+08	\N	2026-10-17 17:24:22.769577+08	\N	normal
2ffbe9a7-d31a-4a6a-9c2b-55b22ef2ca73	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 17:24:22.829088+08	\N	2026-10-17 17:24:22.829088+08	\N	normal
66f8e57f-d40b-4fac-9557-2eb2ce144623	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 17:24:22.833036+08	\N	2026-10-17 17:24:22.833036+08	\N	normal
e2d6cd36-e515-44b2-986d-5033ec0b1eb3	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 17:24:22.834826+08	\N	2026-10-17 17:24:22.834826+08	\N	normal
5bf3f469-1bce-47ca-b56a-19113b2a79c6	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 17:24:22.891142+08	\N	2026-10-17 17:24:22.891142+08	\N	urgent
ca2df152-590b-4e4a-994f-fa419b4b05fc	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 17:24:22.892088+08	\N	2026-10-17 17:24:22.892088+08	\N	urgent
8223dbfa-0f7f-44e9-a88e-27aba0618b36	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 17:24:22.893207+08	\N	2026-10-17 17:24:22.893207+08	\N	urgent
4960c461-0222-4027-a38a-fa2eb76b6b9e	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 149 课时，请核对后确认	/lessons	f	2026-10-17 17:24:22.986165+08	\N	2026-10-17 17:24:22.986165+08	\N	urgent
05bca97e-a56c-44d2-8137-b845d6f3565f	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 149 课时，请核对后确认	/lessons	f	2026-10-17 17:24:22.987103+08	\N	2026-10-17 17:24:22.987103+08	\N	urgent
f2af8cbc-6d67-4755-b906-ae28738a29f3	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 149 课时，请核对后确认	/lessons	f	2026-10-17 17:24:22.987853+08	\N	2026-10-17 17:24:22.987853+08	\N	urgent
c26fd087-059b-4f3b-a8b3-da7622ace286	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:23.131111+08	\N	2026-10-17 17:24:23.131111+08	\N	normal
ff88cb19-07d6-49b8-a90b-08a4bfac877e	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:23.133603+08	\N	2026-10-17 17:24:23.133603+08	\N	normal
3974e55f-a19e-46dc-83bd-dbde947dda02	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:23.137576+08	\N	2026-10-17 17:24:23.137576+08	\N	normal
acb3387d-e0ca-46e3-b349-bf10d562e1e2	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:23.139347+08	\N	2026-10-17 17:24:23.139347+08	\N	normal
6e6c1fb1-9407-45ec-8855-58fb33d5041e	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:23.14122+08	\N	2026-10-17 17:24:23.14122+08	\N	normal
c20b3aaa-d612-4d3b-9928-d02113248c48	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:23.143225+08	\N	2026-10-17 17:24:23.143225+08	\N	normal
4c1ec532-a554-44ed-84b2-6863b93220d5	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:23.145776+08	\N	2026-10-17 17:24:23.145776+08	\N	normal
4f8d6857-7520-46e2-8970-19789c37abd6	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 17:24:42.911063+08	\N	2026-10-17 17:24:42.911063+08	\N	normal
3e5c311a-e974-4127-a8ef-ebfefc5b3e8a	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 17:24:42.913563+08	\N	2026-10-17 17:24:42.913563+08	\N	normal
29d842fc-eff1-4546-ad7d-a9555b57abd4	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-17 17:24:42.915003+08	\N	2026-10-17 17:24:42.915003+08	\N	normal
c96ddff0-dbfc-4358-b9f3-2d5765d6a286	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 17:24:42.962625+08	\N	2026-10-17 17:24:42.962625+08	\N	normal
0e8a7265-0687-4d72-81d8-a9ecd0667af3	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 17:24:42.965045+08	\N	2026-10-17 17:24:42.965045+08	\N	normal
3eca1561-6ad1-478b-92e5-62eee6fa618e	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-17 17:24:42.966156+08	\N	2026-10-17 17:24:42.966156+08	\N	normal
9865e405-5893-4637-86d8-72218ca36d37	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-17 17:24:43.039181+08	\N	2026-10-17 17:24:43.039181+08	\N	normal
9f11c5bc-20e6-46d4-ae74-6eacc6c8407f	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 17:24:43.090621+08	\N	2026-10-17 17:24:43.090621+08	\N	normal
68926d8e-d4cd-46f4-9be3-7fc6dd22ba6f	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 17:24:43.092707+08	\N	2026-10-17 17:24:43.092707+08	\N	normal
58461492-b1f5-4091-8693-a53967371d19	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-17 17:24:43.094415+08	\N	2026-10-17 17:24:43.094415+08	\N	normal
e2aac6bf-c2e0-4734-a406-29f4a8df2d8b	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 17:24:43.14575+08	\N	2026-10-17 17:24:43.14575+08	\N	urgent
a277b2a9-a5ed-4fba-9810-ca7c4c880dd1	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 17:24:43.146817+08	\N	2026-10-17 17:24:43.146817+08	\N	urgent
ac1e4f7e-969f-4a81-ab29-6c01b49551ad	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-17 17:24:43.148116+08	\N	2026-10-17 17:24:43.148116+08	\N	urgent
c9ee9944-f4c2-4c01-b916-c45266a106ee	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 168 课时，请核对后确认	/lessons	f	2026-10-17 17:24:43.228441+08	\N	2026-10-17 17:24:43.228441+08	\N	urgent
4bcf8c53-f110-42cc-a831-4bf6beefa440	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 168 课时，请核对后确认	/lessons	f	2026-10-17 17:24:43.229505+08	\N	2026-10-17 17:24:43.229505+08	\N	urgent
2a8ca0c2-0da7-4f7e-9a03-55f4a720d64f	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 168 课时，请核对后确认	/lessons	f	2026-10-17 17:24:43.230387+08	\N	2026-10-17 17:24:43.230387+08	\N	urgent
79fbe431-ad42-4381-ac64-93718ab2ae8a	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:43.354317+08	\N	2026-10-17 17:24:43.354317+08	\N	normal
7993b0dd-661b-40b0-9691-e0eac62d8a96	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:43.355776+08	\N	2026-10-17 17:24:43.355776+08	\N	normal
9c11a7a5-e65f-457e-b2a2-cbcbef1e8edb	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:43.356828+08	\N	2026-10-17 17:24:43.356828+08	\N	normal
2f6d7892-0af6-48d2-aace-b10444ba20df	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:43.357954+08	\N	2026-10-17 17:24:43.357954+08	\N	normal
407465d7-b83e-471d-9ade-bd177b0a97b1	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:43.359481+08	\N	2026-10-17 17:24:43.359481+08	\N	normal
382a767b-393f-4c17-91c3-2d1131f4cbd1	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:43.361112+08	\N	2026-10-17 17:24:43.361112+08	\N	normal
510f8cb8-8d7e-4c38-8abd-b428e982f184	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-17 17:24:43.362687+08	\N	2026-10-17 17:24:43.362687+08	\N	normal
d52bb2b5-7e21-4c1b-9421-f0d5ebc3cf28	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-19 11:39:23.656767+08	\N	2026-10-19 11:39:23.656767+08	\N	normal
68287cb5-83bf-42fe-8b24-e47b50df9712	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-19 11:39:23.659627+08	\N	2026-10-19 11:39:23.659627+08	\N	normal
e728a1d5-4b0d-4969-bba2-664454256277	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-19 11:39:23.660301+08	\N	2026-10-19 11:39:23.660301+08	\N	normal
14923f04-1fb2-4e6e-8be1-1936b42f9217	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-19 11:39:23.7059+08	\N	2026-10-19 11:39:23.7059+08	\N	normal
bb9b505d-93cb-403d-8e02-c9dae721361d	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-19 11:39:23.706747+08	\N	2026-10-19 11:39:23.706747+08	\N	normal
24de43a3-cad4-402b-a61c-1fa249df1574	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-19 11:39:23.707746+08	\N	2026-10-19 11:39:23.707746+08	\N	normal
d64ee555-36a5-45cc-a932-713fd35cad0a	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-19 11:39:23.775111+08	\N	2026-10-19 11:39:23.775111+08	\N	normal
6c89dfd9-df24-4a5b-b757-7f5573461281	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-19 11:39:23.824977+08	\N	2026-10-19 11:39:23.824977+08	\N	normal
d4e6e55b-f7a1-4711-bb37-55ca7e597aa9	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-19 11:39:23.82584+08	\N	2026-10-19 11:39:23.82584+08	\N	normal
64e26afc-5907-41ca-902f-71ab2577d703	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-19 11:39:23.826716+08	\N	2026-10-19 11:39:23.826716+08	\N	normal
c8d6c0c1-bfa4-485a-b9e2-27fccd6aaa03	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-19 11:39:23.870801+08	\N	2026-10-19 11:39:23.870801+08	\N	urgent
dd77d264-2b6f-43c3-b189-1009b3ac8537	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-19 11:39:23.871677+08	\N	2026-10-19 11:39:23.871677+08	\N	urgent
8ed28715-814b-4c68-b5da-3b303ab3fa35	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-19 11:39:23.872671+08	\N	2026-10-19 11:39:23.872671+08	\N	urgent
828a66f1-f20c-423a-bbc9-3c1e3761189c	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 187 课时，请核对后确认	/lessons	f	2026-10-19 11:39:23.947396+08	\N	2026-10-19 11:39:23.947396+08	\N	urgent
0722b24e-bb26-436c-9967-a3f4eab22fc9	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 187 课时，请核对后确认	/lessons	f	2026-10-19 11:39:23.948027+08	\N	2026-10-19 11:39:23.948027+08	\N	urgent
19fd2829-127b-4728-833d-be2c0a3b5a02	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 187 课时，请核对后确认	/lessons	f	2026-10-19 11:39:23.948567+08	\N	2026-10-19 11:39:23.948567+08	\N	urgent
02e5026d-3efb-412a-92b1-2e6551f4b66b	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:24.060128+08	\N	2026-10-19 11:39:24.060128+08	\N	normal
a1da2c84-b72e-4d4c-88d8-9e4012929a6b	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:24.06096+08	\N	2026-10-19 11:39:24.06096+08	\N	normal
baaaf808-35da-43b2-ae17-cb55a18e2e38	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:24.061758+08	\N	2026-10-19 11:39:24.061758+08	\N	normal
da4740ea-3523-4c96-b551-0e4668dd4ee2	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:24.063111+08	\N	2026-10-19 11:39:24.063111+08	\N	normal
ff161479-ce6a-44df-adf5-5f31e3064f44	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:24.06389+08	\N	2026-10-19 11:39:24.06389+08	\N	normal
1e420d01-3f4d-450a-86e1-edff79ca0f32	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:24.064628+08	\N	2026-10-19 11:39:24.064628+08	\N	normal
89ba7b0c-fa54-4428-8486-5a43e4682dd7	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:24.065403+08	\N	2026-10-19 11:39:24.065403+08	\N	normal
74578945-f236-44cf-87db-b261133ff4b2	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-19 11:39:41.815149+08	\N	2026-10-19 11:39:41.815149+08	\N	normal
d1ed84db-42e6-4f8d-a0a6-a81a5ebb4670	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-19 11:39:41.81601+08	\N	2026-10-19 11:39:41.81601+08	\N	normal
be799e51-9fd7-465b-b862-5c6978b0bbea	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-19 11:39:41.817055+08	\N	2026-10-19 11:39:41.817055+08	\N	normal
c651ca56-debd-4d69-a2d5-fbcfce441f4d	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-19 11:39:41.866424+08	\N	2026-10-19 11:39:41.866424+08	\N	normal
ecb3c7ef-072c-4ae3-8b19-cbc76d69e034	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-19 11:39:41.867364+08	\N	2026-10-19 11:39:41.867364+08	\N	normal
a2c543f0-c452-44d4-83cb-2f6ed5ac48a2	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-19 11:39:41.868134+08	\N	2026-10-19 11:39:41.868134+08	\N	normal
51742425-1ee2-413e-8611-54c786c0fb1f	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-19 11:39:41.977567+08	\N	2026-10-19 11:39:41.977567+08	\N	normal
773ca668-4304-47f1-8959-bb94c69b1c1d	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-19 11:39:42.122769+08	\N	2026-10-19 11:39:42.122769+08	\N	normal
74eaf962-5914-43db-b8f0-2b9a5d883315	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-19 11:39:42.123734+08	\N	2026-10-19 11:39:42.123734+08	\N	normal
a9dd4b16-5a4c-4d8a-82d5-980da1953a83	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-19 11:39:42.12668+08	\N	2026-10-19 11:39:42.12668+08	\N	normal
0933b684-9ee8-461c-aa76-aab12078351a	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-19 11:39:42.231364+08	\N	2026-10-19 11:39:42.231364+08	\N	urgent
b613ebae-6af2-49b4-a47f-1c7fef7f60a5	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-19 11:39:42.231969+08	\N	2026-10-19 11:39:42.231969+08	\N	urgent
95f1388e-7cbe-4af9-bc2c-cfb84591cac7	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-19 11:39:42.232476+08	\N	2026-10-19 11:39:42.232476+08	\N	urgent
68608af5-67b4-46a1-9ebf-07481b991a0d	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 206 课时，请核对后确认	/lessons	f	2026-10-19 11:39:42.384608+08	\N	2026-10-19 11:39:42.384608+08	\N	urgent
69f8e6a6-4b23-4b26-8eeb-e30568647519	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 206 课时，请核对后确认	/lessons	f	2026-10-19 11:39:42.385091+08	\N	2026-10-19 11:39:42.385091+08	\N	urgent
582deda8-58cd-4f86-bd7e-19de58894760	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 206 课时，请核对后确认	/lessons	f	2026-10-19 11:39:42.3854+08	\N	2026-10-19 11:39:42.3854+08	\N	urgent
368e8d9b-8501-4e39-a2a0-9b453676ef4e	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:42.539167+08	\N	2026-10-19 11:39:42.539167+08	\N	normal
13ca01d4-1597-4738-825e-c34863c017de	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:42.540175+08	\N	2026-10-19 11:39:42.540175+08	\N	normal
1fdc41c9-e61e-4038-8cf6-df4e9190d9cf	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:42.541396+08	\N	2026-10-19 11:39:42.541396+08	\N	normal
879d0b78-7fd5-4b12-8efe-9f32bdca7e95	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:42.542858+08	\N	2026-10-19 11:39:42.542858+08	\N	normal
6837d623-2008-4615-8ad2-7b68a2c8e274	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:42.543707+08	\N	2026-10-19 11:39:42.543707+08	\N	normal
e9aecc11-92d6-4c17-824f-e82a09090883	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:42.544389+08	\N	2026-10-19 11:39:42.544389+08	\N	normal
09eaa29f-6ba3-4ab1-8aed-3a5a49344604	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-19 11:39:42.545397+08	\N	2026-10-19 11:39:42.545397+08	\N	normal
85820386-4209-41de-9a1a-f10de0f8e642	u_747d2315fab64522	insight	学习提醒	林小满，最近节奏有点松，先把到期的错题复习补上，进度就能追上。	/home	f	2026-10-21 11:52:51.178306+08	\N	2026-10-21 11:52:51.178306+08	\N	normal
aa132bbb-a438-448f-bc8f-9564c363b427	u_63838e8eca74d816	insight	学情提醒	【学情提醒】林小满 出现下滑迹象：已 7 天没有打卡记录	/home	f	2026-10-21 11:52:51.184041+08	\N	2026-10-21 11:52:51.184041+08	\N	normal
0485628c-175a-4abc-928e-abcbe8e7d866	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 12:03:27.23394+08	\N	2026-10-21 12:03:27.23394+08	\N	normal
ebac1ff4-c8b2-4404-9005-cea11bf739e0	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 12:03:27.235708+08	\N	2026-10-21 12:03:27.235708+08	\N	normal
c80e3061-b4d1-4866-9192-1c7c671e64a7	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 12:03:27.236702+08	\N	2026-10-21 12:03:27.236702+08	\N	normal
5c60e0db-e27a-4e35-8827-b388e0c89079	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 12:03:27.261251+08	\N	2026-10-21 12:03:27.261251+08	\N	normal
0072e681-2d21-4a0a-bebc-77483746983b	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 12:03:27.261858+08	\N	2026-10-21 12:03:27.261858+08	\N	normal
b9df6acd-3549-47c0-aed9-7bc66d989add	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 12:03:27.262526+08	\N	2026-10-21 12:03:27.262526+08	\N	normal
9cf4bb99-9b9e-4eed-803e-b44577b91c5f	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-21 12:03:27.304697+08	\N	2026-10-21 12:03:27.304697+08	\N	normal
c85e3fcd-e19b-4ece-bcc8-dcaf4ecd16b9	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 12:03:27.332077+08	\N	2026-10-21 12:03:27.332077+08	\N	normal
e50ca3d2-9771-4731-887c-bba8065245a5	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 12:03:27.332561+08	\N	2026-10-21 12:03:27.332561+08	\N	normal
02504600-2ee7-44fc-a148-5aea9bc05b01	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 12:03:27.332976+08	\N	2026-10-21 12:03:27.332976+08	\N	normal
10c1b5b0-6f5b-47a2-9760-cb0feae1a650	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 12:03:27.358255+08	\N	2026-10-21 12:03:27.358255+08	\N	urgent
7692d7fc-15b3-4fb3-a993-d5fbcb5e0b3e	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 12:03:27.359244+08	\N	2026-10-21 12:03:27.359244+08	\N	urgent
bf991d65-4803-4ff8-bf44-33ab4345f9e4	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 12:03:27.359868+08	\N	2026-10-21 12:03:27.359868+08	\N	urgent
ba28ee71-1f60-4179-b242-169868f54dcf	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 225 课时，请核对后确认	/lessons	f	2026-10-21 12:03:27.410332+08	\N	2026-10-21 12:03:27.410332+08	\N	urgent
ea669c2a-8628-48bf-b628-c1f8c3350223	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 225 课时，请核对后确认	/lessons	f	2026-10-21 12:03:27.410695+08	\N	2026-10-21 12:03:27.410695+08	\N	urgent
a6275789-a788-437e-b526-dd27108f6c5b	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 225 课时，请核对后确认	/lessons	f	2026-10-21 12:03:27.411197+08	\N	2026-10-21 12:03:27.411197+08	\N	urgent
e0e93f02-c8fe-439d-bb25-77ab3b2b0054	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 12:03:27.471699+08	\N	2026-10-21 12:03:27.471699+08	\N	normal
16f89ade-1fd3-4658-a737-7351bf8c5cbd	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 12:03:27.47215+08	\N	2026-10-21 12:03:27.47215+08	\N	normal
12c5d764-a3de-4ceb-9d4a-825268567b1d	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 12:03:27.473032+08	\N	2026-10-21 12:03:27.473032+08	\N	normal
ae89d93b-3f65-4504-8b3a-e176296496b6	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 12:03:27.473665+08	\N	2026-10-21 12:03:27.473665+08	\N	normal
7e624ed0-9c84-4c2d-aaea-aa629c28380b	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 12:03:27.474044+08	\N	2026-10-21 12:03:27.474044+08	\N	normal
4d835b07-fe5b-41ab-b3a3-ca87dd864cb8	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 12:03:27.474612+08	\N	2026-10-21 12:03:27.474612+08	\N	normal
277a5e8c-ed93-4b03-9545-ff3eb6839c30	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 12:03:27.475409+08	\N	2026-10-21 12:03:27.475409+08	\N	normal
53906512-4753-4e61-a215-4d11d21f8c52	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 17:48:14.963408+08	\N	2026-10-21 17:48:14.963408+08	\N	normal
39c3ddad-bc95-4245-bad4-113c23914046	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 17:48:14.965742+08	\N	2026-10-21 17:48:14.965742+08	\N	normal
de9a7e3b-cc68-43fc-9a0a-e8bb7ddaa141	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 17:48:14.967177+08	\N	2026-10-21 17:48:14.967177+08	\N	normal
9cb8c339-2eed-4642-aa84-c37a3c8944d5	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 17:48:15.017276+08	\N	2026-10-21 17:48:15.017276+08	\N	normal
03c5c9a9-9b69-42b4-99d9-3f1bc0021f51	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 17:48:15.018255+08	\N	2026-10-21 17:48:15.018255+08	\N	normal
b2dede43-e021-4f33-8291-82b27bb5787f	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 17:48:15.019177+08	\N	2026-10-21 17:48:15.019177+08	\N	normal
7f20eb8c-859d-4c5f-b560-d94bef7a51fc	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-21 17:48:15.085813+08	\N	2026-10-21 17:48:15.085813+08	\N	normal
4e76cde5-3ddc-4a87-8e0b-f51f2ee1d709	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 17:48:15.132694+08	\N	2026-10-21 17:48:15.132694+08	\N	normal
64c119cb-ba4f-4262-96fe-8a68640c3905	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 17:48:15.13374+08	\N	2026-10-21 17:48:15.13374+08	\N	normal
7774fba6-b32c-4a9e-9ffe-623e60f0eed9	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 17:48:15.134698+08	\N	2026-10-21 17:48:15.134698+08	\N	normal
caf5262c-825e-4204-be91-3f6eb719888f	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 17:48:15.180438+08	\N	2026-10-21 17:48:15.180438+08	\N	urgent
a0feb371-b0b9-48e1-b7b6-85e7b2945529	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 17:48:15.180823+08	\N	2026-10-21 17:48:15.180823+08	\N	urgent
ac791f62-ab34-439f-9ca4-686a65cd7a8e	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 17:48:15.181181+08	\N	2026-10-21 17:48:15.181181+08	\N	urgent
e23e435d-9575-4312-80ce-c9c72aadbb4b	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 244 课时，请核对后确认	/lessons	f	2026-10-21 17:48:15.252369+08	\N	2026-10-21 17:48:15.252369+08	\N	urgent
97e9c244-81e8-4b0d-8615-90cee6aa9e3e	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 244 课时，请核对后确认	/lessons	f	2026-10-21 17:48:15.252955+08	\N	2026-10-21 17:48:15.252955+08	\N	urgent
08b14cbc-027a-4c34-9370-326793beaf17	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 244 课时，请核对后确认	/lessons	f	2026-10-21 17:48:15.25348+08	\N	2026-10-21 17:48:15.25348+08	\N	urgent
c437ea2d-98d5-45ea-bebf-e85a177d3d52	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:15.361659+08	\N	2026-10-21 17:48:15.361659+08	\N	normal
3f33b2be-dc35-4385-9a93-4b90c79d4c55	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:15.362774+08	\N	2026-10-21 17:48:15.362774+08	\N	normal
4af6d05c-6a2c-4c92-9110-46acb41793f6	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:15.363561+08	\N	2026-10-21 17:48:15.363561+08	\N	normal
be4bea6d-3f7a-46d8-a17b-d89dc90e480d	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:15.364311+08	\N	2026-10-21 17:48:15.364311+08	\N	normal
f6331a23-730f-484d-823c-69191044f8e3	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:15.365261+08	\N	2026-10-21 17:48:15.365261+08	\N	normal
8de07d81-90b3-4de2-8d7d-fa09479500d6	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:15.366167+08	\N	2026-10-21 17:48:15.366167+08	\N	normal
8ab1bd3e-d7f7-48ac-a4cd-d1bbe1c6eef7	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:15.367101+08	\N	2026-10-21 17:48:15.367101+08	\N	normal
747c3d80-99a0-4081-a7bb-4ee7d640fd9b	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 17:48:58.081857+08	\N	2026-10-21 17:48:58.081857+08	\N	normal
b2751a7e-fe60-448c-b0af-a0df73581d6e	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 17:48:58.083268+08	\N	2026-10-21 17:48:58.083268+08	\N	normal
b7299fd4-450c-4db1-bc3e-fcd044003475	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 17:48:58.084359+08	\N	2026-10-21 17:48:58.084359+08	\N	normal
a7e02626-3303-4734-89cf-cb9323767053	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 17:48:58.1313+08	\N	2026-10-21 17:48:58.1313+08	\N	normal
cac826a8-58f0-4102-83ff-4c61e61b68c4	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 17:48:58.13227+08	\N	2026-10-21 17:48:58.13227+08	\N	normal
90808ad3-ddbe-4ba5-acb3-39923d8b501d	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 17:48:58.133264+08	\N	2026-10-21 17:48:58.133264+08	\N	normal
fe5c05c1-5915-45d0-b807-9c5b8c71faf0	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-21 17:48:58.199273+08	\N	2026-10-21 17:48:58.199273+08	\N	normal
14a8acbd-6651-40e9-8f2d-db7387805cd3	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 17:48:58.296686+08	\N	2026-10-21 17:48:58.296686+08	\N	urgent
cee438a5-0823-40fc-aa04-c78a73e72ebf	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:58.493081+08	\N	2026-10-21 17:48:58.493081+08	\N	normal
06be9bc2-b9a8-4f10-a128-54e73f5cc61a	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 17:48:58.248623+08	\N	2026-10-21 17:48:58.248623+08	\N	normal
c78f86a8-5cb1-4fb6-a449-f84d65a9afd2	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 263 课时，请核对后确认	/lessons	f	2026-10-21 17:48:58.382753+08	\N	2026-10-21 17:48:58.382753+08	\N	urgent
19e99e44-7fab-43f6-a6fa-6c5f44d9e49e	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:58.495119+08	\N	2026-10-21 17:48:58.495119+08	\N	normal
bb2e7858-eadd-4ecd-8899-e60a929c9faa	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 17:48:58.249766+08	\N	2026-10-21 17:48:58.249766+08	\N	normal
589a97cc-afff-4d69-ad39-c5de9cc0badf	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 17:48:58.297194+08	\N	2026-10-21 17:48:58.297194+08	\N	urgent
fef5005a-b8ba-4bd1-bc12-afe57ffa9a3c	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:58.491155+08	\N	2026-10-21 17:48:58.491155+08	\N	normal
bad602fd-1dac-415a-8c62-a17f8b07391a	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:58.495883+08	\N	2026-10-21 17:48:58.495883+08	\N	normal
087f095b-02dc-4d9c-b155-cdc22b29af13	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 17:48:58.251041+08	\N	2026-10-21 17:48:58.251041+08	\N	normal
daac0ac4-68a9-4f5b-8316-693bacfd86eb	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 263 课时，请核对后确认	/lessons	f	2026-10-21 17:48:58.3822+08	\N	2026-10-21 17:48:58.3822+08	\N	urgent
7fd5b651-179a-4405-8fa4-21e30299053e	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:58.491898+08	\N	2026-10-21 17:48:58.491898+08	\N	normal
f541df61-1dd3-48bd-bc12-ec7255bcca34	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:58.496525+08	\N	2026-10-21 17:48:58.496525+08	\N	normal
83a5f412-f835-43bb-8afe-5b42e3e7b464	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 17:48:58.297723+08	\N	2026-10-21 17:48:58.297723+08	\N	urgent
083e7e10-924f-425d-80ed-7c399049b54f	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 263 课时，请核对后确认	/lessons	f	2026-10-21 17:48:58.381565+08	\N	2026-10-21 17:48:58.381565+08	\N	urgent
c3df3653-17e4-479b-ad5f-0b194ba8c367	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 17:48:58.49419+08	\N	2026-10-21 17:48:58.49419+08	\N	normal
b48ffde1-ed03-4f2e-b692-dd6fbf726f34	u_747d2315fab64522	insight	学习提醒	林小满，最近节奏有点松，先把到期的错题复习补上，进度就能追上。	/home	f	2026-10-21 18:13:54.606272+08	\N	2026-10-21 18:13:54.606272+08	\N	normal
37aa42bc-9aab-4f49-8346-c5dfaef8c641	u_63838e8eca74d816	insight	学情提醒	【学情提醒】林小满 出现下滑迹象：已 8 天没有打卡记录	/home	f	2026-10-21 18:13:54.610959+08	\N	2026-10-21 18:13:54.610959+08	\N	normal
b8adf1d9-62fc-4ad9-b280-93ae712a2200	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 18:17:01.252215+08	\N	2026-10-21 18:17:01.252215+08	\N	normal
1f8fa876-d343-4f86-b562-d1eca75ef0ea	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 18:17:01.254531+08	\N	2026-10-21 18:17:01.254531+08	\N	normal
3ee7ff2a-572e-4992-96ab-6f9f1f1b14aa	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 18:17:01.256092+08	\N	2026-10-21 18:17:01.256092+08	\N	normal
774aa1b6-aa4f-47a4-a6a0-81b783330e3d	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 18:17:01.300863+08	\N	2026-10-21 18:17:01.300863+08	\N	normal
b631c8af-3b9a-481d-af65-252ddf5255b0	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 18:17:01.301796+08	\N	2026-10-21 18:17:01.301796+08	\N	normal
17865d05-7c70-4cc4-92fc-f759845a2543	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 18:17:01.302702+08	\N	2026-10-21 18:17:01.302702+08	\N	normal
576bcff6-7339-45ee-b34d-dc08170cea6b	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-21 18:17:01.385067+08	\N	2026-10-21 18:17:01.385067+08	\N	normal
aecc759d-0bc5-4bff-96d5-0990801d9615	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 18:17:01.447658+08	\N	2026-10-21 18:17:01.447658+08	\N	normal
a90395f1-b8a9-4b59-ab23-552878427546	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 18:17:01.448856+08	\N	2026-10-21 18:17:01.448856+08	\N	normal
60514ef7-f86c-4f7d-b4de-1bc075c12d46	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 18:17:01.449847+08	\N	2026-10-21 18:17:01.449847+08	\N	normal
1a401704-7a48-4c05-8a12-d1b5f7163af4	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 18:17:01.505023+08	\N	2026-10-21 18:17:01.505023+08	\N	urgent
b73a1da1-3f9e-414e-9290-3c8cd1fb0331	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 18:17:01.505951+08	\N	2026-10-21 18:17:01.505951+08	\N	urgent
5a79490e-41bf-4d84-95ff-e84989375a02	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 18:17:01.506555+08	\N	2026-10-21 18:17:01.506555+08	\N	urgent
55dc40bc-6f35-4b09-a731-13a68df8121f	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 282 课时，请核对后确认	/lessons	f	2026-10-21 18:17:01.59952+08	\N	2026-10-21 18:17:01.59952+08	\N	urgent
02c7f2a5-3ab9-4cfe-aa11-9fc93393a4e2	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 282 课时，请核对后确认	/lessons	f	2026-10-21 18:17:01.600147+08	\N	2026-10-21 18:17:01.600147+08	\N	urgent
ce0cfe5f-af48-476a-a373-0fe105044140	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 282 课时，请核对后确认	/lessons	f	2026-10-21 18:17:01.600694+08	\N	2026-10-21 18:17:01.600694+08	\N	urgent
bae3950e-d387-4838-ad91-7eb5933342ad	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:17:01.723035+08	\N	2026-10-21 18:17:01.723035+08	\N	normal
7b4c9520-3373-455a-89e5-e6ccc6f5a996	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:17:01.724078+08	\N	2026-10-21 18:17:01.724078+08	\N	normal
92403f9c-1106-4c07-a71b-7d604c85fbad	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:17:01.724981+08	\N	2026-10-21 18:17:01.724981+08	\N	normal
6a6aace7-7657-4224-9724-cb0ea5688318	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:17:01.725712+08	\N	2026-10-21 18:17:01.725712+08	\N	normal
dc44d78f-00df-49b8-807c-61dd38be4646	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:17:01.726717+08	\N	2026-10-21 18:17:01.726717+08	\N	normal
999956ea-78b5-4fa9-ac3e-e09d4e3e54d0	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:17:01.727926+08	\N	2026-10-21 18:17:01.727926+08	\N	normal
3127ddf5-6288-4e8a-81bf-3dd66f2b50c8	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:17:01.728667+08	\N	2026-10-21 18:17:01.728667+08	\N	normal
787c052e-5fb9-4c1e-8ea4-6d872efc96f3	u_63838e8eca74d816	insight	学情告警	林小满连续8天未打卡、投入度仅10分，且近14天无新错题、总复习0次。请24小时内电话回访，确认学习意愿和卡点，并安排一次15分钟诊断练习，回访后在系统记录结论。	/home	f	2026-10-21 18:20:16.197162+08	\N	2026-10-21 18:20:16.197162+08	\N	normal
a3c527a2-d5da-4e04-8c17-1f3fc3954704	u_040f0825984aaec7	insight	学情通报	家长您好，小满已连续8天未打卡，近期复习0次、投入度偏低；虽然作业完成率100%，但缺少练习反馈。建议今晚沟通学习安排，并固定每天20:00前完成1次打卡或10分钟复习，我会同步老师跟进。	/home	f	2026-10-21 18:20:16.20426+08	\N	2026-10-21 18:20:16.20426+08	\N	normal
044a2954-72c3-45a5-8141-1ea12bc4704d	u_df4fc0f2b5018074	insight	学情通报	家长您好，小满已连续8天未打卡，近期复习0次、投入度偏低；虽然作业完成率100%，但缺少练习反馈。建议今晚沟通学习安排，并固定每天20:00前完成1次打卡或10分钟复习，我会同步老师跟进。	/home	f	2026-10-21 18:20:16.207649+08	\N	2026-10-21 18:20:16.207649+08	\N	normal
716b33e9-3598-4b23-b298-bc6c48560f9f	u_747d2315fab64522	insight	学习提醒	小满，看到你作业完成得不错，但已经8天没打卡啦。今晚先做一件小事：完成1组10分钟错题回顾并打卡，我让老师给你发专属小练习。	/home	f	2026-10-21 18:20:16.209314+08	\N	2026-10-21 18:20:16.209314+08	\N	normal
504f4b5c-1981-410b-bab2-d581abfc6119	u_63838e8eca74d816	insight	学情告警	林小满任务完成率63%，且目前无复习记录。请在下次课用5分钟核查未完成任务的原因，并为其布置2次10分钟复习任务，课后检查完成情况。	/home	f	2026-10-21 18:20:24.178244+08	\N	2026-10-21 18:20:24.178244+08	\N	normal
d11dfa59-f062-4ae6-b5f1-d26b61cb1f0e	u_f54e97f52836855b	insight	学习提醒	小满，你今天已打卡，投入度很好；但任务完成率只有63%。请今天列出未完成任务并逐项补齐，同时完成1次10分钟错题复习，完成后回复我。	/home	f	2026-10-21 18:20:24.180091+08	\N	2026-10-21 18:20:24.180091+08	\N	normal
87a3900d-887e-47ad-a820-04bd0390a45b	u_040f0825984aaec7	insight	学情通报	家长您好，小满近期投入度和掌握度表现很好，但任务完成率为63%、暂无复习记录。请协助每天固定15分钟检查任务清单是否完成，并在今晚确认未完成项补齐即可，无需加量。	/home	f	2026-10-21 18:20:24.182576+08	\N	2026-10-21 18:20:24.182576+08	\N	normal
2d6f57f2-0adb-4a1c-8ea5-cd775ddf5578	u_df4fc0f2b5018074	insight	学情通报	家长您好，小满近期投入度和掌握度表现很好，但任务完成率为63%、暂无复习记录。请协助每天固定15分钟检查任务清单是否完成，并在今晚确认未完成项补齐即可，无需加量。	/home	f	2026-10-21 18:20:24.183813+08	\N	2026-10-21 18:20:24.183813+08	\N	normal
460a4fd2-5906-46e9-9eff-867d89ec9614	u_f54e97f52836855b	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 18:21:13.805866+08	\N	2026-10-21 18:21:13.805866+08	\N	normal
cf464904-0e95-47eb-af10-d12860d0b880	u_040f0825984aaec7	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 18:21:13.807249+08	\N	2026-10-21 18:21:13.807249+08	\N	normal
ac300d98-a68a-4dbd-916a-aa9204032daa	u_df4fc0f2b5018074	course	新增课程安排	数学 课程已安排在 2026/10/15 02:30:00	/schedule	f	2026-10-21 18:21:13.808928+08	\N	2026-10-21 18:21:13.808928+08	\N	normal
7f0609cc-619d-4e0b-9f86-3e0d342a52c6	u_f54e97f52836855b	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 18:21:13.868889+08	\N	2026-10-21 18:21:13.868889+08	\N	normal
241d9fc5-a926-483c-b247-51f4af223e78	u_df4fc0f2b5018074	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 18:21:13.995221+08	\N	2026-10-21 18:21:13.995221+08	\N	normal
d7d74d01-01a2-45cc-af3a-e0ef01d4cbf0	u_040f0825984aaec7	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 301 课时，请核对后确认	/lessons	f	2026-10-21 18:21:14.135126+08	\N	2026-10-21 18:21:14.135126+08	\N	urgent
1ac623a3-760a-4072-b451-a0ccfc7831e9	u_040f0825984aaec7	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:21:14.251195+08	\N	2026-10-21 18:21:14.251195+08	\N	normal
00892689-3e81-4799-b53f-2e90d8d47b03	u_f54e97f52836855b	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:21:14.255995+08	\N	2026-10-21 18:21:14.255995+08	\N	normal
50f1600e-5b93-4101-84f5-b742d75436f2	u_f54e97f52836855b	insight	学习提醒	小满，今天已按时打卡很棒！接下来7天我们把每日任务完成率从62%提到80%：每天先完成1个核心任务并打勾，任务超过30分钟就拆成2个15分钟小目标，完成后在群里回“已完成”。	/home	f	2026-10-21 18:21:46.669938+08	\N	2026-10-21 18:21:46.669938+08	\N	normal
c80173be-9691-4666-9532-d3973e2399e7	u_040f0825984aaec7	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 18:21:13.870175+08	\N	2026-10-21 18:21:13.870175+08	\N	normal
ff97c2cb-cc59-4bf1-b983-c638883ba56e	u_63838e8eca74d816	task	学生已提交打卡	任务「整理错题本」已提交，待批阅	/teacher	f	2026-10-21 18:21:13.940078+08	\N	2026-10-21 18:21:13.940078+08	\N	normal
55646e0a-8d00-4340-b8e8-d1aa36861f0c	u_f54e97f52836855b	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 18:21:14.043171+08	\N	2026-10-21 18:21:14.043171+08	\N	urgent
26c054ed-3237-4ee4-80d0-0fc32d545356	u_747d2315fab64522	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:21:14.25235+08	\N	2026-10-21 18:21:14.25235+08	\N	normal
3e22dcc0-63ee-4e16-8d0d-7e4c08d1e1cb	u_63838e8eca74d816	insight	学情告警	老师您好，林小满近14天任务完成率62%，但打卡活跃、知识掌握诊断100、错题仅1道。请帮其把每日任务拆成2-3个15分钟小目标，并在下次课检查未完成原因，先连续7天把完成率稳定到80%。	/home	f	2026-10-21 18:21:46.674237+08	\N	2026-10-21 18:21:46.674237+08	\N	normal
55703a01-3f8a-4ce7-be92-eded81b806f8	u_df4fc0f2b5018074	task	新的学习任务	周老师布置了任务：整理错题本	/tasks	f	2026-10-21 18:21:13.871412+08	\N	2026-10-21 18:21:13.871412+08	\N	normal
8117beda-e4df-4764-aaae-27a0b8fa9329	u_df4fc0f2b5018074	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 18:21:14.044284+08	\N	2026-10-21 18:21:14.044284+08	\N	urgent
cf8a1e5a-ea30-41db-b473-631af89cae02	u_f54e97f52836855b	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 301 课时，请核对后确认	/lessons	f	2026-10-21 18:21:14.134428+08	\N	2026-10-21 18:21:14.134428+08	\N	urgent
fe0674b0-1b74-4269-907d-4ab6a7efe361	u_df4fc0f2b5018074	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:21:14.253326+08	\N	2026-10-21 18:21:14.253326+08	\N	normal
671ce5bf-e910-41b2-83a7-f287f3400c6e	u_f54e97f52836855b	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 18:21:13.992619+08	\N	2026-10-21 18:21:13.992619+08	\N	normal
d0d923d6-a9a9-474b-aaad-29e4be44392b	u_df4fc0f2b5018074	lesson	课时已消耗，请确认	数学 本次消耗 1 课时，剩余 301 课时，请核对后确认	/lessons	f	2026-10-21 18:21:14.135698+08	\N	2026-10-21 18:21:14.135698+08	\N	urgent
1f1161b0-7104-42b2-8c42-4f8fa5b41abc	u_63838e8eca74d816	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:21:14.254202+08	\N	2026-10-21 18:21:14.254202+08	\N	normal
273a314e-112a-4297-a7a8-84bcd595d88b	u_040f0825984aaec7	task	打卡已通过	任务「整理错题本」已通过：完成得不错	/tasks	f	2026-10-21 18:21:13.994094+08	\N	2026-10-21 18:21:13.994094+08	\N	normal
c7bc1793-f889-4f85-bbd4-5fea2a6b8c71	u_040f0825984aaec7	lesson	课时已发放	数学 新增 20 课时	/lessons	f	2026-10-21 18:21:14.043821+08	\N	2026-10-21 18:21:14.043821+08	\N	urgent
be8ac1da-5fc0-4512-939c-73804534ab41	u_6e32fb7c7f2b7fed	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:21:14.249737+08	\N	2026-10-21 18:21:14.249737+08	\N	normal
e21d45c6-39ef-4975-a7c1-812fc0afeeac	u_d21e2a16db0d6ad8	broadcast	新内容发布：联调测试案例	s	/messages	f	2026-10-21 18:21:14.255052+08	\N	2026-10-21 18:21:14.255052+08	\N	normal
\.


--
-- Data for Name: question_bank; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_bank (id, subject, chapter, knowledge_point, title, answer, analysis, difficulty, source, use_count, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
a58d6aa5-933e-4aad-baa5-5ae3562a2620	数学	第3章 函数	二次函数最值	二次函数 y = 2x² + 8x + 5 的最大值或最小值是多少？	最小值 -3（x = -2 时取得）	y = 2(x+2)² - 3，开口向上有最小值	medium	manual	0	2026-10-17 16:53:23.539918+08	\N	2026-10-17 16:53:23.539918+08	\N
949998b7-6fcd-4d49-a012-1bf38069a35f	数学	第3章 函数	二次函数最值	若二次函数 y = -x² + 6x + m 的最大值为 10，求 m。	m = 1	最大值为 9 + m = 10	hard	manual	0	2026-10-17 16:53:23.539918+08	\N	2026-10-17 16:53:23.539918+08	\N
94f1ddff-0499-4a19-8b0a-e965bf444379	数学	第2章 运动学	匀变速直线运动	物体从静止开始以 2m/s² 匀加速运动，3 秒后的速度是多少？	6 m/s	v = at = 2×3 = 6	easy	manual	0	2026-10-17 16:53:23.539918+08	\N	2026-10-17 16:53:23.539918+08	\N
4a311a54-8890-4ba5-97c8-0532517170b2	英语	Unit 5	现在完成时	用现在完成时填空：She ___ (finish) her homework already.	has finished	already 是现在完成时标志词，主语 she 用 has	easy	manual	0	2026-10-17 16:53:23.539918+08	\N	2026-10-17 16:53:23.539918+08	\N
b1cb8f88-7113-4cca-8744-83692d9b778c	数学	\N	二次函数最值	求 y = -2(x-1)²+7 的最大值	7	开口向下，顶点即最大值	medium	manual	0	2026-10-17 17:14:11.484462+08	\N	2026-10-17 17:14:11.484462+08	\N
984e6105-9340-4720-9555-d272e95467c0	数学	\N	联调知识点	联调录题	\N	\N	medium	manual	0	2026-10-17 17:24:43.591998+08	\N	2026-10-17 17:24:43.591998+08	\N
f84ac240-4528-43a8-b96e-bb025b72a104	数学	\N	联调知识点	联调录题	\N	\N	medium	manual	0	2026-10-19 11:39:24.273284+08	\N	2026-10-19 11:39:24.273284+08	\N
6621c6e8-d65d-440d-a7d9-f2e62252bc15	数学	\N	联调知识点	联调录题	\N	\N	medium	manual	0	2026-10-19 11:39:42.785687+08	\N	2026-10-19 11:39:42.785687+08	\N
7ae8282e-6d54-4712-9808-80989866aaef	数学	\N	联调知识点	联调录题	\N	\N	medium	manual	0	2026-10-21 12:03:27.590114+08	\N	2026-10-21 12:03:27.590114+08	\N
c835e4e8-3e50-4fd8-8d1d-fe4afdf92068	数学	\N	联调知识点	联调录题	\N	\N	medium	manual	0	2026-10-21 17:48:15.570997+08	\N	2026-10-21 17:48:15.570997+08	\N
0427f49a-24c2-4ce6-a0d5-325ddcb02b55	数学	\N	联调知识点	联调录题	\N	\N	medium	manual	0	2026-10-21 17:48:58.690577+08	\N	2026-10-21 17:48:58.690577+08	\N
c497370a-8365-4771-b54d-a12e256f5f26	数学	\N	联调知识点	联调录题	\N	\N	medium	manual	0	2026-10-21 18:17:01.932536+08	\N	2026-10-21 18:17:01.932536+08	\N
f667663d-031c-44ff-93cf-5564d24f2f1a	数学	第3章 函数	二次函数最值	已知二次函数 y = x² - 4x + 3，求 its 最小值。	当 x = 2 时，最小值为 -1	配方：y = (x-2)² - 1，顶点 (2, -1)	medium	manual	10	2026-10-17 16:53:23.539918+08	\N	2026-10-17 16:53:23.539918+08	\N
b4536a79-44a8-4262-99d1-00acbfeac35e	数学	\N	联调知识点	联调录题	\N	\N	medium	manual	0	2026-10-21 18:21:14.459653+08	\N	2026-10-21 18:21:14.459653+08	\N
\.


--
-- Data for Name: student_insight; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_insight (id, student_user_id, level, score, signals, headline, evidence, actions, executed, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
1163b75b-a6d3-4a75-8db3-83c0b176e03c	u_747d2315fab64522	slipping	30	{"newWrongs14d": 0, "taskDoneRate": 1, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 10}, {"label": "完成质量", "score": 100}, {"label": "知识掌握", "score": 100}], "remainingLessons": 19, "daysSinceLastCheckin": 7}	林小满：出现下滑迹象	["已 7 天没有打卡记录"]	[{"type": "student_nudge", "target": "student", "message": "林小满，最近节奏有点松，先把到期的错题复习补上，进度就能追上。"}, {"type": "teacher_digest", "target": "teacher", "message": "【学情提醒】林小满 出现下滑迹象：已 7 天没有打卡记录"}]	t	2026-10-21 11:52:51.169765+08	\N	2026-10-21 11:52:51.169765+08	\N
99ce67bb-9a66-4cc8-87d6-0374f7e14a75	u_f54e97f52836855b	on_track	0	{"newWrongs14d": 1, "taskDoneRate": 0.5625, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 100}, {"label": "完成质量", "score": 75}, {"label": "知识掌握", "score": 100}], "remainingLessons": 225, "daysSinceLastCheckin": 0}	林小满：状态正常	["各项指标正常，保持当前节奏"]	[]	f	2026-10-21 12:03:27.86752+08	\N	2026-10-21 12:03:27.86752+08	\N
e7d4b9a6-c5f6-4063-9b1c-aa0f9922b98d	u_f54e97f52836855b	on_track	0	{"newWrongs14d": 1, "taskDoneRate": 0.5882352941176471, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 100}, {"label": "完成质量", "score": 77}, {"label": "知识掌握", "score": 100}], "remainingLessons": 244, "daysSinceLastCheckin": 0}	林小满：状态正常	["各项指标正常，保持当前节奏"]	[]	f	2026-10-21 17:48:16.071441+08	\N	2026-10-21 17:48:16.071441+08	\N
c8796596-23ee-4c40-87a2-ca2cc8f2d9fc	u_f54e97f52836855b	on_track	0	{"newWrongs14d": 1, "taskDoneRate": 0.6111111111111112, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 100}, {"label": "完成质量", "score": 79}, {"label": "知识掌握", "score": 100}], "remainingLessons": 263, "daysSinceLastCheckin": 0}	林小满：状态正常	["各项指标正常，保持当前节奏"]	[]	f	2026-10-21 17:48:59.181632+08	\N	2026-10-21 17:48:59.181632+08	\N
7debda86-9106-424c-895a-9309911fe514	u_747d2315fab64522	slipping	30	{"newWrongs14d": 0, "taskDoneRate": 1, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 10}, {"label": "完成质量", "score": 100}, {"label": "知识掌握", "score": 100}], "remainingLessons": 19, "daysSinceLastCheckin": 8}	林小满：出现下滑迹象	["已 8 天没有打卡记录"]	[{"type": "student_nudge", "target": "student", "message": "林小满，最近节奏有点松，先把到期的错题复习补上，进度就能追上。"}, {"type": "teacher_digest", "target": "teacher", "message": "【学情提醒】林小满 出现下滑迹象：已 8 天没有打卡记录"}]	t	2026-10-21 18:13:54.59755+08	\N	2026-10-21 18:13:54.59755+08	\N
71bf73f4-c1c7-4236-bcec-b243a29c749d	u_f54e97f52836855b	on_track	0	{"newWrongs14d": 1, "taskDoneRate": 0.6111111111111112, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 100}, {"label": "完成质量", "score": 79}, {"label": "知识掌握", "score": 100}], "remainingLessons": 263, "daysSinceLastCheckin": 0}	林小满：状态正常	["各项指标正常，保持当前节奏"]	[]	f	2026-10-21 18:13:58.583843+08	\N	2026-10-21 18:13:58.583843+08	\N
742e4a9c-7e55-4525-ac34-4cc507e365a9	u_f54e97f52836855b	on_track	0	{"newWrongs14d": 1, "taskDoneRate": 0.631578947368421, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 100}, {"label": "完成质量", "score": 80}, {"label": "知识掌握", "score": 100}], "remainingLessons": 282, "daysSinceLastCheckin": 0}	林小满：状态正常	["各项指标正常，保持当前节奏"]	[]	f	2026-10-21 18:17:30.379251+08	\N	2026-10-21 18:17:30.379251+08	\N
899c8831-a2a1-4003-99aa-0086e7066002	u_747d2315fab64522	churning	30	{"newWrongs14d": 0, "taskDoneRate": 1, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 10}, {"label": "完成质量", "score": 100}, {"label": "知识掌握", "score": 100}], "remainingLessons": 19, "daysSinceLastCheckin": 8}	林小满连续8天未打卡且投入度仅10分，存在明显流失风险，需立即激活学习参与。	["连续8天未打卡，投入度诊断仅10/100；总复习0次、近14天新错题0，近期缺少有效练习与复习行为。", "任务完成率100%、完成质量100%、知识掌握100%，但与投入度10严重背离，当前高质量数据缺少复习/错题数据支撑。", "剩余课时19节，仍有充足课消空间，但若持续低活跃，后续到课与续费风险会快速上升。"]	[{"type": "teacher_alert", "target": "teacher", "message": "林小满连续8天未打卡、投入度仅10分，且近14天无新错题、总复习0次。请24小时内电话回访，确认学习意愿和卡点，并安排一次15分钟诊断练习，回访后在系统记录结论。"}, {"type": "parent_notice", "target": "parent", "message": "家长您好，小满已连续8天未打卡，近期复习0次、投入度偏低；虽然作业完成率100%，但缺少练习反馈。建议今晚沟通学习安排，并固定每天20:00前完成1次打卡或10分钟复习，我会同步老师跟进。"}, {"type": "student_nudge", "target": "student", "message": "小满，看到你作业完成得不错，但已经8天没打卡啦。今晚先做一件小事：完成1组10分钟错题回顾并打卡，我让老师给你发专属小练习。"}, {"type": "practice_pack", "target": "student", "message": "为小满安排3天轻量巩固练习包：每天10分钟基础题+1道错题回顾，完成后拍照打卡；第3天由老师集中点评并反馈掌握情况。"}]	t	2026-10-21 18:20:16.185906+08	\N	2026-10-21 18:20:16.185906+08	\N
88e4054b-9344-438a-91a9-c22178e44f76	u_f54e97f52836855b	slipping	72	{"newWrongs14d": 1, "taskDoneRate": 0.631578947368421, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 100}, {"label": "完成质量", "score": 80}, {"label": "知识掌握", "score": 100}], "remainingLessons": 282, "daysSinceLastCheckin": 0}	投入与掌握度良好，但任务完成率63%且无复习记录，处于轻度滑落需及时干预。	["任务完成率仅63%，约37%任务未完成，虽今日已打卡但执行稳定性不足。", "总复习0条、逾期复习0条，复习环节尚未启动，存在遗忘风险。", "近14天新增错题1道，诊断投入度100/完成质量80/知识掌握100，基础状态好，问题集中在任务落实。"]	[{"type": "teacher_alert", "target": "teacher", "message": "林小满任务完成率63%，且目前无复习记录。请在下次课用5分钟核查未完成任务的原因，并为其布置2次10分钟复习任务，课后检查完成情况。"}, {"type": "student_nudge", "target": "student", "message": "小满，你今天已打卡，投入度很好；但任务完成率只有63%。请今天列出未完成任务并逐项补齐，同时完成1次10分钟错题复习，完成后回复我。"}, {"type": "parent_notice", "target": "parent", "message": "家长您好，小满近期投入度和掌握度表现很好，但任务完成率为63%、暂无复习记录。请协助每天固定15分钟检查任务清单是否完成，并在今晚确认未完成项补齐即可，无需加量。"}, {"type": "practice_pack", "target": "student", "message": "已为小满生成1道错题+基础巩固练习包，建议分2次完成，每次10分钟，重点训练审题与订正。"}]	t	2026-10-21 18:20:24.17161+08	\N	2026-10-21 18:20:24.17161+08	\N
4ebe2724-5800-4d6c-b7af-0aca536caaf8	u_f54e97f52836855b	slipping	78	{"newWrongs14d": 1, "taskDoneRate": 0.6190476190476191, "totalReviews": 0, "overdueReviews": 0, "diagnosisScores": [{"label": "投入度", "score": 100}, {"label": "完成质量", "score": 81}, {"label": "知识掌握", "score": 100}], "remainingLessons": 301, "daysSinceLastCheckin": 0}	整体学习状态稳定，但任务完成率仅62%，需优先提升执行度。	["taskDoneRate=0.62，近阶段任务完成率偏低，是当前主要风险点。", "daysSinceLastCheckin=0，投入度诊断100，说明学生仍在活跃学习、未掉线。", "newWrongs14d=1，知识掌握诊断100，说明错误量低、掌握基础较好；totalReviews=0且overdueReviews=0，复习闭环尚未建立但无逾期。"]	[{"type": "student_nudge", "target": "student", "message": "小满，今天已按时打卡很棒！接下来7天我们把每日任务完成率从62%提到80%：每天先完成1个核心任务并打勾，任务超过30分钟就拆成2个15分钟小目标，完成后在群里回“已完成”。"}, {"type": "teacher_alert", "target": "teacher", "message": "老师您好，林小满近14天任务完成率62%，但打卡活跃、知识掌握诊断100、错题仅1道。请帮其把每日任务拆成2-3个15分钟小目标，并在下次课检查未完成原因，先连续7天把完成率稳定到80%。"}, {"type": "practice_pack", "target": "student", "message": "已为小满配置7天轻量巩固包：每天2道错题变式+1个核心任务，15分钟内完成；完成后在任务清单打勾，连续7天达成80%完成率即可。"}]	t	2026-10-21 18:21:46.665141+08	\N	2026-10-21 18:21:46.665141+08	\N
\.


--
-- Data for Name: study_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.study_progress (id, student_user_id, subject, chapter, percent, current_point, updated_by_user_id, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
cc9b7a25-1b03-4476-891c-add1d383b9a6	u_f54e97f52836855b	数学	第3章 函数	72	二次函数最值	u_63838e8eca74d816	2026-10-13 22:00:48.222613+08	\N	2026-10-13 22:00:48.222613+08	\N
\.


--
-- Data for Name: study_task; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.study_task (id, teacher_user_id, student_user_id, subject, title, content, due_at, status, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
62ba07d8-f16f-44fd-ad8a-98bf12b3a674	u_63838e8eca74d816	u_747d2315fab64522	数学	整理错题本	\N	\N	approved	2026-10-13 15:07:40.506249+08	\N	2026-10-13 15:07:40.506249+08	\N
ab1b3edb-a7bf-4f8f-a943-0ccae851e866	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	open	2026-10-13 22:00:47.879584+08	\N	2026-10-13 22:00:47.879584+08	\N
8edcc51e-92a3-4169-850b-140ea5106a7f	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-21 17:48:58.128575+08	\N	2026-10-21 17:48:58.128575+08	\N
30978827-600c-4253-8f55-11b5c483f692	u_d21e2a16db0d6ad8	u_f54e97f52836855b	\N	越权任务	\N	\N	rejected	2026-10-13 22:00:47.906202+08	\N	2026-10-13 22:00:47.906202+08	\N
d078fdcc-9955-4a79-982a-0b255f936527	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	open	2026-10-13 22:01:48.6877+08	\N	2026-10-13 22:01:48.6877+08	\N
17519ec0-85a5-4a74-b34c-7a705b541479	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-21 18:17:01.297304+08	\N	2026-10-21 18:17:01.297304+08	\N
d18d0854-dc4c-4d38-96b4-2dabc570415a	u_d21e2a16db0d6ad8	u_f54e97f52836855b	\N	越权任务	\N	\N	rejected	2026-10-13 22:01:48.713771+08	\N	2026-10-13 22:01:48.713771+08	\N
345c2b7c-8a96-4f1e-9bf6-62b2d7dcf0a0	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	open	2026-10-13 22:02:17.482134+08	\N	2026-10-13 22:02:17.482134+08	\N
023013e9-b095-4f57-855c-a008b4eb709e	system	u_747d2315fab64522	综合	【专项练习】错题同类题巩固	为小满安排3天轻量巩固练习包：每天10分钟基础题+1道错题回顾，完成后拍照打卡；第3天由老师集中点评并反馈掌握情况。	2026-10-28 18:20:16.211+08	open	2026-10-21 18:20:16.211433+08	\N	2026-10-21 18:20:16.211433+08	\N
4b8026db-0614-4aa4-9253-69d01083a379	system	u_f54e97f52836855b	综合	【专项练习】错题同类题巩固	已为小满生成1道错题+基础巩固练习包，建议分2次完成，每次10分钟，重点训练审题与订正。	2026-10-28 18:20:24.184+08	open	2026-10-21 18:20:24.184531+08	\N	2026-10-21 18:20:24.184531+08	\N
c17fc49e-d8f3-4ec0-b140-95e66e558c00	u_d21e2a16db0d6ad8	u_f54e97f52836855b	\N	越权任务	\N	\N	rejected	2026-10-13 22:02:17.508024+08	\N	2026-10-13 22:02:17.508024+08	\N
ac8a6892-b128-44c8-b998-4d9e30c9750c	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-13 22:02:35.8045+08	\N	2026-10-13 22:02:35.8045+08	\N
a2e04ba0-0a07-4079-aebf-5097fc122674	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-13 22:32:30.401092+08	\N	2026-10-13 22:32:30.401092+08	\N
9a919181-8529-492e-93a6-0efa75b3b77f	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-21 18:21:13.853034+08	\N	2026-10-21 18:21:13.853034+08	\N
d60dd876-1b95-4777-8276-f5e3de3d695c	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-17 16:31:39.74097+08	\N	2026-10-17 16:31:39.74097+08	\N
cc124ba8-ff58-43b2-9258-b1fc6bbc3965	system	u_f54e97f52836855b	综合	【专项练习】错题同类题巩固	已为小满配置7天轻量巩固包：每天2道错题变式+1个核心任务，15分钟内完成；完成后在任务清单打勾，连续7天达成80%完成率即可。	2026-10-28 18:21:46.674+08	open	2026-10-21 18:21:46.675349+08	\N	2026-10-21 18:21:46.675349+08	\N
656fc42d-0f66-45f4-a747-de5c3e271527	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-17 16:31:53.39566+08	\N	2026-10-17 16:31:53.39566+08	\N
a05584f5-fdbd-4c34-995f-a95c8b9ec322	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-17 17:24:22.676358+08	\N	2026-10-17 17:24:22.676358+08	\N
c9bcdb49-e520-4098-a5c1-c7d6033be8eb	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-17 17:24:42.959365+08	\N	2026-10-17 17:24:42.959365+08	\N
5cebed3f-fbd8-43ef-bfab-66f1947276e3	system	u_f54e97f52836855b	数学	【复习】测试复习排期：x²=16 求x	这是你的第 2 轮复习。	2026-10-20 11:21:49.66+08	open	2026-10-19 11:21:49.661133+08	\N	2026-10-19 11:21:49.661133+08	\N
2bd827af-46a9-4ad8-816e-d46c35f3744f	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-19 11:39:23.702748+08	\N	2026-10-19 11:39:23.702748+08	\N
112d1115-32b0-4ce5-8bb6-7e43446e5d4a	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-19 11:39:41.864308+08	\N	2026-10-19 11:39:41.864308+08	\N
9259707c-dbfe-4148-b213-0c4646069533	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-21 12:03:27.258612+08	\N	2026-10-21 12:03:27.258612+08	\N
55af5548-f5fb-40a9-87cc-f631dd4b448d	u_63838e8eca74d816	u_f54e97f52836855b	数学	整理错题本	\N	2026-10-16 20:00:00+08	approved	2026-10-21 17:48:15.013615+08	\N	2026-10-21 17:48:15.013615+08	\N
\.


--
-- Data for Name: task_checkin; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_checkin (id, task_id, student_user_id, content, image_urls, duration_min, status, review_comment, reviewed_by_user_id, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
273a148f-539e-44ad-b791-8fc1953bac97	62ba07d8-f16f-44fd-ad8a-98bf12b3a674	u_747d2315fab64522	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-13 15:07:40.556646+08	\N	2026-10-13 15:07:40.556646+08	\N
4aced330-f2d0-4525-bf98-e90796e8311e	30978827-600c-4253-8f55-11b5c483f692	u_f54e97f52836855b	已完成，错题已订正	{}	30	rejected	越权尝试	u_d21e2a16db0d6ad8	2026-10-13 22:00:47.972297+08	\N	2026-10-13 22:00:47.972297+08	\N
0226c362-0617-40a3-853f-d259ff61c168	d18d0854-dc4c-4d38-96b4-2dabc570415a	u_f54e97f52836855b	已完成，错题已订正	{}	30	rejected	越权尝试	u_d21e2a16db0d6ad8	2026-10-13 22:01:48.774848+08	\N	2026-10-13 22:01:48.774848+08	\N
54403e5e-58db-4e5e-ab8a-e68f797a5af3	c17fc49e-d8f3-4ec0-b140-95e66e558c00	u_f54e97f52836855b	已完成，错题已订正	{}	30	rejected	越权尝试	u_d21e2a16db0d6ad8	2026-10-13 22:02:17.557929+08	\N	2026-10-13 22:02:17.557929+08	\N
ee6b5f71-fdeb-4b2a-af3c-33d403d8e0a3	ac8a6892-b128-44c8-b998-4d9e30c9750c	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-13 22:02:35.870914+08	\N	2026-10-13 22:02:35.870914+08	\N
de05d500-49cc-496e-a0d6-b8d630fa5f0d	a2e04ba0-0a07-4079-aebf-5097fc122674	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-13 22:32:30.475005+08	\N	2026-10-13 22:32:30.475005+08	\N
b1d2a19d-5655-4799-9c87-7d300699f48d	d60dd876-1b95-4777-8276-f5e3de3d695c	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-17 16:31:39.831107+08	\N	2026-10-17 16:31:39.831107+08	\N
352bf2bc-c1c7-4a19-844c-eb240bb03b81	656fc42d-0f66-45f4-a747-de5c3e271527	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-17 16:31:53.47625+08	\N	2026-10-17 16:31:53.47625+08	\N
08a5f3c7-9447-46fd-9536-dbb67bf42d6c	a05584f5-fdbd-4c34-995f-a95c8b9ec322	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-17 17:24:22.763964+08	\N	2026-10-17 17:24:22.763964+08	\N
85023f6e-badc-4463-b650-d4cf96ae56f9	c9bcdb49-e520-4098-a5c1-c7d6033be8eb	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-17 17:24:43.036107+08	\N	2026-10-17 17:24:43.036107+08	\N
636a3468-c3e6-40ee-a633-71d2723486fb	2bd827af-46a9-4ad8-816e-d46c35f3744f	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-19 11:39:23.771708+08	\N	2026-10-19 11:39:23.771708+08	\N
7e44ee8b-0d08-48d1-aef9-bc666d81631b	112d1115-32b0-4ce5-8bb6-7e43446e5d4a	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-19 11:39:41.970126+08	\N	2026-10-19 11:39:41.970126+08	\N
53a0d4cb-b15f-406b-b69d-78fffb26b36e	9259707c-dbfe-4148-b213-0c4646069533	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-21 12:03:27.302497+08	\N	2026-10-21 12:03:27.302497+08	\N
097c9385-5f1d-45de-b204-7a0a7b47e1ff	55af5548-f5fb-40a9-87cc-f631dd4b448d	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-21 17:48:15.082919+08	\N	2026-10-21 17:48:15.082919+08	\N
76ad461e-5fc3-488c-b89c-35b0a238c72c	8edcc51e-92a3-4169-850b-140ea5106a7f	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-21 17:48:58.196523+08	\N	2026-10-21 17:48:58.196523+08	\N
45396e40-3ab7-4d7d-8582-857de6b5e2b1	17519ec0-85a5-4a74-b34c-7a705b541479	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-21 18:17:01.381333+08	\N	2026-10-21 18:17:01.381333+08	\N
1f1dfc48-e76c-4311-8364-af4fc4e3e2e3	9a919181-8529-492e-93a6-0efa75b3b77f	u_f54e97f52836855b	已完成，错题已订正	{}	30	approved	完成得不错	u_63838e8eca74d816	2026-10-21 18:21:13.938271+08	\N	2026-10-21 18:21:13.938271+08	\N
\.


--
-- Data for Name: teaching_link; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teaching_link (id, teacher_user_id, student_user_id, subject, _created_at, _created_by, _updated_at, _updated_by) FROM stdin;
fd7c3b9f-33c7-4d87-bb9c-713157fb98c3	u_63838e8eca74d816	u_747d2315fab64522	\N	2026-10-13 15:07:40.412331+08	\N	2026-10-13 15:07:40.412331+08	\N
1b9e14f8-d0e4-4823-879b-12455784df0b	u_63838e8eca74d816	u_f54e97f52836855b	\N	2026-10-13 22:00:47.771786+08	\N	2026-10-13 22:00:47.771786+08	\N
\.


--
-- Data for Name: wrong_question; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wrong_question (id, student_user_id, subject, chapter, title, reason, knowledge_point, status, _created_at, _created_by, _updated_at, _updated_by, review_stage, review_count, next_review_at, last_review_at, review_task_id) FROM stdin;
e3ca04c1-892f-4e8e-89df-6f6bc41c612d	u_f54e97f52836855b	数学	第3章 函数	测试复习排期：x²=16 求x	审题偏差	二次函数最值	mastered	2026-10-19 10:40:35.439331+08	\N	2026-10-19 10:40:35.439331+08	\N	8	8	\N	2026-10-21 18:21:32.099+08	\N
\.


--
-- Name: admission_major admission_major_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admission_major
    ADD CONSTRAINT admission_major_pkey PRIMARY KEY (id);


--
-- Name: admission_school admission_school_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admission_school
    ADD CONSTRAINT admission_school_pkey PRIMARY KEY (id);


--
-- Name: ai_message ai_message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_message
    ADD CONSTRAINT ai_message_pkey PRIMARY KEY (id);


--
-- Name: ai_session ai_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_session
    ADD CONSTRAINT ai_session_pkey PRIMARY KEY (id);


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
-- Name: education_kb education_kb_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.education_kb
    ADD CONSTRAINT education_kb_pkey PRIMARY KEY (id);


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
-- Name: student_insight student_insight_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_insight
    ADD CONSTRAINT student_insight_pkey PRIMARY KEY (id);


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
-- Name: idx_ai_message_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_message_session ON public.ai_message USING btree (session_id, _created_at);


--
-- Name: idx_ai_session_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_session_student ON public.ai_session USING btree (student_user_id, _created_at);


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
-- Name: idx_insight_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insight_student ON public.student_insight USING btree (student_user_id, _created_at DESC);


--
-- Name: idx_kb_stage_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kb_stage_category ON public.education_kb USING btree (stage, category);


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
-- Name: idx_wq_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wq_review ON public.wrong_question USING btree (next_review_at) WHERE (next_review_at IS NOT NULL);


--
-- Name: idx_wq_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wq_student ON public.wrong_question USING btree (student_user_id, _created_at);


--
-- Name: uk_admission_major; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_admission_major ON public.admission_major USING btree (name);


--
-- Name: uk_admission_school; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_admission_school ON public.admission_school USING btree (name);


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
-- Name: uk_edu_kb_title; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_edu_kb_title ON public.education_kb USING btree (stage, title);


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

\unrestrict 9nhOhoN26XcuJ6IOaIl6uy8MU9IDfSO8ppIWAQBiFk9YSoK3INiLaTIqFTVV7ST

