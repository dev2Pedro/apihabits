import dayjs from "dayjs";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./lib/prisma";

export async function appRoutes(app: FastifyInstance) {
  app.post("/habits", async (request, reply) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    });

    const { title, weekDays } = createHabitBody.parse(request.body);

    const today = dayjs().startOf("day").toDate();

    const habit = await prisma.habit.create({
      data: {
        title,
        created_at: today,
        WeekDays: {
          create: weekDays.map((weekDay) => ({ week_day: weekDay })),
        },
      },
    });

    return reply.status(201).send(habit);
  });

  app.get("/day", async (request) => {
    const rawQuery = request.query as Record<string, string>;

    const dateKey = Object.keys(rawQuery).find((key) => key.trim() === "date");
    if (!dateKey) {
      throw new Error("Date parameter is required");
    }

    const dateValue = rawQuery[dateKey];
    const parsedDate = dayjs(dateValue).startOf("day");

    if (!parsedDate.isValid()) {
      throw new Error("Invalid date");
    }

    const weekDay = parsedDate.get("day");

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: { lte: parsedDate.toDate() },
        WeekDays: { some: { week_day: weekDay } },
      },
    });

    const day = await prisma.day.findFirst({
      where: { date: parsedDate.toDate() },
      include: { DayHabits: true },
    });

    const completedHabits = day?.DayHabits.map((dh) => dh.habit_id) ?? [];

    return { possibleHabits, completedHabits };
  });

  app.patch("/habits/:id/toggle", async (request) => {
    const toggleHabitParams = z.object({ id: z.string().uuid() });
    const { id } = toggleHabitParams.parse(request.params);

    const today = dayjs().startOf("day").toDate();

    let day = await prisma.day.findUnique({ where: { date: today } });
    if (!day) {
      day = await prisma.day.create({ data: { date: today } });
    }

    const dayHabit = await prisma.dayhabit.findUnique({
      where: { day_id_habit_id: { day_id: day.id, habit_id: id } },
    });

    if (dayHabit) {
      await prisma.dayhabit.delete({ where: { id: dayHabit.id } });
    } else {
      await prisma.dayhabit.create({ data: { day_id: day.id, habit_id: id } });
    }
  });

  app.get("/summary", async () => {
    const summary = await prisma.$queryRaw`
      SELECT 
        D.id, 
        D.date,
        (
          SELECT CAST(count(*) AS float)
          FROM day_habits DH
          WHERE DH.day_id = D.id
        ) AS completed,
        (
          SELECT CAST(count(*) AS float)
          FROM habit_week_days HDW
          JOIN habits H ON H.id = HDW.habit_id
          WHERE HDW.week_day = CAST(strftime('%w', D.date/1000.0, 'unixepoch') AS int)
            AND H.created_at <= D.date
        ) AS amount
      FROM days D
    `;
    return summary;
  });
}
