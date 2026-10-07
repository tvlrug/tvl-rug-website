import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL =
  'https://lkmslxzqfhkyzununlow.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_nVKIKH6qMxq23CCZG15RBg_5_iNtxzf';


export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);


/*
 * Return the currently authenticated Supabase user.
 */
export async function getCurrentUser() {

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {

    console.error(
      'Unable to get current user:',
      error
    );

    return null;

  }

  return user;
}


/*
 * Require authentication.
 *
 * If the visitor is not signed in,
 * redirect them to the login page.
 */
export async function requireAuth() {

  const user =
    await getCurrentUser();

  if (!user) {

    window.location.replace(
      '/login.html'
    );

    return null;

  }

  return user;
}


/*
 * Return all roles assigned to
 * the currently authenticated user.
 */
export async function getUserRoles() {

  const user =
    await getCurrentUser();

  if (!user) {
    return [];
  }

  const {
    data,
    error
  } = await supabase
    .from('member_user_roles')
    .select(`
      role_id,
      member_roles (
        role_code,
        role_name
      )
    `)
    .eq('user_id', user.id);

  if (error) {

    console.error(
      'Unable to load user roles:',
      error
    );

    return [];

  }

  return data || [];
}


/*
 * Return all resources that the
 * currently authenticated user
 * is permitted to access.
 */
export async function getAccessibleResources() {

  const roles =
    await getUserRoles();

  const roleIds =
    roles
      .map(item => item.role_id)
      .filter(Boolean);

  if (!roleIds.length) {
    return [];
  }

  const {
    data,
    error
  } = await supabase
    .from('member_resource_access')
    .select(`
      resource_id,
      member_resources (
        resource_code,
        resource_name,
        description,
        resource_url,
        is_active
      )
    `)
    .in('role_id', roleIds);

  if (error) {

    console.error(
      'Unable to load accessible resources:',
      error
    );

    return [];

  }

  const resources =
    data
      ?.map(
        item =>
          item.member_resources
      )
      .filter(
        resource =>
          resource &&
          resource.is_active
      ) || [];

  /*
   * A member may have several roles.
   * Remove duplicate resources.
   */
  return Array.from(
    new Map(
      resources.map(
        resource => [
          resource.resource_code,
          resource
        ]
      )
    ).values()
  );
}


/*
 * Check whether the current member
 * can access one particular resource.
 */
export async function hasResourceAccess(
  resourceCode
) {

  const resources =
    await getAccessibleResources();

  return resources.some(
    resource =>
      resource.resource_code ===
      resourceCode
  );
}


/*
 * Protect an individual resource page.
 *
 * A user must:
 * 1. be authenticated
 * 2. have database permission
 *    for that resource
 */
export async function requireResourceAccess(
  resourceCode
) {

  const user =
    await requireAuth();

  if (!user) {
    return false;
  }

  const allowed =
    await hasResourceAccess(
      resourceCode
    );

  if (!allowed) {

    window.location.replace(
      '/members.html'
    );

    return false;

  }

  return true;
}


/*
 * Sign the member out and return
 * them to the login page.
 */
export async function logout() {

  const { error } =
    await supabase.auth.signOut();

  if (error) {

    console.error(
      'Unable to sign out:',
      error
    );

    return;

  }

  window.location.replace(
    '/login.html'
  );
}
