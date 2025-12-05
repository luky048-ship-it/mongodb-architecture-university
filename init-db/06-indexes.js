/**
 * Файл: init-db/06-indexes.js
 * Назначение: Создание вторичных индексов для оптимизации типовых запросов.
 * Выполняется после миграции данных.
 */

db = db.getSiblingDB('university');

print("--- 06-indexes.js: Начинаем создание вторичных индексов ---");

// ====================================================================
// 1. Индексы для коллекции 'grades' (Оценки)
// ====================================================================
// 'grades' - самая часто запрашиваемая коллекция, требующая максимальной оптимизации.

// Индекс по ID студента (Самый частый запрос: студент смотрит свои оценки)
db.grades.createIndex(
    { "id_student": 1 }, 
    { name: "idx_student_id", background: true }
);
print("Индекс 'idx_student_id' (grades) создан.");

// Комбинированный индекс по Курсу и Студенту
// Запрос: Преподаватель ищет все оценки по конкретному курсу для конкретного студента
db.grades.createIndex(
    { 
        "course_info.code_module": 1, 
        "course_info.code_presentation": 1, 
        "id_student": 1 
    }, 
    { name: "idx_course_student", background: true }
);
print("Индекс 'idx_course_student' (grades) создан.");

// Комбинированный индекс для Аналитики успеваемости по времени
// Запрос: Отчет по динамике сдачи оценок по конкретному курсу
db.grades.createIndex(
    { 
        "course_info.code_module": 1, 
        "course_info.code_presentation": 1, 
        "date_submitted": 1 
    }, 
    { name: "idx_course_date", background: true }
);
print("Индекс 'idx_course_date' (grades) создан.");

// Индекс для быстрого поиска студентов по типу оценки или баллу
db.grades.createIndex(
    { "assessment_info.type": 1, "score": -1 }, // Сортировка по убыванию score
    { name: "idx_type_score", background: true }
);
print("Индекс 'idx_type_score' (grades) создан.");


// ====================================================================
// 2. Индексы для коллекции 'students' (Студенты)
// ====================================================================

// Индекс по Статусу (final_result)
// Запрос: Деканат ищет всех, кто отчислен (Withdrawn) или успешно закончил (Distinction)
db.students.createIndex(
    { "final_result": 1 }, 
    { name: "idx_final_result", background: true }
);
print("Индекс 'idx_final_result' (students) создан.");

// Комбинированный индекс по Курсу и Статусу
// Запрос: Деканат ищет, сколько студентов отчислилось с конкретного курса
db.students.createIndex(
    { 
        "code_module": 1, 
        "code_presentation": 1, 
        "final_result": 1 
    }, 
    { name: "idx_course_status", background: true }
);
print("Индекс 'idx_course_status' (students) создан.");

// Индексы для коллекции 'courses' (Курсы)
// Здесь в основном используется встроенный уникальный индекс по _id
// и индекс для быстрого поиска по коду модуля.
db.courses.createIndex(
    { "code_module": 1, "code_presentation": 1 }, 
    { name: "idx_course_unique", unique: true, background: true }
);
print("Уникальный индекс 'idx_course_unique' (courses) создан.");


print("--- 06-indexes.js: Создание вторичных индексов завершено ---");
