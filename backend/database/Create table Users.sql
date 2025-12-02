CREATE TABLE IF NOT EXISTS `Users` (
    `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `email`           VARCHAR(100) NOT NULL UNIQUE,
    `username`        VARCHAR(30)  NOT NULL UNIQUE default (substring_index(email, '@', 1)) ,
    `first_name`      VARCHAR(30) NOT NULL,
    `last_name`       VARCHAR(30) NOT NULL,
    `password`   VARCHAR(60) NOT NULL,
    `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)