-- No legacy dictionary tables exist in this checkout/database.
CREATE TABLE `dictionary_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `term` VARCHAR(191) NOT NULL,
    `phonetic` VARCHAR(191) NULL,
    `partOfSpeech` ENUM('N', 'V', 'ADJ', 'ADV', 'PHRASE', 'IDIOM') NULL,
    `meaning` TEXT NULL,
    `example` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `dictionary_entries_term_key`(`term`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
