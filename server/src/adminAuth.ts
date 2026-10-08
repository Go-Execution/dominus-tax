import type { SupabaseClient, User } from '@supabase/supabase-js';

export type CrmRole = 'admin' | 'consultant';

export interface CrmProfile {
  userId: string;
  fullName: string;
  role: CrmRole;
  isActive: boolean;
}

export interface AuthenticatedCrmUser {
  user: User;
  profile: CrmProfile;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, 'Authentication required.');
  return match[1];
}

export async function requireCrmUser(
  request: Request,
  supabase: SupabaseClient,
  allowedRoles: CrmRole[] = ['admin', 'consultant'],
): Promise<AuthenticatedCrmUser> {
  const token = bearerToken(request);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session.');

  const { data: profile, error: profileError } = await supabase
    .from('crm_profiles')
    .select('user_id, full_name, role, is_active')
    .eq('user_id', data.user.id)
    .eq('is_active', true)
    .maybeSingle();
  if (profileError) throw new HttpError(500, 'CRM authorization check failed.');
  if (!profile) throw new HttpError(403, 'This account is not authorized for Dominus CRM.');

  const role = profile.role as CrmRole;
  if (!allowedRoles.includes(role)) throw new HttpError(403, 'Insufficient CRM permissions.');

  return {
    user: data.user,
    profile: {
      userId: profile.user_id as string,
      fullName: profile.full_name as string,
      role,
      isActive: profile.is_active as boolean,
    },
  };
}

export async function requireAdmin(request: Request, supabase: SupabaseClient): Promise<User> {
  return (await requireCrmUser(request, supabase, ['admin'])).user;
}
