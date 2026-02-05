
# Admin Dashboard Page

## Overview

Create a dedicated admin dashboard page that is only accessible to users with the `admin` role. The page will provide administrative oversight of the application including user management, system statistics, and data inspection capabilities.

## Architecture

```text
+------------------+       +-------------------+       +------------------+
|   AppSidebar     |       |   AdminRoute      |       |  AdminDashboard  |
| (show admin link |  -->  | (role check via   |  -->  | (stats, users,   |
|  only for admins)|       |  useUserRole)     |       |  system data)    |
+------------------+       +-------------------+       +------------------+
                                    |
                                    v
                           +-------------------+
                           |  has_role() RPC   |
                           | (server-side      |
                           |  verification)    |
                           +-------------------+
```

## Implementation Steps

### 1. Create useUserRole Hook

Create a new hook `src/hooks/useUserRole.ts` that checks the user's role using the database `has_role` function:

- Uses Supabase RPC to call the `has_role` function
- Returns loading state, role status, and helper functions
- Caches result with React Query to avoid repeated calls

```typescript
// Key logic:
const { data: isAdmin } = useQuery({
  queryKey: ['user-role', 'admin', userId],
  queryFn: async () => {
    const { data } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    return data ?? false;
  },
  enabled: !!userId,
});
```

### 2. Create AdminRoute Component

Add an `AdminRoute` wrapper component in `src/App.tsx` that:

- Checks admin role using the new hook
- Shows loading state while checking
- Redirects non-admins to home page with a toast notification
- Only renders children for verified admins

### 3. Create AdminDashboardPage

Create `src/pages/AdminDashboardPage.tsx` with:

**Header Section:**
- Title "Admin Dashboard" with shield icon
- Admin badge indicator

**Statistics Cards:**
- Total users count
- Total characters count
- Total chat sessions count
- Total messages count

**User Management Section:**
- Table of all users with email, display name, role, and created date
- Visual role badges (admin/moderator/user)

**System Overview Section:**
- Quick links to key admin actions
- System health indicators

### 4. Update AppSidebar

Modify `src/components/layout/AppSidebar.tsx` to:

- Import and use the `useUserRole` hook
- Conditionally show the Admin nav item only for admin users
- Add Shield icon for the admin link

### 5. Update App.tsx Routes

Add the new admin route wrapped in `AdminRoute`:

```typescript
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminDashboardPage />
    </AdminRoute>
  }
/>
```

## Technical Details

### Security Model

| Layer | Protection |
|-------|------------|
| Database | `has_role` function is SECURITY DEFINER, bypasses RLS |
| Frontend Route | `AdminRoute` checks role before rendering |
| RPC Call | Uses authenticated user's session |
| Sidebar | Admin link hidden from non-admins |

### Database Queries for Stats

The admin dashboard will query aggregate counts:

```sql
-- User count (via profiles table)
SELECT COUNT(*) FROM profiles

-- Characters count
SELECT COUNT(*) FROM characters

-- Sessions count
SELECT COUNT(*) FROM chat_sessions

-- Messages count
SELECT COUNT(*) FROM chat_messages
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useUserRole.ts` | Create | Hook for checking user roles via RPC |
| `src/pages/AdminDashboardPage.tsx` | Create | Admin dashboard UI with stats and user management |
| `src/components/layout/AppSidebar.tsx` | Modify | Add conditional admin nav item |
| `src/App.tsx` | Modify | Add AdminRoute wrapper and /admin route |

### UI Components Used

- Card, CardHeader, CardContent (statistics)
- Table, TableHeader, TableRow, TableCell (user list)
- Badge (role indicators)
- Shield icon from lucide-react

## RLS Policy Note

Admin users will need a policy to read all user data. A new RLS policy should be added to the `profiles` table:

```sql
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

Similar policies may be needed for other tables if the admin needs to view cross-user data.
