-- Contains commands for dropping/creating our database depending on answers to prompts. 

\echo 'Delete and recreate ig_clone db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE ig_clone;
CREATE DATABASE ig_clone;
\connect ig_clone

\i ig-clone-schema.sql
\i ig-clone-seed.sql

\echo 'Delete and recreate ig_clone_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE ig_clone_test;
CREATE DATABASE ig_clone_test;
\connect ig_clone_test

\i ig-clone-schema.sql
