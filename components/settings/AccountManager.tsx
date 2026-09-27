"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  User,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  UserCheck,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getActiveUser,
  getAllAccounts,
  updateUserProfile,
  switchActiveAccount,
  signUpUser,
  deleteAccount,
  type UserAccount,
} from "@/lib/auth-client";
import { getLocalBalance, setLocalBalance } from "@/lib/local-store";
import { FREELANCER_TYPES, FREELANCER_TYPE_LABELS, type FreelancerType } from "@/types";
import { cn } from "@/lib/utils";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
];

export function AccountManager() {
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => getActiveUser());
  const [accounts, setAccounts] = useState<UserAccount[]>(() => getAllAccounts());
  const [balance, setBalance] = useState(() => getLocalBalance());
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [agencyName, setAgencyName] = useState(currentUser.agencyName || "");
  const [freelancerType, setFreelancerType] = useState<FreelancerType>(
    (currentUser.freelancerType as FreelancerType) || "web_designer"
  );
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser.portfolioUrl || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatarUrl || AVATAR_PRESETS[0]);

  // New Account state
  const [newAccName, setNewAccName] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccAgency, setNewAccAgency] = useState("");

  useEffect(() => {
    function handleSync() {
      const active = getActiveUser();
      setCurrentUser(active);
      setAccounts(getAllAccounts());
      setBalance(getLocalBalance());
      setFullName(active.fullName);
      setEmail(active.email);
      setAgencyName(active.agencyName || "");
      setFreelancerType((active.freelancerType as FreelancerType) || "web_designer");
      setPhone(active.phone || "");
      setPortfolioUrl(active.portfolioUrl || "");
      setBio(active.bio || "");
      setSelectedAvatar(active.avatarUrl || AVATAR_PRESETS[0]);
    }

    window.addEventListener("freelancefind_user_updated", handleSync);
    window.addEventListener("freelancefind_accounts_updated", handleSync);
    window.addEventListener("freelancefind_store_updated", handleSync);

    return () => {
      window.removeEventListener("freelancefind_user_updated", handleSync);
      window.removeEventListener("freelancefind_accounts_updated", handleSync);
      window.removeEventListener("freelancefind_store_updated", handleSync);
    };
  }, []);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = updateUserProfile({
        fullName,
        email,
        agencyName,
        freelancerType,
        phone,
        portfolioUrl,
        bio,
        avatarUrl: selectedAvatar,
      });
      setCurrentUser(updated);
      setAccounts(getAllAccounts());
      toast.success("Account profile saved successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  function handleSwitchAccount(userId: string) {
    const switched = switchActiveAccount(userId);
    if (switched) {
      toast.success(`Switched account to ${switched.fullName} (${switched.email})`);
    }
  }

  async function handleCreateNewAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccName.trim() || !newAccEmail.trim()) {
      toast.error("Please provide both name and email for the new profile");
      return;
    }

    const res = await signUpUser(newAccEmail, newAccName, newAccAgency);
    if (res.success && res.user) {
      toast.success(`Created and switched to new account "${res.user.fullName}"!`);
      setIsAddingNew(false);
      setNewAccName("");
      setNewAccEmail("");
      setNewAccAgency("");
      setAccounts(getAllAccounts());
    } else {
      toast.error(res.error || "Failed to create account");
    }
  }

  function handleDeleteAccount(userId: string, name: string) {
    if (accounts.length <= 1) {
      toast.error("You must have at least one active account");
      return;
    }

    if (confirm(`Are you sure you want to delete account profile for "${name}"?`)) {
      const ok = deleteAccount(userId);
      if (ok) {
        toast.success(`Account for "${name}" was deleted.`);
        setAccounts(getAllAccounts());
      }
    }
  }

  function handleRefillStarterCredits() {
    setLocalBalance({
      totalCredits: 100,
      usedCredits: 0,
      availableCredits: 100,
    });
    setBalance({
      totalCredits: 100,
      usedCredits: 0,
      availableCredits: 100,
    });
    toast.success("Reset balance: 100 credits loaded into wallet!");
  }

  return (
    <div className="space-y-6">
      {/* Account Profiles Switcher Grid */}
      <Card className="p-5 border-neutral-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Connected Profiles & Team Accounts
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Switch seamlessly between individual freelancer, agency, or team client prospector profiles.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="text-xs gap-1.5 h-8 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Another Profile
          </Button>
        </div>

        {isAddingNew && (
          <form
            onSubmit={handleCreateNewAccount}
            className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3 animate-in fade-in-50"
          >
            <h3 className="text-xs font-bold text-neutral-800">Add New Account Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-neutral-600">Full Name</Label>
                <Input
                  required
                  placeholder="e.g. Jordan Lee"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-neutral-600">Email Address</Label>
                <Input
                  required
                  type="email"
                  placeholder="jordan@agency.com"
                  value={newAccEmail}
                  onChange={(e) => setNewAccEmail(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-neutral-600">Agency / Brand</Label>
                <Input
                  placeholder="Lee Creative Labs"
                  value={newAccAgency}
                  onChange={(e) => setNewAccAgency(e.target.value)}
                  className="h-8 text-xs bg-white mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingNew(false)} className="h-7 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs font-semibold">
                Create & Switch
              </Button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acc) => {
            const isActive = acc.id === currentUser.id;
            return (
              <div
                key={acc.id}
                className={cn(
                  "p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 bg-white relative",
                  isActive
                    ? "border-primary ring-2 ring-primary/20 shadow-xs"
                    : "border-neutral-200 hover:border-neutral-300"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm overflow-hidden border border-primary/20">
                    {acc.avatarUrl ? (
                      <Image src={acc.avatarUrl} alt={acc.fullName} width={40} height={40} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      acc.fullName.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-neutral-900 truncate">{acc.fullName}</span>
                      {isActive && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-white shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate">{acc.email}</p>
                    <p className="text-[11px] text-neutral-700 font-medium truncate mt-0.5">
                      {acc.agencyName || "Freelancer"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                  <span className="text-[10px] text-neutral-400">
                    {acc.role === "agency" ? "Agency Lead" : "Freelancer"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSwitchAccount(acc.id)}
                        className="h-6 text-[11px] px-2 font-medium"
                      >
                        Switch To
                      </Button>
                    )}
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(acc.id, acc.fullName)}
                        className="text-neutral-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete Profile"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Edit Active Profile Form */}
      <Card className="p-5 border-neutral-200 bg-white space-y-5">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <User className="h-4 w-4 text-neutral-700" />
            Active Profile Information: {currentUser.fullName}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            These details are embedded into customized cold pitches, signatures, and client proposals.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar Selector */}
          <div>
            <Label className="text-xs font-semibold text-neutral-700 block mb-2">Profile Avatar</Label>
            <div className="flex items-center gap-3">
              {AVATAR_PRESETS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={cn(
                    "h-11 w-11 rounded-full overflow-hidden border-2 transition-all p-0.5",
                    selectedAvatar === url ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <Image src={url} alt="Avatar" width={44} height={44} className="h-full w-full object-cover rounded-full" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Full Name</Label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Account Email</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Agency / Brand Display Name</Label>
              <Input
                placeholder="e.g. Acme Creative Agency"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Primary Freelance Niche</Label>
              <select
                value={freelancerType}
                onChange={(e) => setFreelancerType(e.target.value as FreelancerType)}
                className="w-full h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {FREELANCER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {FREELANCER_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Phone / WhatsApp Number</Label>
              <Input
                placeholder="+1 555 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Portfolio or Website URL</Label>
              <Input
                placeholder="https://yourportfolio.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-neutral-700">Short Bio / Pitch Value Proposition</Label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Helping dental and medical clinics increase high-value appointment bookings with modern conversion web design."
              className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <span className="text-[11px] text-neutral-400">
              Last active session: {new Date(currentUser.lastLoginAt || currentUser.createdAt).toLocaleDateString()}
            </span>
            <Button type="submit" size="sm" disabled={isSaving} className="text-xs font-semibold gap-1.5 h-8">
              <Check className="h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Update Account Details"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Credit & Wallet Utilities */}
      <Card className="p-5 border-neutral-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              Wallet & Starter Credits
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Available Credits: <strong>{balance.availableCredits ?? 100}</strong> (Used: {balance.usedCredits ?? 0})
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefillStarterCredits}
            className="text-xs gap-1.5 h-8"
          >
            <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
            Refill 100 Free Starter Credits
          </Button>
        </div>
      </Card>
    </div>
  );
}
