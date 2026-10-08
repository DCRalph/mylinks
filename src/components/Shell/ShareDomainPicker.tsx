"use client";

import { IconCheck, IconChevronDown } from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { domains } from "~/lib/domains";
import { useShareDomain } from "~/lib/use-share-domain";

/** Header chip that picks the domain copied links use. Hidden with one domain. */
export default function ShareDomainPicker() {
  const [shareDomain, setShareDomain] = useShareDomain();

  if (domains.length < 2) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="display flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-ink/80 px-3.5 pt-0.5 text-base hover:border-ink"
        aria-label="Domain for copied links"
      >
        {shareDomain.host}
        <IconChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel>Copied links use</DropdownMenuLabel>
        {domains.map((domain) => (
          <DropdownMenuItem
            key={domain.host}
            onSelect={() => setShareDomain(domain)}
          >
            {domain.host}
            {domain.host === shareDomain.host && (
              <IconCheck className="ml-auto text-lime" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
