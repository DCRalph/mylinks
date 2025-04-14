import { type Profile, type ProfileLink } from "@prisma/client";
import {
  IconPencil,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { api } from "~/trpc/react";
import { toast } from "react-toastify";
import toastOptions from "~/utils/toastOptions";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { AdminUserProfileLinkCard } from "~/components/Admin/adminUserProfileLinkCard";
import { AdminProfileEditLinkModal } from "~/components/Admin/AdminProfileEditLinkModal";
import { AdminProfileCreateLinkModal } from "~/components/Admin/AdminProfileCreateLinkModal";

interface AdminUserProfileCardProps {
  profile: Profile & {
    profileLinks: ProfileLink[];
  };
  userId: string;
}

export function AdminUserProfileCard({
  profile,
  userId,
}: AdminUserProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditLinkModelOpen, setIsEditLinkModelOpen] = useState(false);
  const [isCreateLinkModelOpen, setIsCreateLinkModelOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ProfileLink | null>(null);

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [slug, setSlug] = useState(profile.slug);
  const [altName, setAltName] = useState(profile.altName ?? "");

  const utils = api.useUtils();

  const updateProfileMutation = api.admin.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated successfully", toastOptions);
      setIsEditing(false);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const deleteProfileMutation = api.admin.deleteProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile deleted successfully", toastOptions);
      setIsDeleteDialogOpen(false);
      await utils.admin.getUser.invalidate();
    },
    onError: (error) => {
      toast.error(error.message, toastOptions);
    },
  });

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({
      id: profile.id,
      name,
      bio,
      slug,
      altName,
    });
  };

  const handleDeleteProfile = () => {
    deleteProfileMutation.mutate({
      id: profile.id,
    });
  };

  const handleEditLink = (link: ProfileLink) => {
    setSelectedLink(link);
    setIsEditLinkModelOpen(true);
  };

  const handleCreateLink = () => {
    setIsCreateLinkModelOpen(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl font-bold"
              />
            ) : (
              profile.name
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
            >
              <IconPencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Enter your bio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Enter your slug"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altName">Alternative Name</Label>
                <Input
                  id="altName"
                  value={altName}
                  onChange={(e) => setAltName(e.target.value)}
                  placeholder="Enter alternative name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Bio</Label>
                <p className="text-sm text-muted-foreground">
                  {profile.bio ?? "No bio provided"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <p className="text-sm text-muted-foreground">{profile.slug}</p>
              </div>
              {profile.altName && (
                <div className="space-y-2">
                  <Label>Alternative Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {profile.altName}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Links</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {profile.profileLinks.length} link
                {profile.profileLinks.length !== 1 ? "s" : ""}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleCreateLink}
              >
                <IconPlus className="h-4 w-4" />
                Add Link
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {profile.profileLinks.map((link) => (
              <AdminUserProfileLinkCard
                key={link.id}
                link={link}
                onEdit={() => handleEditLink(link)}
              />
            ))}
            {profile.profileLinks.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No links found
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedLink && (
        <AdminProfileEditLinkModal
          profileLink={selectedLink}
          isOpen={isEditLinkModelOpen}
          setIsOpen={setIsEditLinkModelOpen}
        />
      )}

      <AdminProfileCreateLinkModal
        profile={profile}
        isOpen={isCreateLinkModelOpen}
        setIsOpen={setIsCreateLinkModelOpen}
      />
    </Card>
  );
}
