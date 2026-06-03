import { AdminUsersClient } from "@/components/dashboard/admin-users-client";
import { SaaSUser } from "@/lib/admin/actions";

export default function TestUIPage() {
  const mockUsers: SaaSUser[] = [
    {
      id: "admin-id-123",
      email: "admin@iapi.shop",
      full_name: "Admin User",
      platformRole: "admin",
      tenants: [
        {
          id: "tenant-admin-123",
          name: "Admin Shop",
          slug: "admin-shop",
          planName: "Business",
          productCount: 1,
        },
      ],
      created_at: "2026-06-01T00:00:00Z",
    },
    {
      id: "jaime-id-456",
      email: "jaimedrodriguezf@gmail.com",
      full_name: "Jaime Rodriguez",
      platformRole: "merchant",
      tenants: [
        {
          id: "tenant-iapi-123",
          name: "iapi",
          slug: "iapi",
          planName: "Free",
          productCount: 12,
        },
      ],
      created_at: "2026-06-02T00:00:00Z",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black mb-6 text-violet-600">Test Usuarios SaaS</h1>
      <AdminUsersClient initialUsers={mockUsers} />
    </div>
  );
}
