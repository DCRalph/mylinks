"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import ConfirmDelete from "~/components/ConfirmDelete";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Field, Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
  iconSrc,
  isProfileLinkIcon,
  profileLinkIcons,
  type ProfileLinkIcon,
} from "~/utils/profileLinkIcons";
import { ProfileButton, type ViewLink } from "./ProfileView";

const PRESETS = [
  { name: "Ink", bg: "#f4f4ee", fg: "#0b0b0a" },
  { name: "Night", bg: "#1d1d1b", fg: "#f4f4ee" },
  { name: "Lime", bg: "#c8f560", fg: "#0b0b0a" },
  { name: "Blue", bg: "#0a66c2", fg: "#ffffff" },
  { name: "Red", bg: "#ff0033", fg: "#ffffff" },
  { name: "Pink", bg: "#e1306c", fg: "#ffffff" },
  { name: "Violet", bg: "#5865f2", fg: "#ffffff" },
  { name: "Orange", bg: "#ff7a1a", fg: "#0b0b0a" },
] as const;

/**
 * Create (no `link`) or edit a profile button. Render with a `key` so the form
 * starts fresh for each link.
 */
export default function ProfileLinkDialog({
  profileId,
  link,
  onClose,
}: {
  profileId: string;
  link?: ViewLink;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(link?.title ?? "");
  const [url, setUrl] = useState(link?.url ?? "");
  const [description, setDescription] = useState(link?.description ?? "");
  const [iconUrl, setIconUrl] = useState<ProfileLinkIcon | "">(
    link?.iconUrl && isProfileLinkIcon(link.iconUrl) ? link.iconUrl : "",
  );
  const [bgColor, setBgColor] = useState(link?.bgColor ?? "#f4f4ee");
  const [fgColor, setFgColor] = useState(link?.fgColor ?? "#0b0b0a");

  const utils = api.useUtils();
  const done = async (message: string) => {
    toast.success(message);
    onClose();
    await Promise.all([
      utils.profile.getProfile.invalidate({ id: profileId }),
      utils.profile.getProfiles.invalidate(),
    ]);
  };

  const create = api.profile.createProfileLink.useMutation({
    onSuccess: () => done("Button added"),
  });
  const edit = api.profile.editProfileLink.useMutation({
    onSuccess: () => done("Button saved"),
  });
  const remove = api.profile.deleteProfileLink.useMutation({
    onSuccess: () => done("Button deleted"),
    onError: (error) => toast.error(error.message),
  });
  const error = (link ? edit : create).error;
  const pending = create.isPending || edit.isPending;

  const values = {
    title: title.trim(),
    url: url.trim(),
    description: description.trim(),
    iconUrl,
    bgColor,
    fgColor,
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{link ? "Edit button" : "Add a button"}</DialogTitle>
        </DialogHeader>

        <div className="pointer-events-none rounded-xl bg-bg p-4">
          <ProfileButton
            link={{
              id: "preview",
              title: title || "Button title",
              url: "#",
              description: description || null,
              iconUrl: iconUrl || null,
              bgColor,
              fgColor,
            }}
          />
        </div>

        <form
          id="profile-link-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (link) edit.mutate({ id: link.id, ...values });
            else create.mutate({ profileId, ...values });
          }}
        >
          <Field label="Title" htmlFor="pl-title">
            <Input
              id="pl-title"
              required
              placeholder="GitHub"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="URL" htmlFor="pl-url">
            <Input
              id="pl-url"
              required
              placeholder="https://github.com/you"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <Field label="Description" htmlFor="pl-description">
            <Input
              id="pl-description"
              placeholder="Optional, one short line"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid gap-1.5">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              <IconChoice
                selected={iconUrl === ""}
                onSelect={() => setIconUrl("")}
                label="No icon"
              >
                <span className="display text-sm text-muted">None</span>
              </IconChoice>
              {profileLinkIcons.map((icon) => (
                <IconChoice
                  key={icon.file}
                  selected={iconUrl === icon.file}
                  onSelect={() => setIconUrl(icon.file)}
                  label={icon.name}
                >
                  <Image
                    src={iconSrc(icon.file)}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 object-contain"
                  />
                </IconChoice>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Colours</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  aria-label={`${preset.name} colours`}
                  onClick={() => {
                    setBgColor(preset.bg);
                    setFgColor(preset.fg);
                  }}
                  className={cn(
                    "display grid size-10 cursor-pointer place-items-center rounded-xl text-lg ring-1 ring-white/10 ring-inset",
                    bgColor === preset.bg &&
                      fgColor === preset.fg &&
                      "outline-2 outline-offset-2 outline-lime",
                  )}
                  style={{ background: preset.bg, color: preset.fg }}
                >
                  A
                </button>
              ))}
              <ColorInput label="Button" value={bgColor} onChange={setBgColor} />
              <ColorInput label="Text" value={fgColor} onChange={setFgColor} />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error.message}</p>}
        </form>

        <DialogFooter className={link ? "sm:justify-between" : undefined}>
          {link && (
            <ConfirmDelete
              title="Delete this button?"
              description={`“${link.title}” will disappear from the profile.`}
              onConfirm={() => remove.mutate({ id: link.id })}
              pending={remove.isPending}
            />
          )}
          <Button type="submit" form="profile-link-form" disabled={pending}>
            {pending ? "Saving…" : link ? "Save" : "Add button"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IconChoice({
  selected,
  onSelect,
  label,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "grid size-11 cursor-pointer place-items-center rounded-xl border-[1.5px] bg-bg",
        selected ? "border-lime" : "border-line hover:border-faint",
      )}
    >
      {children}
    </button>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-line bg-bg pr-3 pl-1.5 text-sm text-muted hover:border-faint">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
      />
      {label}
    </label>
  );
}
