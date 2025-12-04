CREATE TABLE IF NOT EXISTS `UserSkills` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `skill_id` INT NOT NULL,
    `proficiency` TINYINT NULL,
    PRIMARY KEY (`user_id`, `skill_id`),

    CONSTRAINT `fk_userskills_user`
        FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE,

    CONSTRAINT `fk_userskills_skill`
        FOREIGN KEY (`skill_id`) REFERENCES `Skills`(`id`)
        ON DELETE CASCADE
);
