import 'dotenv/config'

export const config = {
  port: parseInt(process.env.PORT ?? '4009', 10),
  typesense: {
    host: process.env.TYPESENSE_HOST ?? 'localhost',
    port: parseInt(process.env.TYPESENSE_PORT ?? '8108', 10),
    protocol: process.env.TYPESENSE_PROTOCOL ?? 'http',
    apiKey: process.env.TYPESENSE_API_KEY ?? 'xyz'
  }
} as const
