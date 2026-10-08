import "server-only";

import type { Prisma } from "~/generated/prisma/client";
import { db } from "~/server/db";

/** Records an admin action. Never throws: a failed log must not undo the action. */
export async function audit(entry: {
  actorId: string | null;
  action: string;
  summary: string;
  target?: { type: string; id: string };
  details?: Prisma.InputJsonValue;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        summary: entry.summary,
        targetType: entry.target?.type,
        targetId: entry.target?.id,
        details: entry.details,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", entry.action, error);
  }
}

/** "Alice Moana (alice@example.com)" for audit summaries. */
export async function describeUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  return user ? `${user.name} (${user.email})` : userId;
}
