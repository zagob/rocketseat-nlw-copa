import Fastify from "fastify";
import { z } from "zod";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import ShortUniqueId from "short-unique-id";

const prisma = new PrismaClient({
  log: ["query"],
});

bootstrap();
async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
  });

  fastify.get("/pools/count", async () => {
    const count = await prisma.pool.count();
    return { count };
  });

  fastify.get("/guesses/count", async () => {
    const count = await prisma.guess.count();
    return { count };
  });

  fastify.get("/users/count", async () => {
    const count = await prisma.user.count();
    return { count };
  });

  fastify.get("/pools/existCode/:code", async (request, reply) => {
    const createCodeBody = z.object({
      code: z.string(),
    });
    const { code } = createCodeBody.parse(request.params);

    const responsePoolExist = await prisma.pool.findFirst({
      where: {
        code: {
          equals: code,
        },
      },
      select: {
        code: true,
      },
    });

    console.log("res: ", !!responsePoolExist?.code);

    return { responsePoolExist: responsePoolExist?.code };
  });

  fastify.post("/pools", async (request, reply) => {
    const createPoolBody = z.object({
      title: z.string(),
    });

    const { title } = createPoolBody.parse(request.body);

    const generate = new ShortUniqueId({ length: 6 });
    const code = String(generate()).toUpperCase();

    await prisma.pool.create({
      data: {
        title,
        code,
      },
    });

    return reply.status(201).send({ code });
  });

  await fastify.listen({ port: 3333, host: "0.0.0.0" });
}