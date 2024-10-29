import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Table, TableRow, TableCell, TableBody, TableHeader } from "~/components/ui/table"; // Import ShadCN table components

import { type Click } from "@prisma/client";

type SpyPixelEventsDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  clicks: Click[]; // Adjust based on your data fetching method
};


const SpyPixelEventsDialog = ({ isOpen, setIsOpen, clicks }: SpyPixelEventsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
      <DialogContent className="!max-w-none sm:w-10/12">
        <DialogHeader>
          <DialogTitle>Spy Pixel Events</DialogTitle>
          <DialogDescription>View detailed events associated with this spy pixel.</DialogDescription>
        </DialogHeader>
        {/* // todo fix the table */}
        <div className="overflow-x-auto mt-4 max-w-full overflow-y-scroll h-96">
          {clicks.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="min-w-56">Created At</TableCell>
                  <TableCell className="min-w-96 grow">User Agent</TableCell>
                  <TableCell className="min-w-40">IP Address</TableCell>
                  <TableCell className="min-w-40">Referer</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* {invoices.map((invoice) => (
                  <TableRow key={invoice.invoice}>
                    <TableCell className="font-medium">{invoice.invoice}</TableCell>
                    <TableCell>{invoice.paymentStatus}</TableCell>
                    <TableCell>{invoice.paymentMethod}</TableCell>
                    <TableCell className="text-right">{invoice.totalAmount}</TableCell>
                  </TableRow>
                ))} */}
                {clicks.map((click) => (
                  <TableRow key={click.id}>
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
          <Button variant="default" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
};

export default SpyPixelEventsDialog;
