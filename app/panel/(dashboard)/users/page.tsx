"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { clsx } from "clsx";
import {
  UserPlus,
  ShieldPlus,
  Pencil,
  Trash2,
  KeyRound,
  RefreshCw,
  Users as UsersIcon,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { PERMISSION_GROUPS } from "@/lib/permissions";

type Role = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: "ALL_CENTERS" | "OWN_CENTER";
  permissions: string[];
  isSystem: boolean;
  _count: { users: number };
};

type AdminUserRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  centerId: string | null;
  center: { id: string; name: string } | null;
  role: { id: string; name: string; slug: string; scope: string; isSystem: boolean };
};

type CenterOption = { id: string; name: string };

const EMPTY_USER = {
  name: "",
  username: "",
  email: "",
  password: "",
  roleId: "",
  centerId: "",
  isActive: true,
};

const EMPTY_ROLE = {
  name: "",
  description: "",
  scope: "OWN_CENTER" as "ALL_CENTERS" | "OWN_CENTER",
  permissions: [] as string[],
};

export default function UsersAndRolesPage() {
  const { data: session } = useSession();
  const toast = useToast();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [centers, setCenters] = useState<CenterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [userModal, setUserModal] = useState<{ open: boolean; editing: AdminUserRow | null }>({
    open: false,
    editing: null,
  });
  const [userForm, setUserForm] = useState(EMPTY_USER);
  const [savingUser, setSavingUser] = useState(false);

  const [roleModal, setRoleModal] = useState<{ open: boolean; editing: Role | null }>({
    open: false,
    editing: null,
  });
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE);
  const [savingRole, setSavingRole] = useState(false);

  const [confirm, setConfirm] = useState<
    { kind: "user" | "role"; id: string; label: string } | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, rRes, cRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/roles"),
        fetch("/api/admin/centers"),
      ]);
      if (!uRes.ok) throw new Error((await uRes.json())?.error || "Gagal memuat user.");
      if (!rRes.ok) throw new Error((await rRes.json())?.error || "Gagal memuat role.");

      setUsers(await uRes.json());
      setRoles(await rRes.json());
      // Daftar center hanya untuk dropdown; kegagalannya tidak boleh
      // menggagalkan seluruh halaman.
      setCenters(cRes.ok ? await cRes.json() : []);
    } catch (err) {
      toast.error("Gagal memuat data", err instanceof Error ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === userForm.roleId),
    [roles, userForm.roleId]
  );

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.username, u.email, u.role.name].some((v) => v.toLowerCase().includes(q))
    );
  }, [users, query]);

  // ── User ──────────────────────────────────────────────────────────────────
  const openCreateUser = () => {
    setUserForm({ ...EMPTY_USER, roleId: roles[0]?.id ?? "" });
    setUserModal({ open: true, editing: null });
  };

  const openEditUser = (u: AdminUserRow) => {
    setUserForm({
      name: u.name,
      username: u.username,
      email: u.email,
      password: "",
      roleId: u.role.id,
      centerId: u.centerId ?? "",
      isActive: u.isActive,
    });
    setUserModal({ open: true, editing: u });
  };

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);

    const editing = userModal.editing;
    const payload: Record<string, unknown> = {
      name: userForm.name,
      username: userForm.username,
      email: userForm.email,
      roleId: userForm.roleId,
      centerId: userForm.centerId || null,
      isActive: userForm.isActive,
    };
    // Saat mengubah user, password kosong berarti "jangan diganti".
    if (userForm.password) payload.password = userForm.password;

    try {
      const res = await fetch(
        editing ? `/api/admin/users/${editing.id}` : "/api/admin/users",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan user.");

      toast.success(
        editing ? "User diperbarui" : "User dibuat",
        editing
          ? `Perubahan pada ${userForm.username} tersimpan.`
          : `${userForm.username} sekarang bisa login ke panel.`
      );
      setUserModal({ open: false, editing: null });
      loadAll();
    } catch (err) {
      toast.error("Gagal menyimpan", err instanceof Error ? err.message : undefined);
    } finally {
      setSavingUser(false);
    }
  };

  // ── Role ──────────────────────────────────────────────────────────────────
  const openCreateRole = () => {
    setRoleForm(EMPTY_ROLE);
    setRoleModal({ open: true, editing: null });
  };

  const openEditRole = (r: Role) => {
    setRoleForm({
      name: r.name,
      description: r.description ?? "",
      scope: r.scope,
      permissions: [...r.permissions],
    });
    setRoleModal({ open: true, editing: r });
  };

  const togglePermission = (key: string) =>
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));

  const submitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRole(true);

    const editing = roleModal.editing;
    try {
      const res = await fetch(
        editing ? `/api/admin/roles/${editing.id}` : "/api/admin/roles",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roleForm),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Gagal menyimpan role.");

      toast.success(editing ? "Role diperbarui" : "Role dibuat", `${roleForm.name} tersimpan.`);
      setRoleModal({ open: false, editing: null });
      loadAll();
    } catch (err) {
      toast.error("Gagal menyimpan", err instanceof Error ? err.message : undefined);
    } finally {
      setSavingRole(false);
    }
  };

  // ── Hapus ─────────────────────────────────────────────────────────────────
  const runDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      const url =
        confirm.kind === "user"
          ? `/api/admin/users/${confirm.id}`
          : `/api/admin/roles/${confirm.id}`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Gagal menghapus.");

      toast.success("Berhasil dihapus", `${confirm.label} sudah dihapus.`);
      setConfirm(null);
      loadAll();
    } catch (err) {
      toast.error("Gagal menghapus", err instanceof Error ? err.message : undefined);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Manajemen User ─────────────────────────────────────────────────── */}
      <Card className="overflow-visible">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0b64b4]">
              <UsersIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#111c2d]">Manajemen User</h2>
              <p className="text-xs text-slate-500">
                {users.length} akun terdaftar · {users.filter((u) => u.isActive).length} aktif
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari user..."
                aria-label="Cari user"
                className="field w-full py-2 pl-9 text-xs sm:w-56"
              />
            </div>
            <button
              onClick={loadAll}
              aria-label="Muat ulang data"
              className="rounded-lg border border-slate-300 p-2 text-slate-500 transition hover:bg-slate-50"
            >
              <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
            </button>
            <Button size="sm" onClick={openCreateUser} disabled={roles.length === 0}>
              <UserPlus className="mr-1.5 h-4 w-4" />
              Tambah User
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr>
                <th className="th">Nama</th>
                <th className="th">Username</th>
                <th className="th">Role</th>
                <th className="th">Center</th>
                <th className="th">Status</th>
                <th className="th text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="td" colSpan={6}>
                    <div className="space-y-2">
                      <div className="skeleton h-4 w-1/3" />
                      <div className="skeleton h-4 w-1/2" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-slate-500" colSpan={6}>
                    Tidak ada user yang cocok.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredUsers.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50/70">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#233e95] to-[#0b64b4] text-[11px] font-bold text-white">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[#111c2d]">{u.name}</div>
                          <div className="truncate text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td font-mono text-xs text-slate-600">{u.username}</td>
                    <td className="td">
                      <Badge variant={u.role.scope === "ALL_CENTERS" ? "secondary" : "primary"}>
                        {u.role.name}
                      </Badge>
                    </td>
                    <td className="td text-xs text-slate-500">
                      {u.role.scope === "ALL_CENTERS" ? "Semua center" : (u.center?.name ?? "—")}
                    </td>
                    <td className="td">
                      <Badge variant={u.isActive ? "success" : "neutral"}>
                        {u.isActive ? "AKTIF" : "NONAKTIF"}
                      </Badge>
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditUser(u)}
                          title="Ubah user"
                          aria-label={`Ubah ${u.username}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#0b64b4]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            openEditUser(u);
                            // Fokuskan admin ke penggantian password.
                            setUserForm((f) => ({ ...f, password: "" }));
                          }}
                          title="Reset password"
                          aria-label={`Reset password ${u.username}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            setConfirm({ kind: "user", id: u.id, label: u.username })
                          }
                          disabled={u.id === session?.user?.id}
                          title={
                            u.id === session?.user?.id
                              ? "Tidak dapat menghapus akun sendiri"
                              : "Hapus user"
                          }
                          aria-label={`Hapus ${u.username}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Manajemen Role ─────────────────────────────────────────────────── */}
      <Card className="overflow-visible">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#233e95]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#111c2d]">Manajemen Role &amp; Hak Akses</h2>
              <p className="text-xs text-slate-500">
                Tentukan menu apa saja yang bisa dibuka tiap kelompok pengguna.
              </p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={openCreateRole}>
            <ShieldPlus className="mr-1.5 h-4 w-4" />
            Tambah Role
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr>
                <th className="th">Role</th>
                <th className="th">Lingkup</th>
                <th className="th">Jumlah Permission</th>
                <th className="th">Dipakai</th>
                <th className="th text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50/70">
                  <td className="td">
                    <div className="font-semibold text-[#111c2d]">
                      {r.name}
                      {r.isSystem && (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          sistem
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <div className="mt-0.5 text-xs text-slate-500">{r.description}</div>
                    )}
                  </td>
                  <td className="td text-xs text-slate-600">
                    {r.scope === "ALL_CENTERS" ? "Semua center" : "Center sendiri"}
                  </td>
                  <td className="td">
                    <Badge variant="primary">{r.permissions.length} izin</Badge>
                  </td>
                  <td className="td text-xs text-slate-600">{r._count.users} user</td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditRole(r)}
                        title="Ubah hak akses"
                        aria-label={`Ubah hak akses ${r.name}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-[#0b64b4]"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirm({ kind: "role", id: r.id, label: r.name })}
                        disabled={r.isSystem || r._count.users > 0}
                        title={
                          r.isSystem
                            ? "Role bawaan sistem tidak dapat dihapus"
                            : r._count.users > 0
                              ? "Masih dipakai user lain"
                              : "Hapus role"
                        }
                        aria-label={`Hapus role ${r.name}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Modal user ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={userModal.open}
        onClose={() => setUserModal({ open: false, editing: null })}
        title={userModal.editing ? `Ubah User — ${userModal.editing.username}` : "Tambah User Baru"}
      >
        <form onSubmit={submitUser} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="u-name" className="field-label">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                id="u-name"
                required
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="field"
                placeholder="Richo Ivan Ardiyanto"
              />
            </div>
            <div>
              <label htmlFor="u-username" className="field-label">
                Username <span className="text-rose-500">*</span>
              </label>
              <input
                id="u-username"
                required
                value={userForm.username}
                onChange={(e) =>
                  setUserForm({ ...userForm, username: e.target.value.toLowerCase() })
                }
                className="field font-mono"
                placeholder="richo"
                pattern="[a-z0-9._-]{3,32}"
                title="3–32 karakter: huruf kecil, angka, titik, garis bawah, strip"
              />
            </div>
          </div>

          <div>
            <label htmlFor="u-email" className="field-label">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="u-email"
              type="email"
              required
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="field"
              placeholder="nama@uccenters.id"
            />
          </div>

          <div>
            <label htmlFor="u-password" className="field-label">
              Password {!userModal.editing && <span className="text-rose-500">*</span>}
            </label>
            <input
              id="u-password"
              type="password"
              required={!userModal.editing}
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              className="field"
              placeholder={userModal.editing ? "Kosongkan bila tidak diganti" : "Minimal 8 karakter"}
              autoComplete="new-password"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Minimal 8 karakter, memuat huruf kecil, huruf besar, dan angka.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="u-role" className="field-label">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                id="u-role"
                required
                value={userForm.roleId}
                onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                className="field"
                disabled={userModal.editing?.id === session?.user?.id}
              >
                <option value="">— pilih role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {userModal.editing?.id === session?.user?.id && (
                <p className="mt-1 text-[11px] text-amber-600">
                  Role akun sendiri tidak dapat diubah dari sini.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="u-center" className="field-label">
                Center {selectedRole?.scope === "OWN_CENTER" && <span className="text-rose-500">*</span>}
              </label>
              <select
                id="u-center"
                value={userForm.centerId}
                onChange={(e) => setUserForm({ ...userForm, centerId: e.target.value })}
                className="field"
                disabled={selectedRole?.scope === "ALL_CENTERS"}
                required={selectedRole?.scope === "OWN_CENTER"}
              >
                <option value="">
                  {selectedRole?.scope === "ALL_CENTERS" ? "Semua center" : "— pilih center —"}
                </option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={userForm.isActive}
              onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
              disabled={userModal.editing?.id === session?.user?.id}
              className="h-4 w-4 rounded border-slate-300 text-[#0b64b4] focus:ring-[#0b64b4]"
            />
            <span className="text-sm text-slate-700">
              Akun aktif (boleh login)
            </span>
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserModal({ open: false, editing: null })}
            >
              Batal
            </Button>
            <Button type="submit" disabled={savingUser}>
              {savingUser ? "Menyimpan..." : userModal.editing ? "Simpan Perubahan" : "Buat User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal role ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={roleModal.open}
        onClose={() => setRoleModal({ open: false, editing: null })}
        title={roleModal.editing ? `Hak Akses — ${roleModal.editing.name}` : "Tambah Role Baru"}
      >
        <form onSubmit={submitRole} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="r-name" className="field-label">
                Nama Role <span className="text-rose-500">*</span>
              </label>
              <input
                id="r-name"
                required
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                className="field"
                placeholder="Editor Konten"
                disabled={roleModal.editing?.isSystem}
              />
            </div>
            <div>
              <label htmlFor="r-scope" className="field-label">
                Lingkup Data
              </label>
              <select
                id="r-scope"
                value={roleForm.scope}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, scope: e.target.value as typeof roleForm.scope })
                }
                className="field"
                disabled={roleModal.editing?.isSystem}
              >
                <option value="OWN_CENTER">Hanya center yang ditugaskan</option>
                <option value="ALL_CENTERS">Semua center</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="r-desc" className="field-label">
              Keterangan
            </label>
            <input
              id="r-desc"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              className="field"
              placeholder="Singkat saja, mis. 'Hanya boleh menulis artikel'"
            />
          </div>

          {roleModal.editing?.isSystem && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Ini role bawaan sistem. Nama dan lingkupnya dikunci agar artinya tidak
              berubah diam-diam, tetapi daftar hak aksesnya tetap bisa disesuaikan.
            </p>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="field-label mb-0">
                Hak Akses <span className="text-slate-400">({roleForm.permissions.length} dipilih)</span>
              </span>
            </div>

            <div className="max-h-72 space-y-4 overflow-y-auto rounded-lg border border-slate-200 p-4">
              {PERMISSION_GROUPS.map((group) => (
                <fieldset key={group.group} className="space-y-2">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {group.group}
                  </legend>
                  {group.items.map((item) => (
                    <label
                      key={item.key}
                      className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(item.key)}
                        onChange={() => togglePermission(item.key)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0b64b4] focus:ring-[#0b64b4]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm text-slate-700">{item.label}</span>
                        {item.hint && (
                          <span className="block text-[11px] text-slate-400">{item.hint}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleModal({ open: false, editing: null })}
            >
              Batal
            </Button>
            <Button type="submit" disabled={savingRole}>
              {savingRole ? "Menyimpan..." : "Simpan Role"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirm !== null}
        loading={deleting}
        title={confirm?.kind === "user" ? "Hapus user ini?" : "Hapus role ini?"}
        description={
          <>
            <strong className="text-[#111c2d]">{confirm?.label}</strong> akan dihapus permanen.
            Tindakan ini tidak dapat dibatalkan.
          </>
        }
        onCancel={() => setConfirm(null)}
        onConfirm={runDelete}
      />
    </div>
  );
}
