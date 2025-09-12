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

if (process.env.NODE_ENV === 'production') {
  if (!process.env.TYPESENSE_API_KEY || process.env.TYPESENSE_API_KEY === 'xyz') {
    // eslint-disable-next-line no-console
    console.error('TYPESENSE_API_KEY must be set in production');
    process.exit(1);
  }
  if (config.typesense.protocol !== 'https') {
    // eslint-disable-next-line no-console
    console.error('Typesense protocol must be https in production');
    process.exit(1);
  }
}
