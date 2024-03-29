import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })

    const { email, password } = createUserBodySchema.parse(request.body)

    const user = {
      id: randomUUID(),
      email,
      password,
    }

    const userWithSomeEmail = await knex('users').where({ email }).first()

    if (userWithSomeEmail) {
      return reply.status(400).send({
        error: 'A user with that email already exists',
      })
    }

    await knex('users').insert(user)

    return reply.status(201).send()
  })
}
