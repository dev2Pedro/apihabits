import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";

const app = Fastify();
const prisma = new PrismaClient();

app.get("/hello", async () => {
  const habits = await prisma.habit.findMany();

  app.register(cors);

  return habits;
});

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log("HTTP Server running!");
  });
