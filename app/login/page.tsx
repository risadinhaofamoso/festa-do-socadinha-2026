import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { destino?: string };
}) {
  // Só aceita caminho interno, para o parâmetro não virar um redirecionamento
  // para fora do site.
  const bruto = searchParams.destino ?? "/";
  const destino = bruto.startsWith("/") && !bruto.startsWith("//") ? bruto : "/";

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoginForm destino={destino} />
    </div>
  );
}
