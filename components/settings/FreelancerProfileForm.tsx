"use client";

import { useState, useEffect } from "react";
import { User, Briefcase, Link as LinkIcon, Calendar, Check, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  FreelancerProfileSettings,
  DEFAULT_FREELANCER_PROFILE,
  getStoredFreelancerProfile,
  saveStoredFreelancerProfile,
} from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function FreelancerProfileForm() {
  const [profile, setProfile] = useState<FreelancerProfileSettings>(DEFAULT_FREELANCER_PROFILE);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setProfile(getStoredFreelancerProfile());
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveStoredFreelancerProfile(profile);
    setIsSaved(true);
    toast.success("Outreach profile updated! All templates now use your new signature & links.");
    setTimeout(() => setIsSaved(false), 2500);
  }

  return (
    <Card className="border border-neutral-200/90 shadow-sm bg-white p-6 max-w-3xl">
      <div className="border-b border-neutral-100 pb-4 mb-5">
        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Freelancer Profile & Signature Variables
        </h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          These details automatically populate tags like <code className="text-primary font-mono font-semibold">&#123;&#123;freelancer_name&#125;&#125;</code> and <code className="text-primary font-mono font-semibold">&#123;&#123;portfolio_url&#125;&#125;</code> in your outreach email templates.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-neutral-400" />
              Your Full Name / Alias
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="e.g. Alex Vance"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-neutral-400" />
              Professional Title / Specialty
            </label>
            <input
              type="text"
              value={profile.title}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              placeholder="e.g. Growth Web Designer & Conversion Specialist"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-neutral-400" />
              Portfolio URL / Case Studies
            </label>
            <input
              type="url"
              value={profile.portfolioUrl}
              onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
              placeholder="https://portfolio.me"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              Direct Booking / Cal.com Link
            </label>
            <input
              type="url"
              value={profile.calendarLink}
              onChange={(e) => setProfile({ ...profile, calendarLink: e.target.value })}
              placeholder="https://cal.com/alex/15min"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-neutral-400" />
              Contact Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="alex@growthfreelance.co"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-neutral-400" />
              Phone / WhatsApp
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+1 (555) 019-2834"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-neutral-100">
          <Button type="submit" size="sm" className="gap-1.5 font-semibold">
            {isSaved ? (
              <>
                <Check className="h-4 w-4 text-emerald-200" />
                Saved Profile!
              </>
            ) : (
              "Save Profile Settings"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
