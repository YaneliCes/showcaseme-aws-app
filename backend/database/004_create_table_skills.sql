CREATE TABLE IF NOT EXISTS `Skills` (
    `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('hard', 'soft') NOT NULL,
    UNIQUE (`name`, `type`)
);