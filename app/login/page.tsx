import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center overflow-y-auto bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo-geos.png"
            alt="GEOS Laboratories"
            width={180}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>

        <h1 className="text-center text-2xl font-semibold text-zinc-900">
          Dashboard tijdelijk gepauzeerd
        </h1>
        <p className="mt-2 text-center text-base text-zinc-600">
          Dit dashboard is momenteel tijdelijk niet beschikbaar. Probeer het later
          opnieuw of neem contact op als je vragen hebt.
        </p>
      </div>
    </div>
  );
}
