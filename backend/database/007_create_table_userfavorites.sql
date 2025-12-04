CREATE TABLE IF NOT EXISTS `UserFavorites` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `favorite_user_id` BIGINT UNSIGNED NOT NULL,
    `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `favorite_user_id`),

    CONSTRAINT `fk_fav_user`
        FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE,

    CONSTRAINT `fk_fav_target_user`
        FOREIGN KEY (`favorite_user_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE
);
