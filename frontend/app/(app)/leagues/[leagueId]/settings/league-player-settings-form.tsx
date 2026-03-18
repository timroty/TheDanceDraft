"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

type LeaguePlayer = {
  id: string;
  name: string;
  profile_pic: string | null;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export function LeaguePlayerSettingsForm({
  leaguePlayer,
}: {
  leaguePlayer: LeaguePlayer;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(leaguePlayer.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("File must be a JPEG, PNG, WebP, or GIF image.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError("File must be smaller than 50 MB.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  }

  function validate(): boolean {
    let valid = true;
    if (!name.trim()) {
      setNameError("Display name is required.");
      valid = false;
    } else if (name.trim().length > 100) {
      setNameError("Display name must be 100 characters or fewer.");
      valid = false;
    } else {
      setNameError(null);
    }
    return valid;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      let profilePicUrl: string | undefined;

      if (selectedFile) {
        const storagePath = `league-players/${leaguePlayer.id}/profile`;

        const { error: uploadError } = await supabase.storage
          .from("TheDanceDraft")
          .upload(storagePath, selectedFile, { upsert: true });

        if (uploadError) {
          toast.error("Failed to upload profile picture.");
          return;
        }

        const { data: urlData } = supabase.storage
          .from("TheDanceDraft")
          .getPublicUrl(storagePath);

        profilePicUrl = urlData.publicUrl;
      }

      const updatePayload: { name: string; profile_pic?: string } = {
        name: name.trim(),
      };
      if (profilePicUrl !== undefined) {
        updatePayload.profile_pic = profilePicUrl;
      }

      const { error: updateError } = await supabase
        .from("league_player")
        .update(updatePayload)
        .eq("id", leaguePlayer.id);

      if (updateError) {
        toast.error("Failed to save settings.");
        return;
      }

      toast.success("Settings saved.");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-sm">
      <div className="flex flex-col gap-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          disabled={saving}
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-pic">Profile picture</Label>
        <Input
          id="profile-pic"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          ref={fileInputRef}
          disabled={saving}
        />
        {fileError && (
          <p className="text-sm text-destructive">{fileError}</p>
        )}
      </div>

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
