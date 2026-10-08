"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconArrowLeft,
  IconExternalLink,
  IconGripVertical,
  IconPencil,
  IconPlus,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import ConfirmDelete from "~/components/ConfirmDelete";
import CopyButton from "~/components/CopyButton";
import Empty from "~/components/Empty";
import { Button } from "~/components/ui/button";
import { Input, PrefixInput } from "~/components/ui/input";
import { Field } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { shareUrl } from "~/lib/domains";
import { hostOf } from "~/lib/format";
import { useShareDomain } from "~/lib/use-share-domain";
import { cn } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";
import parseProfileLinkOrder from "~/utils/parseProfileLinkOrder";
import { iconSrc } from "~/utils/profileLinkIcons";
import ProfileAnalytics from "./ProfileAnalytics";
import ProfileLinkDialog from "./ProfileLinkDialog";
import ProfileView, { type ViewLink } from "./ProfileView";

type Profile = RouterOutputs["profile"]["getProfile"];
type EditorLink = Profile["profileLinks"][number];

/** /profiles/[id]: everything about one link-in-bio page, with a live preview. */
export default function ProfileEditor({ id }: { id: string }) {
  const profile = api.profile.getProfile.useQuery({ id });

  if (profile.error) {
    return (
      <Empty title="Profile not found" className="mt-10">
        <Link href="/profiles" className="text-lime hover:underline">
          Back to your profiles
        </Link>
      </Empty>
    );
  }

  if (!profile.data) {
    return <p className="py-20 text-center text-muted">Loading profile…</p>;
  }

  // Remount when switching profiles so the forms start from fresh data.
  return <Editor key={profile.data.id} profile={profile.data} />;
}

function Editor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [shareDomain] = useShareDomain();
  const publicUrl = shareUrl(shareDomain, `p/${profile.slug}`);

  // Details form. The preview reads these as you type.
  const [name, setName] = useState(profile.name);
  const [altName, setAltName] = useState(profile.altName ?? "");
  const [slug, setSlug] = useState(profile.slug);
  const [bio, setBio] = useState(profile.bio ?? "");

  // Dragged order shows immediately; the saved order takes over once refetched.
  const [draggedOrder, setDraggedOrder] = useState<string[] | null>(null);
  const savedOrder = parseProfileLinkOrder({
    linkOrderS: profile.linkOrder,
    profileLinks: profile.profileLinks,
  });
  const order = draggedOrder ?? savedOrder;
  const byId = new Map(profile.profileLinks.map((link) => [link.id, link]));
  const links = order.flatMap((linkId) => byId.get(linkId) ?? []);

  const [dialog, setDialog] = useState<
    { mode: "add" } | { mode: "edit"; link: ViewLink } | null
  >(null);

  const refresh = () =>
    Promise.all([
      utils.profile.getProfile.invalidate({ id: profile.id }),
      utils.profile.getProfiles.invalidate(),
    ]);

  const saveDetails = api.profile.editProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile saved");
      await refresh();
    },
  });

  const reorder = api.profile.changeOrder.useMutation({
    onSettled: async () => {
      await refresh();
      setDraggedOrder(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const toggle = api.profile.toggleProfileLinkVisibility.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
  });

  const remove = api.profile.deleteProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile deleted");
      await utils.profile.getProfiles.invalidate();
      router.push("/profiles");
    },
    onError: (error) => toast.error(error.message),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const next = arrayMove(
      order,
      order.indexOf(String(active.id)),
      order.indexOf(String(over.id)),
    );
    setDraggedOrder(next);
    reorder.mutate({ profileId: profile.id, order: next });
  };

  return (
    <>
      <Link
        href="/profiles"
        className="display inline-flex items-center gap-1.5 text-lg text-muted hover:text-ink"
      >
        <IconArrowLeft className="size-5" /> Profiles
      </Link>

      <header className="mt-3 mb-8 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="display text-[64px] leading-[1.15] break-words sm:text-[88px]">
            {profile.name}
          </h1>
          <div className="mt-2 flex items-center gap-1 text-lime">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate hover:underline"
            >
              {shareDomain.host}/p/{profile.slug}
            </a>
            <CopyButton value={publicUrl} className="text-muted" />
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" asChild>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <IconExternalLink /> View
            </a>
          </Button>
          <ConfirmDelete
            title="Delete this profile?"
            description={`${shareDomain.host}/p/${profile.slug} and its buttons will be gone for good.`}
            onConfirm={() => remove.mutate({ id: profile.id })}
            pending={remove.isPending}
          />
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <section className="rounded-2xl bg-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display text-[28px]">
                Buttons{" "}
                <span className="text-faint">{profile.profileLinks.length}</span>
              </h2>
              <Button size="sm" onClick={() => setDialog({ mode: "add" })}>
                <IconPlus /> Add
              </Button>
            </div>

            {links.length === 0 ? (
              <p className="rounded-xl border-[1.5px] border-dashed border-line py-8 text-center text-muted">
                No buttons yet. Add your first link.
              </p>
            ) : (
              <DndContext
                id="profile-buttons"
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={order}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="grid gap-2">
                    {links.map((link) => (
                      <SortableRow
                        key={link.id}
                        link={link}
                        onEdit={() => setDialog({ mode: "edit", link })}
                        onToggle={() => toggle.mutate({ id: link.id })}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </section>

          <section className="rounded-2xl bg-panel p-5">
            <h2 className="display mb-4 text-[28px]">Details</h2>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveDetails.mutate({
                  id: profile.id,
                  name,
                  altName: altName.trim() || null,
                  slug: slug.trim(),
                  bio: bio.trim() || null,
                });
              }}
            >
              <Field label="Name" htmlFor="p-name">
                <Input
                  id="p-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field
                label="Internal label"
                htmlFor="p-alt"
                hint="Only you see this."
              >
                <Input
                  id="p-alt"
                  placeholder="Optional"
                  value={altName}
                  onChange={(e) => setAltName(e.target.value)}
                />
              </Field>
              <Field label="Address" htmlFor="p-slug" className="sm:col-span-2">
                <PrefixInput
                  id="p-slug"
                  required
                  prefix={`${shareDomain.host}/p/`}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </Field>
              <Field label="Bio" htmlFor="p-bio" className="sm:col-span-2">
                <Textarea
                  id="p-bio"
                  rows={3}
                  placeholder="A line or two about you"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </Field>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={saveDetails.isPending}>
                  {saveDetails.isPending ? "Saving…" : "Save details"}
                </Button>
                {saveDetails.error && (
                  <p className="text-sm text-danger">
                    {saveDetails.error.message}
                  </p>
                )}
              </div>
            </form>
          </section>

          <ProfileAnalytics profileId={profile.id} />
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="mx-auto h-[680px] w-full max-w-[360px] overflow-y-auto rounded-[32px] border-[1.5px] border-line bg-bg">
            <ProfileView
              compact
              name={name}
              bio={bio.trim() || null}
              links={links.filter((link) => link.visible)}
            />
          </div>
        </aside>
      </div>

      {dialog && (
        <ProfileLinkDialog
          key={dialog.mode === "edit" ? dialog.link.id : "new"}
          profileId={profile.id}
          link={dialog.mode === "edit" ? dialog.link : undefined}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

function SortableRow({
  link,
  onEdit,
  onToggle,
}: {
  link: EditorLink;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-xl bg-bg p-2 pr-3",
        isDragging && "relative z-10 ring-[1.5px] ring-lime",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${link.title}`}
        className="cursor-grab touch-none p-1 text-faint hover:text-ink active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical className="size-5" />
      </button>
      <span
        className="grid size-10 shrink-0 place-items-center rounded-lg ring-1 ring-white/10 ring-inset"
        style={{ background: link.bgColor ?? "var(--color-raised)" }}
      >
        {link.iconUrl && (
          <Image
            src={iconSrc(link.iconUrl)}
            alt=""
            width={24}
            height={24}
            className="size-6 object-contain"
          />
        )}
      </span>
      <div className={cn("min-w-0 flex-1", !link.visible && "opacity-45")}>
        <p className="truncate font-semibold">{link.title}</p>
        <p className="truncate text-[13px] text-muted">{hostOf(link.url)}</p>
      </div>
      <Switch
        checked={link.visible}
        onCheckedChange={onToggle}
        aria-label={link.visible ? "Hide button" : "Show button"}
        title={link.visible ? "Visible" : "Hidden"}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${link.title}`}
        className="border-transparent"
        onClick={onEdit}
      >
        <IconPencil />
      </Button>
    </li>
  );
}
