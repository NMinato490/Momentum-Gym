import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

const demoAccounts = [
  {
    email: 'superadmin@momentumgym.com',
    password: 'SuperAdmin123!',
    displayName: 'Super Admin',
    role: 'superadmin',
  },
  {
    email: 'admin@momentumgym.com',
    password: 'Admin123!',
    displayName: 'Admin User',
    role: 'admin',
  },
]

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient()
    const results: any[] = []

    for (const account of demoAccounts) {
      try {
        const { data: existing, error: lookupError } = await adminClient.auth.admin.getUserByEmail(account.email)

        let userId: string

        if (existing?.user) {
          userId = existing.user.id
          await adminClient.auth.admin.updateUserById(userId, {
            password: account.password,
            user_metadata: { display_name: account.displayName, role: account.role },
          })
        } else {
          const { data, error: createError } = await adminClient.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true,
            user_metadata: { display_name: account.displayName, role: account.role },
          })

          if (createError) throw createError
          userId = data.user.id
        }

        results.push({
          success: true,
          email: account.email,
          uid: userId,
          role: account.role,
          status: existing?.user ? 'updated' : 'created',
        })
      } catch (error: any) {
        results.push({
          success: false,
          email: account.email,
          error: error.message,
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Supabase Auth accounts setup complete',
        accounts: results,
        demoAccounts: demoAccounts.map(({ password, ...rest }) => rest),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Supabase Auth Setup Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to setup Supabase Auth accounts',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'POST to this endpoint to setup Supabase Auth accounts',
      method: 'POST',
      examples: {
        curl: 'curl -X POST http://localhost:3000/api/auth/setup-accounts',
      },
    },
    { status: 200 }
  )
}
