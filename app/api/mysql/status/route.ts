import { createConnection } from 'mysql2/promise'

export async function GET() {
  try {
    const conn = await createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      connectTimeout: 3000,
    })
    await conn.end()
    return Response.json({ connected: true })
  } catch {
    return Response.json({ connected: false })
  }
}
