import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL!
const [credentials, hostAndDb] = connectionString.split('@')
const [user, password] = credentials.split(':')
const [hostAndPort, database] = hostAndDb.split('/')
const [host, port] = hostAndPort.split(':')

export default {
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port: parseInt(port),
    user,
    password,
    database,
    ssl: true
  },
  verbose: true,
  strict: true,
} satisfies Config
