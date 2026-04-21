"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useUpdateProfile } from "@/lib/hooks/use-profile";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { useConfirm } from "@/components/confirm-dialog";

export default function AccountPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { confirm, ConfirmDialog } = useConfirm();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialized, setInitialized] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  if (profile && !initialized) {
    setName(profile.name || "");
    setEmail(profile.email || "");
    setInitialized(true);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile.mutateAsync({ name, email });
      toast.success("Profile updated");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    confirm({
      title: "Change password?",
      description: "Are you sure you want to change your password?",
      confirmLabel: "Change password",
      onConfirm: async () => {
        setSavingPassword(true);
        try {
          await updateProfile.mutateAsync({ currentPassword, newPassword });
          setCurrentPassword("");
          setNewPassword("");
          toast.success("Password changed");
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setSavingPassword(false);
        }
      },
    });
  }

  if (isLoading || !profile) return null;

  return (
    <div>
      <PageHeader title="Account" />
      {ConfirmDialog}
      <div className="p-6 max-w-3xl mx-auto">

        {/* Profile */}
        <div className="rounded-md border mb-6">
          <div className="px-4 py-3 border-b">
            <span className="text-xs text-muted-foreground">Profile</span>
          </div>
          <div className="p-4">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingProfile}
                  style={{ backgroundColor: "#d4a574", color: "#000", borderColor: "#d4a574" }}
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-md border mb-6">
          <div className="px-4 py-3 border-b">
            <span className="text-xs text-muted-foreground">Change password</span>
          </div>
          <div className="p-4">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingPassword}
                  style={{ backgroundColor: "#d4a574", color: "#000", borderColor: "#d4a574" }}
                >
                  {savingPassword ? "Changing..." : "Change password"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Info */}
        <div className="rounded-md border mb-6">
          <div className="px-4 py-3 border-b">
            <span className="text-xs text-muted-foreground">Account info</span>
          </div>
          <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: "var(--border)" }}>
            <div className="p-4" style={{ backgroundColor: "var(--background)" }}>
              <p className="text-[10px] text-muted-foreground mb-1">User ID</p>
              <p className="text-xs font-mono break-all">{profile.id}</p>
            </div>
            <div className="p-4" style={{ backgroundColor: "var(--background)" }}>
              <p className="text-[10px] text-muted-foreground mb-1">Email</p>
              <p className="text-xs">{profile.email}</p>
            </div>
            <div className="p-4 col-span-2" style={{ backgroundColor: "var(--background)" }}>
              <p className="text-[10px] text-muted-foreground mb-1">Created</p>
              <p className="text-xs">{new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
