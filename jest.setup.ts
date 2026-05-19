import { TextDecoder, TextEncoder } from 'util'

global.TextDecoder = TextDecoder as typeof global.TextDecoder
global.TextEncoder = TextEncoder as typeof global.TextEncoder

process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://user:password@example.com:5432/test'
