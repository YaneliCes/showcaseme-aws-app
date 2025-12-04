CREATE TABLE IF NOT EXISTS `CourseIndustries` (
    `course_id` BIGINT UNSIGNED NOT NULL,
    `industry_id` INT NOT NULL,
    PRIMARY KEY (`course_id`, `industry_id`),

    CONSTRAINT `fk_course_ind_course`
        FOREIGN KEY (`course_id`) REFERENCES `Courses`(`id`)
        ON DELETE CASCADE,

    CONSTRAINT `fk_course_ind_industry`
        FOREIGN KEY (`industry_id`) REFERENCES `Industries`(`id`)
        ON DELETE CASCADE
);
