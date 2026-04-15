-- CreateTable
CREATE TABLE "students" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "exam_type" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '📚',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "exam_type" TEXT NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "coefficient" REAL NOT NULL DEFAULT 1.0,
    "display_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "topics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exams" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "student_id" INTEGER NOT NULL,
    "exam_name" TEXT NOT NULL,
    "exam_date" DATETIME NOT NULL,
    "total_net" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exams_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exam_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "blank_count" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "net_score" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "exam_results_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "exam_results_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_analysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "exam_result_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "blank_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "question_analysis_exam_result_id_fkey" FOREIGN KEY ("exam_result_id") REFERENCES "exam_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_analysis_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
