import { type Link as LinkType } from "@prisma/client";
import {
  IconExternalLink,
  IconChartBar,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { env } from "~/env";
import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function AdminUserLinkCard({ link }: { link: LinkType }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);
  const [slug, setSlug] = useState(link.slug || "");
  const utils = api.useUtils();

  const updateLinkMutation = api.admin.updateLink.useMutation({
    onSuccess: async () => {
      toast.success("Link updated successfully", toastOptions);
      setIsEditing(false);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const deleteLinkMutation = api.admin.deleteLink.useMutation({
    onSuccess: async () => {
      toast.success("Link deleted successfully", toastOptions);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const handleUpdateLink = (e: React.FormEvent) => {
    e.preventDefault();
    updateLinkMutation.mutate({
      linkID: link.id,
      name,
      url,
      slug: slug || undefined,
    });
  };

  const handleDeleteLink = () => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      deleteLinkMutation.mutate({ linkID: link.id });
    }
  };

  return (
    <div className="flex flex-col rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-white shadow-lg transition-all hover:border-zinc-500 hover:shadow-xl">
      {isEditing ? (
        <form onSubmit={handleUpdateLink} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1"
              placeholder="Leave empty for auto-generated slug"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="form_btn_blue">
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="mb-3">
            <h3 className="mb-1 text-lg font-bold">{link.name}</h3>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <IconChartBar className="h-3 w-3" />
              <span>Link ID: {link.id.slice(0, 8)}...</span>
            </div>
          </div>

          <div className="mb-4">
            <Link
              className="mb-1 flex items-center gap-1 break-all text-sm font-medium text-blue-400 underline"
              href={`${env.NEXT_PUBLIC_DOMAIN}/${link.slug}`}
              target="_blank"
            >
              {env.NEXT_PUBLIC_SHORT_DOMAIN}/{link.slug}
              <IconExternalLink className="h-3 w-3" />
            </Link>
            <p className="break-all text-xs text-zinc-400">{link.url}</p>
          </div>

          <div className="mt-auto flex justify-between">
            <div className="text-xs text-zinc-500">
              Created: {new Date(link.createdAt).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setIsEditing(true)}
              >
                <IconPencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-red-500 hover:text-red-600"
                onClick={handleDeleteLink}
              >
                <IconTrash className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
