export async function logLoginEvent(params: {
  userId?: string
  email: string
  action: 'login_success' | 'login_failed' | 'logout'
  metadata?: Record<string, unknown>
}) {
  try {
    await fetch('/api/admin/logs/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId || null,
        email: params.email,
        action: params.action,
        ip_address: '',
        user_agent: navigator.userAgent,
        metadata: params.metadata || {},
      }),
    });
  } catch {
    // silently ignore
  }
}

export async function updateAdminStatus(params: {
  userId: string
  isActive: boolean
}) {
  try {
    await fetch('/api/admin/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: params.userId,
        is_active: params.isActive,
      }),
    });
  } catch {
    // silently ignore
  }
}

export async function heartbeatAdminStatus(userId: string) {
  try {
    await fetch('/api/admin/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
  } catch {
    // silently ignore
  }
}

export async function getConfig(key: string, userId?: string): Promise<any> {
  try {
    const params = new URLSearchParams({ key });
    if (userId) params.set('user_id', userId);
    const res = await fetch(`/api/admin/config?${params}`);
    const data = await res.json();
    return data.success && data.data?.length > 0 ? data.data[0].value : null;
  } catch {
    return null;
  }
}

export async function setConfig(key: string, value: any, userId?: string) {
  try {
    await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, user_id: userId || null }),
    });
  } catch {
    // silently ignore
  }
}
