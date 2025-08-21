import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const firstHabitId = "0730ffac-d039-4194-9571-01aa2aa0efbd";
const firstHabitCreationDate = new Date("2022-12-31T03:00:00.000Z");
const secondHabitId = "00880d75-a933-4fef-94ab-e0574435297";
const secondHabitCreationDate = new Date("2023-01-03T03:00:00.000Z");
const thirdHabitId = "fa1a1bcf-3d87-4626-8c0d-d7fd1255ac00";
const thirdHabitCreationDate = new Date("2023-01-08T03:00:00.000Z");

async function run() {
  await prisma.day.deleteMany();
  await prisma.habitWeekDays.deleteMany();
  await prisma.habit.deleteMany();

  await Promise.all([
    prisma.habit.create({
      data: {
        id: firstHabitId,
        title: "Beber 2L água",
        created_at: firstHabitCreationDate,
      },
    }),
    prisma.habit.create({
      data: {
        id: secondHabitId,
        title: "Exercício físico",
        created_at: secondHabitCreationDate,
      },
    }),
    prisma.habit.create({
      data: {
        id: thirdHabitId,
        title: "Ler um livro",
        created_at: thirdHabitCreationDate,
      },
    }),
  ]);

  // Create week day associations separately
  await Promise.all([
    // First habit - all days except Sunday
    ...Array.from({ length: 6 }, (_, i) =>
      prisma.habitWeekDays.create({
        data: {
          habit_id: firstHabitId,
          week_day: i + 1,
        },
      })
    ),
    // Second habit - Monday, Wednesday, Friday
    ...[1, 3, 5].map((day) =>
      prisma.habitWeekDays.create({
        data: {
          habit_id: secondHabitId,
          week_day: day,
        },
      })
    ),
    // Third habit - Tuesday, Thursday
    ...[2, 4].map((day) =>
      prisma.habitWeekDays.create({
        data: {
          habit_id: thirdHabitId,
          week_day: day,
        },
      })
    ),
  ]);

  await Promise.all([
    prisma.day.create({
      data: {
        date: new Date("2025-11-10T00:00:00.000Z"),
        DayHabits: {
          create: {
            habit_id: firstHabitId,
          },
        },
      },
    }),
    prisma.day.create({
      data: {
        date: new Date("2025-12-10T00:00:00.000Z"),
        DayHabits: {
          create: [{ habit_id: firstHabitId }, { habit_id: secondHabitId }],
        },
      },
    }),
  ]);
}

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
