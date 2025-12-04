CREATE TABLE IF NOT EXISTS `UserProfiles` (
    `user_id` BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    `bio` TEXT NULL,
    `profile_image_url` VARCHAR(255) NULL,
    `resume_url` VARCHAR(255) NULL,
    `industry_id` INT NULL,
    `privacy` ENUM('public', 'private') NOT NULL DEFAULT 'public',
    `tier` ENUM('free', 'premium') NOT NULL DEFAULT 'free',
    `updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_profile_user`
        FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE,

    CONSTRAINT `fk_profile_industry`
        FOREIGN KEY (`industry_id`) REFERENCES `Industries`(`id`)
        ON DELETE SET NULL
);