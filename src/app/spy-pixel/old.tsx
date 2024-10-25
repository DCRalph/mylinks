// "use client";

// import { useState } from "react";
// import Nav from "~/components/Nav";
// import Head from "next/head";
// import { api } from "~/trpc/react";
// import { env } from "~/env";
// import { type SpyPixel } from "@prisma/client";
// import Footer from "~/components/footer";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "~/components/ui/dialog";
// import { Button } from "~/components/ui/button";
// import { Input } from "~/components/ui/input";
// import { Label } from "~/components/ui/label";
// import Copy from "~/components/copy";
// import {
//   AlertDialog,
//   AlertDialogTrigger,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogDescription,
//   AlertDialogFooter
// } from "~/components/ui/alert-dialog"; // Import ShadCN Alert Dialog components
// import { toast } from "react-toastify";
// import toastOptions from "~/utils/toastOptions";
// import { IconSquareRoundedPlus } from "@tabler/icons-react";

// export default function SpyPixelPage() {
//   const myUser = api.user.getUser.useQuery();
//   const mySpyPixels = api.spypixel.getAll.useQuery();
//   const createSpyPixel = api.spypixel.createSpyPixel.useMutation();
//   const deleteSpyPixel = api.spypixel.deleteSpyPixel.useMutation();

//   const [selectedSpyPixel, setSelectedSpyPixel] = useState<SpyPixel | null>(null);
//   const [isDialogOpen, setDialogOpen] = useState(false);
//   const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
//   const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

//   const [newPixelName, setNewPixelName] = useState("");
//   const [newPixelSlug, setNewPixelSlug] = useState("");

//   const openDialog = (spyPixel: SpyPixel) => {
//     setSelectedSpyPixel(spyPixel);
//     setDialogOpen(true);
//   };

//   const closeDialog = () => {
//     setSelectedSpyPixel(null);
//     setDialogOpen(false);
//   };

//   const handleCreateSpyPixel = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     createSpyPixel.mutate({
//       name: newPixelName,
//       slug: newPixelSlug,
//     }, {
//       onSuccess: () => {
//         setCreateDialogOpen(false);
//         setNewPixelName("");
//         setNewPixelSlug("");
//         mySpyPixels.refetch().then().catch((error: string) => {
//           console.error(error);
//         });
//       },
//       onError: (error) => {
//         toast.error(error.message, toastOptions);
//       }
//     });
//   };

//   const handleDeleteSpyPixel = async () => {
//     if (!selectedSpyPixel) return;

//     deleteSpyPixel.mutate({ id: selectedSpyPixel.id },
//       {
//         onSuccess: () => {
//           closeDialog();
//           setDeleteAlertOpen(false);
//           mySpyPixels.refetch().then().catch((error: string) => {
//             console.error(error);
//           });
//         },
//         onError: (error) => {
//           toast.error(error.message, toastOptions);
//         }
//       });
//   };

//   return (
//     <>
//       <Head>
//         <title>link2it | Admin</title>
//         <meta name="description" content="Link sharing website" />
//         <link rel="icon" href="/favicon.ico" />
//       </Head>
//       <main className="flex min-h-screen flex-col bg-zinc-950">
//         <Nav user={myUser.data} />

//         <div className="mt-16 grid h-4 grid-cols-12">
//           <div className="col-span-full flex justify-center">
//             <h1 className="text-5xl font-bold text-white">Spy Pixels</h1>
//           </div>
//         </div>

//         <div className="container mx-auto p-8">
//           <div className="flex justify-end mb-4">
//             <Button onClick={() => setCreateDialogOpen(true)} className="form_btn_blue">
//               <IconSquareRoundedPlus />
//               Create Spy Pixel</Button>
//           </div>
//           {mySpyPixels.data?.length ?? 0 > 0 ? (
//             <div className="grid gap-4">
//               {mySpyPixels.data?.map((spyPixel) => (
//                 <div key={spyPixel.id} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center">
//                   <span className="text-white font-medium">{spyPixel.name}</span>
//                   <div className="flex gap-4 items-center">
//                     <span className="break-all text-sm font-semibold md:text-lg select-all">
//                       {${env.NEXT_PUBLIC_DOMAIN}/img/${spyPixel.slug}}
//                     </span>
//                     <Copy text={${env.NEXT_PUBLIC_DOMAIN} /img/${spyPixel.slug}} />
//                   </div>
//                   <Button variant="secondary" onClick={() => openDialog(spyPixel)}>Manage</Button>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <p className="text-gray-400 text-center text-2xl">No spy pixels found.</p>
//           )}
//         </div>

//         {/* Dialog for managing spy pixel */}
//         <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>{selectedSpyPixel?.name}</DialogTitle>
//               <DialogDescription>Manage settings and actions for this spy pixel.</DialogDescription>
//             </DialogHeader>
//             <div className="mt-4">
//               <p><strong>Slug:</strong> {selectedSpyPixel?.slug}</p>
//               <div className="flex gap-2">
//                 <p><strong>URL:</strong> {${env.NEXT_PUBLIC_DOMAIN}/img/${selectedSpyPixel?.slug}}</p>
//                 <Copy text={${env.NEXT_PUBLIC_DOMAIN} /img/${selectedSpyPixel?.slug}} />
//               </div>
//               <p><strong>Created At:</strong> {new Date(selectedSpyPixel?.createdAt ?? '').toLocaleDateString()}</p>
//             </div>
//             <DialogFooter>
//               {/* Trigger for alert dialog */}
//               <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
//                 <AlertDialogTrigger asChild>
//                   <Button variant="destructive">Delete</Button>
//                 </AlertDialogTrigger>
//                 <AlertDialogContent>
//                   <AlertDialogHeader>
//                     <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
//                     <AlertDialogDescription>Are you sure you want to delete this spy pixel? This action cannot be undone.</AlertDialogDescription>
//                   </AlertDialogHeader>
//                   <AlertDialogFooter>
//                     <Button variant="default" onClick={() => setDeleteAlertOpen(false)}>Cancel</Button>
//                     <Button variant="destructive" onClick={handleDeleteSpyPixel}>
//                       Confirm Delete
//                     </Button>
//                   </AlertDialogFooter>
//                 </AlertDialogContent>
//               </AlertDialog>
//               <Button variant="default" onClick={closeDialog}>Close</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Dialog for creating a new spy pixel */}
//         <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Create Spy Pixel</DialogTitle>
//               <DialogDescription>Enter details for the new spy pixel.</DialogDescription>
//             </DialogHeader>
//             <form onSubmit={handleCreateSpyPixel} className="space-y-4">
//               <div className="grid gap-4 py-4">
//                 <div className="grid grid-cols-4 items-center gap-4">
//                   <Label htmlFor="name" className="text-right">Name</Label>
//                   <Input id="name" value={newPixelName} onChange={(e) => setNewPixelName(e.target.value)} className="col-span-3" />
//                 </div>

//                 <div className="grid grid-cols-4 items-center gap-4">
//                   <Label htmlFor="slug" className="text-right">Slug <span className="text-gray-400">(optional)</span></Label>
//                   <Input id="slug" value={newPixelSlug} onChange={(e) => setNewPixelSlug(e.target.value)} className="col-span-3" />
//                 </div>
//               </div>

//               <DialogFooter>
//                 <Button type="submit" variant="default">Create</Button>
//                 <Button type="button" variant="destructive" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
//               </DialogFooter>
//             </form>
//           </DialogContent>
//         </Dialog>

//         <Footer />
//       </main>
//     </>
//   );
// }
