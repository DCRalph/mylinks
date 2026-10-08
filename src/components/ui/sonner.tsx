"use client";

import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCircleCheck,
  IconHourglass,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** App-wide toasts. Keep them for confirmations; form errors render inline. */
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    position="bottom-right"
    icons={{
      success: <IconCircleCheck className="size-4 text-lime" />,
      info: <IconInfoCircle className="size-4" />,
      warning: <IconAlertTriangle className="size-4" />,
      error: <IconAlertOctagon className="size-4 text-danger" />,
      loading: <IconHourglass className="size-4" />,
    }}
    toastOptions={{
      classNames: {
        toast:
          "!rounded-xl !border-line !bg-panel !text-ink !font-sans !text-[15px]",
      },
    }}
    {...props}
  />
);

export { Toaster };
