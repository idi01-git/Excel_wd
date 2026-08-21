// src/app/(admin)/admin/role/page.tsx
import { redirect } from 'next/navigation';

export default function AdminRoleRedirect() {
  redirect('/admin/roles');
}
