-- Active: 1785829722713@@127.0.0.1@3306@oncare
DROP DATABASE IF EXISTS oncare;
create DATABASE oncare;
USE oncare;

SELECT COUNT(*) FROM oncare.ai_faq WHERE approved = 1;