import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listAdminUsers,
  updateAdminUser,
  type AdminUserRecord,
} from "@/lib/smartgov-api";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "User Management — Admin" }] }),
  component: UsersPage,
});

type UserScope = "all" | "citizen" | "officer" | "admin";
type VerificationScope = "all" | "verified" | "pending";

const roleOptions = [
  "citizen",
  "officer",
  "admin",
  "department_officer",
  "district_officer",
  "state_admin",
  "super_admin",
] as const;

function UsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    citizens: 0,
    officers: 0,
    admins: 0,
    verified: 0,
    pending: 0,
  });
  const [scope, setScope] = useState<UserScope>("all");
  const [verification, setVerification] = useState<VerificationScope>("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});

  const loadUsers = () => {
    setLoading(true);
    setMessage(null);

    listAdminUsers({ scope, verification, search })
      .then((result) => {
        setUsers(result.users);
        setCounts(result.counts);
        setRoleDrafts(
          result.users.reduce<Record<string, string>>((acc, user) => {
            acc[user.id] = user.role;
            return acc;
          }, {}),
        );
      })
      .catch((error: Error) => {
        setUsers([]);
        setMessage(error.message || "Failed to load users");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, verification]);

  const handleApplyFilters = () => {
    loadUsers();
  };

  const handleVerify = async (user: AdminUserRecord) => {
    setUpdatingUserId(user.id);
    setMessage(null);

    try {
      await updateAdminUser(user.id, { isVerified: true, emailVerified: true });
      setMessage(`Updated verification for ${user.fullName}`);
      loadUsers();
    } catch (error) {
      setMessage((error as Error).message || "Failed to update verification");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRoleUpdate = async (user: AdminUserRecord) => {
    const role = roleDrafts[user.id];

    if (!role || role === user.role) {
      return;
    }

    setUpdatingUserId(user.id);
    setMessage(null);

    try {
      await updateAdminUser(user.id, { role: role as (typeof roleOptions)[number] });
      setMessage(`Updated role for ${user.fullName}`);
      loadUsers();
    } catch (error) {
      setMessage((error as Error).message || "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage citizens, officers, and admin accounts in one place.
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-elegant">
          <UserPlus className="mr-1.5 h-4 w-4" /> Invite officer
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-xl font-semibold">{counts.total}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Citizens</div>
          <div className="text-xl font-semibold">{counts.citizens}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Officers</div>
          <div className="text-xl font-semibold">{counts.officers}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Admins</div>
          <div className="text-xl font-semibold">{counts.admins}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Verified</div>
          <div className="text-xl font-semibold">{counts.verified}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs text-muted-foreground">Pending</div>
          <div className="text-xl font-semibold">{counts.pending}</div>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-card md:grid-cols-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, mobile, state..."
        />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={scope}
          onChange={(event) => setScope(event.target.value as UserScope)}
        >
          <option value="all">All users</option>
          <option value="citizen">Citizens</option>
          <option value="officer">Officers</option>
          <option value="admin">Admins</option>
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={verification}
          onChange={(event) => setVerification(event.target.value as VerificationScope)}
        >
          <option value="all">All verification states</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
        </select>
        <Button onClick={handleApplyFilters}>Apply filters</Button>
      </div>

      {message ? (
        <div className="rounded-md border border-border bg-secondary/40 px-4 py-2 text-sm">
          {message}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">User directory</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Location</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Loading users...
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-medium">
                    <div>{user.fullName}</div>
                    <div className="text-xs text-muted-foreground">{user.username ? `@${user.username}` : "No username"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{user.role}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{user.email}</div>
                    <div>{user.mobile}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{user.state}</div>
                    <div>{user.district}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        {user.emailVerified ? "Email verified" : "Email pending"}
                      </span>
                      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium">
                        <UserCheck className="h-3 w-3" />
                        {user.isVerified ? "Account verified" : "Account pending"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-56 flex-col gap-2">
                      <div className="flex gap-2">
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={roleDrafts[user.id] ?? user.role}
                          onChange={(event) =>
                            setRoleDrafts((prev) => ({ ...prev, [user.id]: event.target.value }))
                          }
                          disabled={updatingUserId === user.id}
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingUserId === user.id || (roleDrafts[user.id] ?? user.role) === user.role}
                          onClick={() => {
                            void handleRoleUpdate(user);
                          }}
                        >
                          Save role
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        disabled={updatingUserId === user.id || (user.isVerified && user.emailVerified)}
                        onClick={() => {
                          void handleVerify(user);
                        }}
                      >
                        Verify account
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
