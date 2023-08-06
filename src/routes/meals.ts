import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { checkUserIdExists } from '../middlewares/check-user-id-exists'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [checkUserIdExists] }, async (request, reply) => {
    const { userId } = request.cookies

    const createMealBodySchema = z.object({
      name: z.string().min(1).max(255),
      description: z.string().min(1).max(255),
      date: z.string(),
      isDietary: z.boolean(),
    })

    const { name, description, date, isDietary } = createMealBodySchema.parse(
      request.body,
    )

    const meal = {
      id: randomUUID(),
      name,
      description,
      date,
      is_dietary: isDietary,
      user_id: userId,
    }

    await knex('meals').insert(meal)

    reply.status(201).send()
  })

  app.post(
    '/:id',
    { preHandler: [checkUserIdExists] },
    async (request, reply) => {
      const { userId } = request.cookies

      const paramsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = paramsSchema.parse(request.params)

      const editMealBodySchema = z.object({
        name: z.string().min(1).max(255),
        description: z.string().min(1).max(255),
        date: z.string(),
        isDietary: z.boolean(),
      })

      const { name, description, date, isDietary } = editMealBodySchema.parse(
        request.body,
      )

      await knex('meals')
        .update({
          name,
          description,
          date,
          is_dietary: isDietary,
        })
        .where({ id, user_id: userId })

      return reply.status(200).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkUserIdExists] },
    async (request, reply) => {
      const { userId } = request.cookies

      const deleteMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = deleteMealParamsSchema.parse(request.params)

      await knex('meals').delete().where({ id, user_id: userId })

      return reply.status(204).send()
    },
  )

  app.get('/', { preHandler: [checkUserIdExists] }, async (request) => {
    const { userId } = request.cookies

    const meals = await knex('meals').where({ user_id: userId })

    return { meals }
  })

  app.get('/:id', { preHandler: [checkUserIdExists] }, async (request) => {
    const { userId } = request.cookies

    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex('meals').where({ id, user_id: userId }).first()

    return { meal }
  })

  app.get('/metrics', { preHandler: [checkUserIdExists] }, async (request) => {
    const { userId } = request.cookies

    const meals = await knex('meals').where({ user_id: userId }).orderBy('date')

    let sequenceCount = 0

    const metrics = meals.reduce(
      (acc, currMeal) => {
        acc.count++

        if (currMeal.is_dietary) {
          acc.totalInDiet++
          sequenceCount++

          if (sequenceCount > acc.bestDietSequence) {
            acc.bestDietSequence = sequenceCount
          }
        } else {
          acc.totalOutsideDiet++
          sequenceCount = 0
        }

        return acc
      },
      {
        count: 0,
        totalInDiet: 0,
        totalOutsideDiet: 0,
        bestDietSequence: 0,
      },
    )

    return { metrics }
  })
}
