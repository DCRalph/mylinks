import { NextResponse } from "next/server";
import { db } from "~/server/db";

// Base64 for a 1x1 PNG
const imageBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUGFdjYAACAAAFAAGq1chRAAAAAElFTkSuQmCC";

// Convert base64 to binary
function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Tracking function
const tracking = async (req: Request, id: string) => {
  const userAgent = req.headers.get("user-agent") ?? "Unknown";
  const referer = req.headers.get("referer") ?? "No referer";
  const ipAddress =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "Unknown";
  const allHeadersString = JSON.stringify(req.headers);

  console.log("Tracking ID:", id);
  console.log("User-Agent:", userAgent);
  console.log("IP Address:", ipAddress);
  console.log("Referer:", referer);

  console.log("Request Headers:", req.headers);

  // check if the ID exists in the database
  const pixel = await db.spyPixel.findUnique({
    where: {
      slug: id,
    },
  });

  // If the ID exists, create a click record
  if (!pixel) {
    console.error("Pixel not found:", id);
    return;
  }

  // Create a click record
  await db.click.create({
    data: {
      spyPixelId: pixel.id,
      userAgent,
      ipAddress,
      referer,
      allHeaders: allHeadersString,
    },
  });

  
};

// Dynamic route handler
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { id } = params; // Extract the dynamic [id] from the URL

  // Trigger the tracking function (asynchronously)
  tracking(req, id).catch(console.error);

  // Prepare response with a 1x1 PNG image
  const arrayBuffer = base64ToArrayBuffer(imageBase64);
  const headers = new Headers({
    "Content-Type": "image/png",
    "Content-Length": arrayBuffer.byteLength.toString(),
    "Cache-Control": "no-cache, no-store, must-revalidate",
  });

  // Send the PNG image as the response
  return new NextResponse(arrayBuffer, { headers });
}
