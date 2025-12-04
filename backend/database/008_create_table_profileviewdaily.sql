CREATE TABLE IF NOT EXISTS `ProfileViewDaily` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `date` DATE NOT NULL,
    `view_count` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`user_id`, `date`),

    CONSTRAINT `fk_pvd_user`
        FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE
);
