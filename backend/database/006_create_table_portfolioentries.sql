CREATE TABLE IF NOT EXISTS `PortfolioEntries` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,

    `type` ENUM('education', 'job', 'project', 'affiliation') NOT NULL,

    `title` VARCHAR(150) NOT NULL,
    `organization` VARCHAR(150) NULL,

    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `is_current` BOOLEAN DEFAULT 0,

    `details` TEXT NULL,
    `url` VARCHAR(255) NULL,
    `display_order` INT NOT NULL DEFAULT 0,

    `created` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_portfolio_user`
        FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`)
        ON DELETE CASCADE
);
