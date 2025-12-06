/**
 * Файл: init-db/05-migrate.js
 * Назначение: Выполнение ETL (Extract, Transform, Load)
 * Перенос данных из сырых коллекций (raw_...) в целевые (courses, students, grades).
 */

db = db.getSiblingDB('university');

print("--- 05-migrate.js: Начинаем миграцию данных (ETL) ---");

// Проверка: Если коллекция 'grades' уже существует и содержит данные, пропускаем миграцию.
if (db.grades.countDocuments({}) > 0) {
    print("Коллекция 'grades' уже заполнена. Миграция пропущена.");
    // exit 0
} else {
    print("Начинаем процесс миграции, коллекции очищаются и заполняются...");

    // ====================================================================
    // ШАГ 1: Миграция и Денормализация 'courses'
    // ====================================================================
    // Удаляем старую коллекцию и создаем новую
    db.courses.drop();
    print("   -> Очистка 'courses' завершена.");

    // Используем Aggregation Framework для объединения курсов с их оценками (assessments)
    db.raw_courses.aggregate([
        {
            $lookup: {
                from: "raw_assessments", // Объединяем с метаданными оценок
                localField: "code_module",
                foreignField: "code_module",
                as: "assessments_metadata"
            }
        },
        {
            // Формируем целевой документ
            $project: {
                _id: 0,
                code_module: "$code_module",
                code_presentation: "$code_presentation",
                length_days: "$module_presentation_length", // Переименование для ясности
                // Вложение метаданных оценок
                assessments: {
                    $map: {
                        input: "$assessments_metadata",
                        as: "a",
                        in: {
                            // Очистка и преобразование типов для вложенных данных
                            assessment_id: { $toInt: "$$a.id_assessment" },
                            type: "$$a.assessment_type",
                            date_due: {
                               $convert: {
                                    input: "$$a.date",
                                    to: "int",
                                    onError: -1, 
                                    onNull: -1   
                                }
},
                            weight: {
                                  $convert: {
                                        input: "$$a.weight",
                                        to: "double",
                                        onError: 0.0,
                                        onNull: 0.0
                                        }
                                  }
                        }
                    }
                }
            }
        },
        {
            $out: "courses" // Вывод результата агрегации в новую коллекцию 'courses'
        }
    ]);

    print("Миграция 'courses' (с вложенными оценками) завершена.");

    // ====================================================================
    // ШАГ 2: Миграция 'students'
    // ====================================================================
    db.students.drop();
    print("   -> Очистка 'students' завершена.");

    // Используем Aggregation Framework для преобразования типов и денормализации
    db.raw_studentInfo.aggregate([
        {
            $project: {
                _id: 0,
                // Преобразование id_student в int
                id_student: {
                  $convert: {
                      input: "$id_student",
                      to: "int",
                      onError: "$$REMOVE", // Удалить документ, если ID невалидный
                      onNull: "$$REMOVE" 
                  }
              },
                code_module: "$code_module",
                code_presentation: "$code_presentation",
                final_result: "$final_result",
                // Денормализация демографии в один вложенный объект
                demographics: {
                    gender: "$gender",
                    region: "$region",
                    age_band: "$age_band",
                    highest_education: "$highest_education",
                    disability: "$disability"
                },
                study_history: {
                    num_of_prev_attempts: {
                      $convert: {
                          input: "$num_of_prev_attempts",
                          to: "int",
                          onError: 0, 
                          onNull: 0
                      }
                  },
                    studied_credits: {
                      $convert: {
                          input: "$studied_credits",
                          to: "int",
                          onError: 0,   // Если ошибка (например, '?'), ставим 0
                          onNull: 0     // Если поле отсутствует, ставим 0
                        }
                    }
                }
            }
        },
   {
            $out: "students"
        }
    ]);

    print("Миграция 'students' (с денормализованной демографией) завершена.");
}


// ====================================================================
    // ШАГ 3: Миграция 'grades' (Оценки)
    // ====================================================================
    db.grades.drop();
    print("    -> Очистка 'grades' завершена.");

    // Основная агрегация для обогащения оценок
    db.raw_studentAssessment.aggregate([
        // 1. Объединяем с метаданными оценочной работы
        {
            $lookup: {
                from: "raw_assessments",
                localField: "id_assessment",
                foreignField: "id_assessment",
                as: "assessment_details"
            }
        },
        {
            $unwind: "$assessment_details" 
        },
        // 2. Формируем целевой документ с денормализованными данными
        {
            $project: {
                _id: 0,
                // --- Безопасное преобразование основных полей ---
                id_student: { 
                    $convert: { input: "$id_student", to: "int", onError: "$$REMOVE", onNull: "$$REMOVE" } 
                },
                score: {
                    $convert: { input: "$score", to: "int", onError: -1, onNull: -1 } // Используем -1 для пропущенных оценок!
                },
                date_submitted: {
                    $convert: { input: "$date_submitted", to: "int", onError: -1, onNull: -1 } // Используем -1 для пропущенной даты сдачи
                },
                
                assessment_id: { 
                        $convert: { 
                            input: "$id_assessment", 
                            to: "int", 
                            onError: "$$REMOVE", // Если ID невалидный, удаляем документ
                            onNull: "$$REMOVE" 
                        } 
                    },
                is_banked: { $toBool: "$is_banked" },
                
                // --- Денормализация данных о курсе (из assessment_details) ---
                course_info: {
                    code_module: "$assessment_details.code_module",
                    code_presentation: "$assessment_details.code_presentation"
                },
                // --- Денормализация данных о работе (из assessment_details) ---
                assessment_info: {
                    type: "$assessment_details.assessment_type",
                    date_due:  { 
                      $convert: { 
                          input: "$assessment_details.date", 
                          to: "int", 
                          onError: -1, 
                          onNull: -1 
                      } 
},// Здесь date должен быть числом, берем из raw_assessments
                    weight: {
                        $convert: { input: "$assessment_details.weight", to: "double", onError: 0.0, onNull: 0.0 }
                    }
                }
            }
        },
        // 3. Сохраняем результат
        {
            $out: "grades" // Вывод результата агрегации в новую коллекцию 'grades'
        }
    ]);

    print("Миграция 'grades' (обогащенные оценки) завершена.");
