import { FastifyInstance } from "fastify";
import { z } from "zod";
import dayjs from "dayjs";
import { prisma } from "./lib/prisma";

export function appRoutes(app: FastifyInstance) {
  app.post("/habits", async (request) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    });

    const { title, weekDays } = createHabitBody.parse(request.body);

    const today = dayjs().startOf("day").toDate();

    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        WeekDays: {
          create: weekDays.map((weekDay) => {
            return {
              week_day: weekDay,
            };
          }),
        },
      },
    });
  });

  app.get("/day", async (request) => {
    const getDayParams = z.object({
      date: z.coerce.date(),
    });

    const { date } = getDayParams.parse(request.query);

    const parsedDate = dayjs(date).startOf("day");
    const weekDay = parsedDate.get("day");

    // Buscar hábitos possíveis para o dia da semana
    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: parsedDate.toDate(),
        },
        WeekDays: {
          some: {
            week_day: weekDay,
          },
        },
      },
    });

    // Buscar o dia específico com os hábitos completados
    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate(),
      },
      include: {
        DayHabits: true,
      },
    });

    // Formatar a resposta conforme esperado
    return {
      possibleHabits,
      day: day
        ? {
            id: day.id,
            date: day.date,
            dayHabits: day.DayHabits,
          }
        : {
            id: null,
            date: parsedDate.toDate(),
            dayHabits: [],
          },
    };
  });
}
