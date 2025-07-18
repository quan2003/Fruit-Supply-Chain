PGDMP                      }            fruit_supply_chain    17.4    17.2 s    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    32768    fruit_supply_chain    DATABASE     x   CREATE DATABASE fruit_supply_chain WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-US';
 "   DROP DATABASE fruit_supply_chain;
                     postgres    false            w           1247    49326    fruit_quality    TYPE     �   CREATE TYPE public.fruit_quality AS ENUM (
    'Nắng',
    'Mưa',
    'Khô hạn',
    'Ẩm ướt',
    'Sương mù',
    'Gió mạnh'
);
     DROP TYPE public.fruit_quality;
       public               postgres    false            n           1247    49194    recommendation_type    TYPE     �   CREATE TYPE public.recommendation_type AS ENUM (
    'PopularFruit',
    'FarmingTip',
    'SupportArea',
    'YieldForecast'
);
 &   DROP TYPE public.recommendation_type;
       public               postgres    false            k           1247    49172    supply_step    TYPE     -  CREATE TYPE public.supply_step AS ENUM (
    'Harvested',
    'PurchasedByThirdParty',
    'ShippedByFarmer',
    'ReceivedByThirdParty',
    'SellByThirdParty',
    'PurchasedByCustomer',
    'ShippedByThirdParty',
    'ReceivedByDeliveryHub',
    'ShippedByDeliveryHub',
    'ReceivedByCustomer'
);
    DROP TYPE public.supply_step;
       public               postgres    false            h           1247    49153 	   user_role    TYPE     �   CREATE TYPE public.user_role AS ENUM (
    'Producer',
    'ThirdParty',
    'DeliveryHub',
    'Customer',
    'Admin',
    'Government'
);
    DROP TYPE public.user_role;
       public               postgres    false            �            1255    49232    update_timestamp()    FUNCTION     �   CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
 )   DROP FUNCTION public.update_timestamp();
       public               postgres    false            �            1259    155648    farm_statistics    TABLE     $  CREATE TABLE public.farm_statistics (
    farm_id character varying(50) NOT NULL,
    total_fruit_harvested bigint DEFAULT 0 NOT NULL,
    total_contracts_created bigint DEFAULT 0 NOT NULL,
    total_contracts_completed bigint DEFAULT 0 NOT NULL,
    last_update bigint DEFAULT 0 NOT NULL
);
 #   DROP TABLE public.farm_statistics;
       public         heap r       postgres    false            �            1259    49340    farms    TABLE     w  CREATE TABLE public.farms (
    id integer NOT NULL,
    producer_id integer,
    farm_name character varying(255) NOT NULL,
    location character varying(255) NOT NULL,
    weather_condition character varying(255),
    yield integer DEFAULT 0,
    quality public.fruit_quality,
    current_conditions character varying(255),
    last_updated timestamp without time zone
);
    DROP TABLE public.farms;
       public         heap r       postgres    false    887            �            1259    49339    farms_id_seq    SEQUENCE     �   CREATE SEQUENCE public.farms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.farms_id_seq;
       public               postgres    false    222            �           0    0    farms_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.farms_id_seq OWNED BY public.farms.id;
          public               postgres    false    221            �            1259    57422 	   inventory    TABLE     �  CREATE TABLE public.inventory (
    id integer NOT NULL,
    product_id integer,
    delivery_hub_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    received_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    productdate timestamp without time zone,
    expirydate timestamp without time zone,
    transaction_hash character varying(255),
    fruit_id integer
);
    DROP TABLE public.inventory;
       public         heap r       postgres    false            �            1259    57421    inventory_id_seq    SEQUENCE     �   CREATE SEQUENCE public.inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.inventory_id_seq;
       public               postgres    false    228            �           0    0    inventory_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.inventory_id_seq OWNED BY public.inventory.id;
          public               postgres    false    227            �            1259    49383    orders    TABLE     �  CREATE TABLE public.orders (
    id integer NOT NULL,
    product_id integer,
    customer_id integer,
    quantity integer NOT NULL,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50),
    shipping_address character varying(255) NOT NULL,
    transaction_hash character varying(255),
    price numeric,
    shipping_fee numeric DEFAULT 0,
    payment_method character varying(50) DEFAULT 'Unknown'::character varying
);
    DROP TABLE public.orders;
       public         heap r       postgres    false            �            1259    49382    orders_id_seq    SEQUENCE     �   CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.orders_id_seq;
       public               postgres    false    226            �           0    0    orders_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;
          public               postgres    false    225            �            1259    57440    outgoing_products    TABLE     �  CREATE TABLE public.outgoing_products (
    id integer NOT NULL,
    product_id integer,
    delivery_hub_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    listed_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'Available'::character varying,
    transaction_hash text,
    listing_id text,
    fruit_id integer,
    original_quantity integer
);
 %   DROP TABLE public.outgoing_products;
       public         heap r       postgres    false            �            1259    57439    outgoing_products_id_seq    SEQUENCE     �   CREATE SEQUENCE public.outgoing_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.outgoing_products_id_seq;
       public               postgres    false    230            �           0    0    outgoing_products_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.outgoing_products_id_seq OWNED BY public.outgoing_products.id;
          public               postgres    false    229            �            1259    122881    product_ratings    TABLE     M  CREATE TABLE public.product_ratings (
    id integer NOT NULL,
    listing_id character varying(255) NOT NULL,
    customer_id integer NOT NULL,
    rating integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT product_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);
 #   DROP TABLE public.product_ratings;
       public         heap r       postgres    false            �            1259    122880    product_ratings_id_seq    SEQUENCE     �   CREATE SEQUENCE public.product_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.product_ratings_id_seq;
       public               postgres    false    238            �           0    0    product_ratings_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.product_ratings_id_seq OWNED BY public.product_ratings.id;
          public               postgres    false    237            �            1259    98304    products    TABLE     �  CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    productcode character varying(50) NOT NULL,
    category character varying(50) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    imageurl character varying(255),
    productdate date,
    expirydate date,
    farm_id integer,
    hash text,
    fruit_id integer
);
    DROP TABLE public.products;
       public         heap r       postgres    false            �            1259    98309    products_id_seq    SEQUENCE     �   CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.products_id_seq;
       public               postgres    false    235            �           0    0    products_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;
          public               postgres    false    236            �            1259    155657    province_statistics    TABLE     T  CREATE TABLE public.province_statistics (
    province character varying(100) NOT NULL,
    total_fruit_harvested bigint DEFAULT 0 NOT NULL,
    total_contracts_created bigint DEFAULT 0 NOT NULL,
    total_contracts_completed bigint DEFAULT 0 NOT NULL,
    farm_count bigint DEFAULT 0 NOT NULL,
    last_update bigint DEFAULT 0 NOT NULL
);
 '   DROP TABLE public.province_statistics;
       public         heap r       postgres    false            �            1259    49298    recommendations    TABLE     �   CREATE TABLE public.recommendations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    recommendation_type public.recommendation_type NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 #   DROP TABLE public.recommendations;
       public         heap r       postgres    false    878            �            1259    49297    recommendations_id_seq    SEQUENCE     �   CREATE SEQUENCE public.recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 -   DROP SEQUENCE public.recommendations_id_seq;
       public               postgres    false    220            �           0    0    recommendations_id_seq    SEQUENCE OWNED BY     Q   ALTER SEQUENCE public.recommendations_id_seq OWNED BY public.recommendations.id;
          public               postgres    false    219            �            1259    73746    shipment_products    TABLE       CREATE TABLE public.shipment_products (
    id integer NOT NULL,
    shipment_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    price numeric(10,2),
    productdate timestamp without time zone,
    expirydate timestamp without time zone
);
 %   DROP TABLE public.shipment_products;
       public         heap r       postgres    false            �            1259    73745    shipment_products_id_seq    SEQUENCE     �   CREATE SEQUENCE public.shipment_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.shipment_products_id_seq;
       public               postgres    false    234            �           0    0    shipment_products_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.shipment_products_id_seq OWNED BY public.shipment_products.id;
          public               postgres    false    233            �            1259    73738 	   shipments    TABLE     �  CREATE TABLE public.shipments (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    sender_type character varying(50) NOT NULL,
    recipient_id integer NOT NULL,
    recipient_type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'In Transit'::character varying NOT NULL,
    shipment_date timestamp without time zone NOT NULL,
    received_date timestamp without time zone
);
    DROP TABLE public.shipments;
       public         heap r       postgres    false            �            1259    73737    shipments_id_seq    SEQUENCE     �   CREATE SEQUENCE public.shipments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 '   DROP SEQUENCE public.shipments_id_seq;
       public               postgres    false    232            �           0    0    shipments_id_seq    SEQUENCE OWNED BY     E   ALTER SEQUENCE public.shipments_id_seq OWNED BY public.shipments.id;
          public               postgres    false    231            �            1259    49370    supply_chain_steps    TABLE     �   CREATE TABLE public.supply_chain_steps (
    id integer NOT NULL,
    product_id integer,
    step character varying(255) NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 &   DROP TABLE public.supply_chain_steps;
       public         heap r       postgres    false            �            1259    49369    supply_chain_steps_id_seq    SEQUENCE     �   CREATE SEQUENCE public.supply_chain_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.supply_chain_steps_id_seq;
       public               postgres    false    224            �           0    0    supply_chain_steps_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.supply_chain_steps_id_seq OWNED BY public.supply_chain_steps.id;
          public               postgres    false    223            �            1259    139265    triparty_contracts    TABLE     �  CREATE TABLE public.triparty_contracts (
    id integer NOT NULL,
    contract_id integer NOT NULL,
    farm_id character varying(255) NOT NULL,
    delivery_hub_wallet_address character varying(42) NOT NULL,
    creation_date timestamp without time zone NOT NULL,
    expiry_date timestamp without time zone NOT NULL,
    total_quantity integer NOT NULL,
    price_per_unit numeric(36,18) NOT NULL,
    terms text NOT NULL,
    is_active boolean NOT NULL,
    is_completed boolean NOT NULL,
    farm_signature text,
    agent_signature text,
    government_signature text,
    is_farm_signed boolean DEFAULT false,
    is_agent_signed boolean DEFAULT false,
    is_government_signed boolean DEFAULT false
);
 &   DROP TABLE public.triparty_contracts;
       public         heap r       postgres    false            �            1259    139264    triparty_contracts_id_seq    SEQUENCE     �   CREATE SEQUENCE public.triparty_contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.triparty_contracts_id_seq;
       public               postgres    false    240            �           0    0    triparty_contracts_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.triparty_contracts_id_seq OWNED BY public.triparty_contracts.id;
          public               postgres    false    239            �            1259    49204    users    TABLE     w  CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.user_role NOT NULL,
    wallet_address character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_logged_in boolean DEFAULT false
);
    DROP TABLE public.users;
       public         heap r       postgres    false    872            �            1259    49203    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public               postgres    false    218            �           0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public               postgres    false    217            �           2604    98310    farms id    DEFAULT     d   ALTER TABLE ONLY public.farms ALTER COLUMN id SET DEFAULT nextval('public.farms_id_seq'::regclass);
 7   ALTER TABLE public.farms ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    222    222            �           2604    98311    inventory id    DEFAULT     l   ALTER TABLE ONLY public.inventory ALTER COLUMN id SET DEFAULT nextval('public.inventory_id_seq'::regclass);
 ;   ALTER TABLE public.inventory ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    227    228    228            �           2604    98312 	   orders id    DEFAULT     f   ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);
 8   ALTER TABLE public.orders ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225    226            �           2604    98313    outgoing_products id    DEFAULT     |   ALTER TABLE ONLY public.outgoing_products ALTER COLUMN id SET DEFAULT nextval('public.outgoing_products_id_seq'::regclass);
 C   ALTER TABLE public.outgoing_products ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    229    230    230            �           2604    122884    product_ratings id    DEFAULT     x   ALTER TABLE ONLY public.product_ratings ALTER COLUMN id SET DEFAULT nextval('public.product_ratings_id_seq'::regclass);
 A   ALTER TABLE public.product_ratings ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    238    237    238            �           2604    98314    products id    DEFAULT     j   ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);
 :   ALTER TABLE public.products ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    236    235            �           2604    98315    recommendations id    DEFAULT     x   ALTER TABLE ONLY public.recommendations ALTER COLUMN id SET DEFAULT nextval('public.recommendations_id_seq'::regclass);
 A   ALTER TABLE public.recommendations ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    219    220    220            �           2604    73749    shipment_products id    DEFAULT     |   ALTER TABLE ONLY public.shipment_products ALTER COLUMN id SET DEFAULT nextval('public.shipment_products_id_seq'::regclass);
 C   ALTER TABLE public.shipment_products ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    234    233    234            �           2604    73741    shipments id    DEFAULT     l   ALTER TABLE ONLY public.shipments ALTER COLUMN id SET DEFAULT nextval('public.shipments_id_seq'::regclass);
 ;   ALTER TABLE public.shipments ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    232    231    232            �           2604    98316    supply_chain_steps id    DEFAULT     ~   ALTER TABLE ONLY public.supply_chain_steps ALTER COLUMN id SET DEFAULT nextval('public.supply_chain_steps_id_seq'::regclass);
 D   ALTER TABLE public.supply_chain_steps ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    223    224    224            �           2604    139268    triparty_contracts id    DEFAULT     ~   ALTER TABLE ONLY public.triparty_contracts ALTER COLUMN id SET DEFAULT nextval('public.triparty_contracts_id_seq'::regclass);
 D   ALTER TABLE public.triparty_contracts ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    240    239    240            �           2604    98317    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    218    217    218            �          0    155648    farm_statistics 
   TABLE DATA           �   COPY public.farm_statistics (farm_id, total_fruit_harvested, total_contracts_created, total_contracts_completed, last_update) FROM stdin;
    public               postgres    false    241   �       �          0    49340    farms 
   TABLE DATA           �   COPY public.farms (id, producer_id, farm_name, location, weather_condition, yield, quality, current_conditions, last_updated) FROM stdin;
    public               postgres    false    222   �       �          0    57422 	   inventory 
   TABLE DATA           �   COPY public.inventory (id, product_id, delivery_hub_id, quantity, price, received_date, productdate, expirydate, transaction_hash, fruit_id) FROM stdin;
    public               postgres    false    228   +�       �          0    49383    orders 
   TABLE DATA           �   COPY public.orders (id, product_id, customer_id, quantity, order_date, status, shipping_address, transaction_hash, price, shipping_fee, payment_method) FROM stdin;
    public               postgres    false    226   H�       �          0    57440    outgoing_products 
   TABLE DATA           �   COPY public.outgoing_products (id, product_id, delivery_hub_id, quantity, price, listed_date, status, transaction_hash, listing_id, fruit_id, original_quantity) FROM stdin;
    public               postgres    false    230   e�       �          0    122881    product_ratings 
   TABLE DATA           Z   COPY public.product_ratings (id, listing_id, customer_id, rating, created_at) FROM stdin;
    public               postgres    false    238   ��       �          0    98304    products 
   TABLE DATA           �   COPY public.products (id, name, productcode, category, description, price, quantity, imageurl, productdate, expirydate, farm_id, hash, fruit_id) FROM stdin;
    public               postgres    false    235   ��       �          0    155657    province_statistics 
   TABLE DATA           �   COPY public.province_statistics (province, total_fruit_harvested, total_contracts_created, total_contracts_completed, farm_count, last_update) FROM stdin;
    public               postgres    false    242   ��       �          0    49298    recommendations 
   TABLE DATA           `   COPY public.recommendations (id, user_id, recommendation_type, content, created_at) FROM stdin;
    public               postgres    false    220   ٚ       �          0    73746    shipment_products 
   TABLE DATA           r   COPY public.shipment_products (id, shipment_id, product_id, quantity, price, productdate, expirydate) FROM stdin;
    public               postgres    false    234   ��       �          0    73738 	   shipments 
   TABLE DATA           �   COPY public.shipments (id, sender_id, sender_type, recipient_id, recipient_type, status, shipment_date, received_date) FROM stdin;
    public               postgres    false    232   �       �          0    49370    supply_chain_steps 
   TABLE DATA           O   COPY public.supply_chain_steps (id, product_id, step, "timestamp") FROM stdin;
    public               postgres    false    224   0�       �          0    139265    triparty_contracts 
   TABLE DATA           -  COPY public.triparty_contracts (id, contract_id, farm_id, delivery_hub_wallet_address, creation_date, expiry_date, total_quantity, price_per_unit, terms, is_active, is_completed, farm_signature, agent_signature, government_signature, is_farm_signed, is_agent_signed, is_government_signed) FROM stdin;
    public               postgres    false    240   M�       �          0    49204    users 
   TABLE DATA           j   COPY public.users (id, name, email, password, role, wallet_address, created_at, is_logged_in) FROM stdin;
    public               postgres    false    218   j�       �           0    0    farms_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.farms_id_seq', 1, false);
          public               postgres    false    221            �           0    0    inventory_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.inventory_id_seq', 1, false);
          public               postgres    false    227            �           0    0    orders_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.orders_id_seq', 1, false);
          public               postgres    false    225            �           0    0    outgoing_products_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.outgoing_products_id_seq', 1, false);
          public               postgres    false    229            �           0    0    product_ratings_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.product_ratings_id_seq', 1, false);
          public               postgres    false    237            �           0    0    products_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.products_id_seq', 1, false);
          public               postgres    false    236            �           0    0    recommendations_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.recommendations_id_seq', 1, false);
          public               postgres    false    219            �           0    0    shipment_products_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.shipment_products_id_seq', 1, false);
          public               postgres    false    233            �           0    0    shipments_id_seq    SEQUENCE SET     ?   SELECT pg_catalog.setval('public.shipments_id_seq', 1, false);
          public               postgres    false    231            �           0    0    supply_chain_steps_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.supply_chain_steps_id_seq', 1, false);
          public               postgres    false    223            �           0    0    triparty_contracts_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.triparty_contracts_id_seq', 1, false);
          public               postgres    false    239            �           0    0    users_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.users_id_seq', 1, false);
          public               postgres    false    217                       2606    155656 $   farm_statistics farm_statistics_pkey 
   CONSTRAINT     g   ALTER TABLE ONLY public.farm_statistics
    ADD CONSTRAINT farm_statistics_pkey PRIMARY KEY (farm_id);
 N   ALTER TABLE ONLY public.farm_statistics DROP CONSTRAINT farm_statistics_pkey;
       public                 postgres    false    241                       2606    49348    farms farms_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.farms
    ADD CONSTRAINT farms_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.farms DROP CONSTRAINT farms_pkey;
       public                 postgres    false    222                       2606    57428    inventory inventory_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.inventory DROP CONSTRAINT inventory_pkey;
       public                 postgres    false    228                       2606    49389    orders orders_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_pkey;
       public                 postgres    false    226            	           2606    57447 (   outgoing_products outgoing_products_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.outgoing_products
    ADD CONSTRAINT outgoing_products_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.outgoing_products DROP CONSTRAINT outgoing_products_pkey;
       public                 postgres    false    230                       2606    122888 $   product_ratings product_ratings_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.product_ratings
    ADD CONSTRAINT product_ratings_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.product_ratings DROP CONSTRAINT product_ratings_pkey;
       public                 postgres    false    238                       2606    98319    products products_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.products DROP CONSTRAINT products_pkey;
       public                 postgres    false    235                       2606    155666 ,   province_statistics province_statistics_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.province_statistics
    ADD CONSTRAINT province_statistics_pkey PRIMARY KEY (province);
 V   ALTER TABLE ONLY public.province_statistics DROP CONSTRAINT province_statistics_pkey;
       public                 postgres    false    242            �           2606    49306 $   recommendations recommendations_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.recommendations DROP CONSTRAINT recommendations_pkey;
       public                 postgres    false    220                       2606    73751 (   shipment_products shipment_products_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.shipment_products
    ADD CONSTRAINT shipment_products_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.shipment_products DROP CONSTRAINT shipment_products_pkey;
       public                 postgres    false    234                       2606    73744    shipments shipments_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.shipments DROP CONSTRAINT shipments_pkey;
       public                 postgres    false    232                       2606    49376 *   supply_chain_steps supply_chain_steps_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.supply_chain_steps
    ADD CONSTRAINT supply_chain_steps_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.supply_chain_steps DROP CONSTRAINT supply_chain_steps_pkey;
       public                 postgres    false    224                       2606    139274 5   triparty_contracts triparty_contracts_contract_id_key 
   CONSTRAINT     w   ALTER TABLE ONLY public.triparty_contracts
    ADD CONSTRAINT triparty_contracts_contract_id_key UNIQUE (contract_id);
 _   ALTER TABLE ONLY public.triparty_contracts DROP CONSTRAINT triparty_contracts_contract_id_key;
       public                 postgres    false    240                       2606    139272 *   triparty_contracts triparty_contracts_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.triparty_contracts
    ADD CONSTRAINT triparty_contracts_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.triparty_contracts DROP CONSTRAINT triparty_contracts_pkey;
       public                 postgres    false    240                       2606    131073 #   outgoing_products unique_listing_id 
   CONSTRAINT     d   ALTER TABLE ONLY public.outgoing_products
    ADD CONSTRAINT unique_listing_id UNIQUE (listing_id);
 M   ALTER TABLE ONLY public.outgoing_products DROP CONSTRAINT unique_listing_id;
       public                 postgres    false    230            �           2606    49214    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    218            �           2606    49212    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    218            �           2606    49216    users users_wallet_address_key 
   CONSTRAINT     c   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);
 H   ALTER TABLE ONLY public.users DROP CONSTRAINT users_wallet_address_key;
       public                 postgres    false    218                       2606    49349    farms farms_producer_id_fkey    FK CONSTRAINT        ALTER TABLE ONLY public.farms
    ADD CONSTRAINT farms_producer_id_fkey FOREIGN KEY (producer_id) REFERENCES public.users(id);
 F   ALTER TABLE ONLY public.farms DROP CONSTRAINT farms_producer_id_fkey;
       public               postgres    false    222    4859    218            !           2606    57434 (   inventory inventory_delivery_hub_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_delivery_hub_id_fkey FOREIGN KEY (delivery_hub_id) REFERENCES public.users(id);
 R   ALTER TABLE ONLY public.inventory DROP CONSTRAINT inventory_delivery_hub_id_fkey;
       public               postgres    false    4859    228    218            "           2606    98320 #   inventory inventory_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
 M   ALTER TABLE ONLY public.inventory DROP CONSTRAINT inventory_product_id_fkey;
       public               postgres    false    228    4881    235                       2606    49390    orders orders_customer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);
 H   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_customer_id_fkey;
       public               postgres    false    226    4859    218                        2606    98325    orders orders_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
 G   ALTER TABLE ONLY public.orders DROP CONSTRAINT orders_product_id_fkey;
       public               postgres    false    235    226    4881            #           2606    57453 8   outgoing_products outgoing_products_delivery_hub_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.outgoing_products
    ADD CONSTRAINT outgoing_products_delivery_hub_id_fkey FOREIGN KEY (delivery_hub_id) REFERENCES public.users(id);
 b   ALTER TABLE ONLY public.outgoing_products DROP CONSTRAINT outgoing_products_delivery_hub_id_fkey;
       public               postgres    false    230    218    4859            $           2606    98330 3   outgoing_products outgoing_products_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.outgoing_products
    ADD CONSTRAINT outgoing_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
 ]   ALTER TABLE ONLY public.outgoing_products DROP CONSTRAINT outgoing_products_product_id_fkey;
       public               postgres    false    235    4881    230            '           2606    122889 0   product_ratings product_ratings_customer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.product_ratings
    ADD CONSTRAINT product_ratings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);
 Z   ALTER TABLE ONLY public.product_ratings DROP CONSTRAINT product_ratings_customer_id_fkey;
       public               postgres    false    218    238    4859            &           2606    98335    products products_farm_id_fkey    FK CONSTRAINT     }   ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_farm_id_fkey FOREIGN KEY (farm_id) REFERENCES public.farms(id);
 H   ALTER TABLE ONLY public.products DROP CONSTRAINT products_farm_id_fkey;
       public               postgres    false    4865    235    222                       2606    49307 ,   recommendations recommendations_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.recommendations DROP CONSTRAINT recommendations_user_id_fkey;
       public               postgres    false    218    4859    220            %           2606    73752 4   shipment_products shipment_products_shipment_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.shipment_products
    ADD CONSTRAINT shipment_products_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;
 ^   ALTER TABLE ONLY public.shipment_products DROP CONSTRAINT shipment_products_shipment_id_fkey;
       public               postgres    false    232    234    4877                       2606    98340 5   supply_chain_steps supply_chain_steps_product_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.supply_chain_steps
    ADD CONSTRAINT supply_chain_steps_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
 _   ALTER TABLE ONLY public.supply_chain_steps DROP CONSTRAINT supply_chain_steps_product_id_fkey;
       public               postgres    false    224    4881    235            �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �     