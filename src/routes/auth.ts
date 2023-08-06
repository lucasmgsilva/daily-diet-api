import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const authBodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })

    const { email, password } = authBodySchema.parse(request.body)

    const user = await knex('users').where({ email, password }).first()

    if (!user) {
      return reply.status(400).send({ message: 'Invalid credentials' })
    }

    reply.cookie('userId', user.id, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    })

    return reply.send()
  })
}
