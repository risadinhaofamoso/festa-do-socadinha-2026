import { redirect } from "next/navigation";
import { listarJogadores } from "@/lib/actions/jogadores";
import { ehAdmin } from "@/lib/sessao";
import { UsuariosClient } from "@/components/usuarios/usuarios-client";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  if (!(await ehAdmin())) redirect("/login?destino=/usuarios");

  const jogadores = await listarJogadores();
  return <UsuariosClient jogadores={jogadores} />;
}
