import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Table, TableHead, TableRow, TableCell, TableBody } from "~/components/ui/table"; // Import ShadCN table components

import { type Click } from "@prisma/client";

type SpyPixelEventsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  clicks: Click[]; // Adjust based on your data fetching method
};

const SpyPixelEventsDialog = ({ isOpen, onClose, clicks }: SpyPixelEventsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-none w-10/12">
        <DialogHeader>
          <DialogTitle>Spy Pixel Events</DialogTitle>
          <DialogDescription>View detailed click events associated with this spy pixel.</DialogDescription>
        </DialogHeader>
      {/* // todo fix the table */}
        <div className="overflow-x-auto mt-4 max-w-full">
          {clicks.length ? (
            <Table className="w-full">
              <TableHead className="w-full">
                <TableRow className="w-full">
                  {/* <TableCell>ID</TableCell> */}
                  <TableCell>Created At</TableCell>
                  <TableCell>User Agent</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Referer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clicks.map((click) => (
                  <TableRow key={click.id}>
                    {/* <TableCell>{click.id}</TableCell> */}
                    <TableCell>{new Date(click.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{click.userAgent}</TableCell>
                    <TableCell>{click.ipAddress}</TableCell>
                    <TableCell>{click.referer}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center">No events found for this spy pixel.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
};

export default SpyPixelEventsDialog;
