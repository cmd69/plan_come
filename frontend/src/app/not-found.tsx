import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-page text-primary">
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <p className="text-secondary text-center">
        La ruta que buscas no existe.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-accent text-inverted font-medium active:bg-accent-hover"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
