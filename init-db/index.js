/**
 * Файл: init-db/06-indexes.js
 * Назначение: Создание индексов.
 */

db = db.getSiblingDB('university');

print("--- 06-indexes.js: Начинаем автоматическое создание индексов ---");

// ====================================================================
// 1. Индексы для коллекции 'students'
// ====================================================================

db.students.createIndex(
    { "id_student": 1 }, 
    { unique: true, name: "idx_students_id", background: true }
);
print("Индекс 'idx_students_id' (students, unique) создан.");

db.students.createIndex(
    { "final_result": 1, "demographics.highest_education": 1 }, 
    { name: "idx_result_education", background: true }
);
print("Индекс 'idx_result_education' (students) создан.");


// ====================================================================
// 2. Индексы для коллекции 'grades'
// ====================================================================

db.grades.createIndex(
    { "id_student": 1 }, 
    { name: "idx_grades_student_id", background: true }
);
print("Индекс 'idx_grades_student_id' (grades) создан.");

db.grades.createIndex(
    { 
        "course_info.code_module": 1, 
        "assessment_info.type": 1, 
        "score": -1 
    }, 
    { name: "idx_module_type_score", background: true }
);
print("Индекс 'idx_module_type_score' (grades) создан.");


// ====================================================================
// 3. Индексы для коллекции 'courses'
// ====================================================================

db.courses.createIndex(
    { "code_module": 1, "code_presentation": 1 }, 
    { unique: true, name: "idx_course_unique", background: true }
);
print("Уникальный индекс 'idx_course_unique' (courses) создан.");


print("--- 06-indexes.js: Создание индексов завершено ---");
