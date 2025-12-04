CREATE TABLE IF NOT EXISTS `CourseSkills` (
    `course_id` BIGINT UNSIGNED NOT NULL,
    `skill_id` INT NOT NULL,
    PRIMARY KEY (`course_id`, `skill_id`),

    CONSTRAINT `fk_course_skill_course`
        FOREIGN KEY (`course_id`) REFERENCES `Courses`(`id`)
        ON DELETE CASCADE,

    CONSTRAINT `fk_course_skill_skill`
        FOREIGN KEY (`skill_id`) REFERENCES `Skills`(`id`)
        ON DELETE CASCADE
);
