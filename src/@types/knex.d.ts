// eslint-disable-next-line no-unused-vars
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      email: string
      password: string
    }
    meals: {
      id: string
      name: string
      description: string
      date: string
      is_dietary: boolean
      user_id: string
    }
  }
}
