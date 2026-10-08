import { safeHeaders, visitorInfo } from "~/server/clicks";
import { db } from "~/server/db";

// 1x1 transparent PNG.
const PIXEL = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUGFdjYAACAAAFAAGq1chRAAAAAElFTkSuQmCC",
  ),
  (char) => char.charCodeAt(0),
);

async function recordLoad(req: Request, slug: string) {
  const pixel = await db.spyPixel.findUnique({ where: { slug } });
  if (!pixel) return;

  await db.click.create({
    data: {
      spyPixelId: pixel.id,
      ...visitorInfo(req.headers),
      allHeaders: JSON.stringify(safeHeaders(req.headers)),
    },
  });
}

/** Spy pixel: always answers with the image, records the load in the background. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  recordLoad(req, id).catch(console.error);

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
