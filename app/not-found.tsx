import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
