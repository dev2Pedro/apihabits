import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const firstHabitId = "0730ffac-d039-4194-9571-01aa2aa0efbd";
const firstHabitCreationDate = new Date("2025-08-01T03:00:00.000");

const secondHabitId = "00880d75-a933-4fef-94ab-e05744435297";
const secondHabitCreationDate = new Date("2025-08-05T03:00:00.000");

const thirdHabitId = "fa1a1bcf-3d87-4626-8c0d-d7fd1255ac00";
const thirdHabitCreationDate = new Date("2025-08-10T03:00:00.000");

async function run() {
  // Deletar filhos primeiro
  await prisma.dayhabit.deleteMany();
  await prisma.habitWeekDays.deleteMany();

  // Depois deletar os pais
  await prisma.day.deleteMany();
  await prisma.habit.deleteMany();

  /**
   * Create habits
   */
  await Promise.all([
    prisma.habit.create({
      data: {
        id: firstHabitId,
        title: "Beber 2L água",
        created_at: firstHabitCreationDate,
        WeekDays: {
          create: [{ week_day: 1 }, { week_day: 2 }, { week_day: 3 }],
        },
      },
    }),

    prisma.habit.create({
      data: {
        id: secondHabitId,
        title: "Exercitar",
        created_at: secondHabitCreationDate,
        WeekDays: {
          create: [{ week_day: 3 }, { week_day: 4 }, { week_day: 5 }],
        },
      },
    }),

    prisma.habit.create({
      data: {
        id: thirdHabitId,
        title: "Dormir 8h",
        created_at: thirdHabitCreationDate,
        WeekDays: {
          create: [
            { week_day: 1 },
            { week_day: 2 },
            { week_day: 3 },
            { week_day: 4 },
            { week_day: 5 },
          ],
        },
      },
    }),
  ]);

  await Promise.all([
    /**
     * Habits (Complete/Available): 1/1
     */
    prisma.day.create({
      data: {
        /** Tuesday - 27 Aug */
        date: new Date("2025-08-27T03:00:00.000z"),
        DayHabits: {
          create: {
            habit_id: firstHabitId,
          },
        },
      },
    }),

    /**
     * Habits (Complete/Available): 1/1
     */
    prisma.day.create({
      data: {
        /** Wednesday - 28 Aug */
        date: new Date("2025-08-28T03:00:00.000z"),
        DayHabits: {
          create: {
            habit_id: firstHabitId,
          },
        },
      },
    }),

    /**
     * Habits (Complete/Available): 2/2 - TODAY
     */
    prisma.day.create({
      data: {
        /** Thursday - 29 Aug 2025 (TODAY) */
        date: new Date("2025-08-29T03:00:00.000z"),
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
