import { listarJogadores } from "@/lib/actions/jogadores";
import { UsuariosClient } from "@/components/usuarios/usuarios-client";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const jogadores = await listarJogadores();
  return <UsuariosClient jogadores={jogadores} />;
}
