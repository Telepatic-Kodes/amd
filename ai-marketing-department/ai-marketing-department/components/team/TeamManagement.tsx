"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { RoleBadge } from "./RoleBadge";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/permissions-client";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { translate } from "@/lib/language";

export function TeamManagement() {
  const users = useQuery(api.users.listUsers);
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateUserRole = useMutation(api.users.updateUserRole);
  const [loadingUserId, setLoadingUserId] = useState<Id<"users"> | null>(null);
  const { success, error: showError } = useToast();

  const handleRoleChange = async (userId: Id<"users">, newRole: string) => {
    setLoadingUserId(userId);
    try {
      await updateUserRole({
        userId,
        role: newRole as any,
      });
      success(translate("roleUpdated"));
    } catch (error: any) {
      showError("Error", error.message || translate("roleUpdateError"));
    } finally {
      setLoadingUserId(null);
    }
  };

  // Loading state
  if (!users || !currentUser) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">{translate("team")}</h3>
          <p className="text-sm text-zinc-400">{translate("teamManagement")}</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (non-admin users)
  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">{translate("team")}</h3>
          <p className="text-sm text-zinc-400">{translate("teamManagement")}</p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <p className="text-sm text-zinc-500">
            Solo los administradores pueden gestionar el equipo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-white">{translate("team")}</h3>
        <p className="text-sm text-zinc-400">Gestiona los roles de tu equipo</p>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                  <th className="pb-3 font-medium">Usuario</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((user) => {
                  const isCurrentUser = user._id === currentUser._id;
                  const isSystemOwner = user.isSystemOwner;
                  const isDisabled = isSystemOwner || isCurrentUser || loadingUserId === user._id;

                  // Get initials for avatar
                  const initials = user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : user.email
                        .split("@")[0]
                        .slice(0, 2)
                        .toUpperCase();

                  return (
                    <tr key={user._id} className="group">
                      {/* Avatar + Name */}
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {user.imageUrl ? (
                            <img
                              src={user.imageUrl}
                              alt={user.name || user.email}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 font-medium text-sm">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">
                              {user.name || "Usuario"}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-zinc-500">(Tú)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3">
                        <p className="text-sm text-zinc-400">{user.email}</p>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3">
                        <RoleBadge role={user.role} size="sm" />
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-3">
                        <div className="relative inline-block">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={isDisabled}
                            className="appearance-none rounded-lg border border-zinc-800 bg-zinc-950/50 py-1.5 pl-3 pr-8 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {/* Show current role even if it's "owner" */}
                            {user.role === "owner" && (
                              <option value="owner">{ROLE_LABELS.owner}</option>
                            )}
                            {ASSIGNABLE_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                        </div>
                        {isSystemOwner && (
                          <p className="text-xs text-zinc-500 mt-1">Propietario del sistema</p>
                        )}
                        {isCurrentUser && !isSystemOwner && (
                          <p className="text-xs text-zinc-500 mt-1">No puedes cambiar tu propio rol</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: Stacked Cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => {
              const isCurrentUser = user._id === currentUser._id;
              const isSystemOwner = user.isSystemOwner;
              const isDisabled = isSystemOwner || isCurrentUser || loadingUserId === user._id;

              const initials = user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : user.email
                    .split("@")[0]
                    .slice(0, 2)
                    .toUpperCase();

              return (
                <div
                  key={user._id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.name || user.email}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 font-medium">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name || "Usuario"}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-zinc-500">(Tú)</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    <RoleBadge role={user.role} size="md" />
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Cambiar rol</label>
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={isDisabled}
                        className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950/50 py-2 pl-3 pr-8 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {user.role === "owner" && (
                          <option value="owner">{ROLE_LABELS.owner}</option>
                        )}
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    </div>
                    {isSystemOwner && (
                      <p className="text-xs text-zinc-500 mt-1">Propietario del sistema</p>
                    )}
                    {isCurrentUser && !isSystemOwner && (
                      <p className="text-xs text-zinc-500 mt-1">No puedes cambiar tu propio rol</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
