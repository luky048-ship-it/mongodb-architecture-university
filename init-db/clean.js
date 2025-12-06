// init-db/05_1-clean-students.js

print("--- Начинаем автоматическую очистку дубликатов в коллекции 'students' ---");

// Используем Aggregation Pipeline для нахождения и удаления дубликатов.
db.students.aggregate([
  {
    $group: {
      _id: "$id_student", // Группируем по полю, которое должно быть уникальным
      duplicates: { $push: "$_id" }, // Сохраняем все _id, принадлежащие этому id_student
      count: { $sum: 1 } // Считаем количество документов
    }
  },
  { $match: { count: { $gt: 1 } } } // Находим только те, где count > 1 (дубликаты)
]).forEach(function(doc) {
  // Удаляем все документы, кроме первого (оставляем документ с наименьшим _id)
  doc.duplicates.shift(); 
  db.students.deleteMany({ _id: { $in: doc.duplicates } });
});

print("Автоматическая очистка коллекции 'students' завершена.");
