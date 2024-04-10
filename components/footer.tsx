import Link from "next/link";

export default function Footer() {
  return (
    <div className="absolute bottom-0 w-full bg-zinc-900 py-4 text-center text-white">
      <p>
        Made by{" "}
        <Link
          href="https://williamgiles.co.nz"
          target="_blank"
          className="font-semibold underline"
        >
          William
        </Link>{" "}
        in New Zealand
      </p>
    </div>
  );
}
