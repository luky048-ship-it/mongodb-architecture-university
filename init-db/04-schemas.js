/**
 * Файл: init-db/04-schemas.js
 * Назначение: Применение JSON Schema Validation к целевым коллекциям.
 * Выполняется автоматически при первом запуске контейнера MongoDB.
 */

// Переключаемся на нашу базу данных 'university'
db = db.getSiblingDB('university');

print("--- 04-schemas.js: Начинаем создание схем валидации ---");

// ====================================================================
// 1. Схема для коллекции 'students' (На основе raw_studentInfo)
// ====================================================================
// Цель: Обеспечить корректность демографических данных и статуса.
const studentSchema = {
    $jsonSchema: {
        bsonType: "object",
        title: "Student Document Validation",
        required: [ "id_student", "gender", "final_result" ],
        properties: {
            id_student: {
                bsonType: "int",
                description: "Уникальный ID студента (обязательно, целое число)."
            },
            gender: {
                bsonType: "string",
                description: "Пол студента (обязательно, 'M' или 'F').",
                enum: [ "M", "F" ]
            },
            region: {
                bsonType: "string",
                description: "Регион проживания."
            },
            // Статус завершения обучения - ключевое поле для отчетов деканата
            final_result: {
                bsonType: "string",
                description: "Итоговый статус студента (обязательно, из перечисленных).",
                enum: [ "Pass", "Fail", "Withdrawn", "Distinction" ]
            },
            // Вложенные структуры для демографии
            demographics: {
                bsonType: "object",
                properties: {
                    age_band: { bsonType: "string" },
                    highest_education: { bsonType: "string" }
                }
            }
        }
    }
};

// Применение схемы к коллекции 'students'
try {
    db.createCollection("students", { validator: studentSchema });
    print("Схема валидации для коллекции 'students' успешно создана.");
} catch (e) {
    // Если коллекция уже существует, просто обновляем валидатор
    db.runCommand({
        collMod: "students",
        validator: studentSchema,
        validationLevel: "strict", // Запрещаем вставку/обновление невалидных документов
        validationAction: "error"
    });
    print("Схема валидации для коллекции 'students' успешно обновлена.");
}


// ====================================================================
// 2. Схема для коллекции 'grades' (На основе raw_studentAssessment)
// ====================================================================
// Цель: Гарантировать, что баллы за оценку находятся в пределах [0, 100].
const gradeSchema = {
    $jsonSchema: {
        bsonType: "object",
        title: "Grade Document Validation",
        required: [ "id_student", "assessment_id", "score" ],
        properties: {
            id_student: {
                bsonType: "int",
                description: "ID студента, которому принадлежит оценка."
            },
            // Фактический балл
            score: {
                bsonType: "int",
                description: "Полученный балл (обязательно, целое число от 0 до 100).",
                minimum: 0,
                maximum: 100
            },
            // День сдачи относительно начала презентации курса
            date_submitted: {
                bsonType: "int",
                description: "День сдачи оценки (целое число)."
            },
            // Ссылка на оценочную работу (в целевой схеме это ObjectId)
            assessment_id: {
                bsonType: "int",
                description: "ID оценочной работы из исходных данных."
            },
            // Поле 'type' будет добавлено при миграции
            type: {
                bsonType: "string",
                enum: [ "TMA", "CMA", "Exam" ] // Типы оценочных работ
            }
        }
    }
};

// Применение схемы к коллекции 'grades'
try {
    db.createCollection("grades", { validator: gradeSchema });
    print("Схема валидации для коллекции 'grades' успешно создана.");
} catch (e) {
    db.runCommand({
        collMod: "grades",
        validator: gradeSchema,
        validationLevel: "strict",
        validationAction: "error"
    });
    print("Схема валидации для коллекции 'grades' успешно обновлена.");
}

print("--- 04-schemas.js: Создание схем валидации завершено ---");
