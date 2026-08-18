import { getUltimosCheckins, getContadorCheckins } from "@/lib/actions/checkin";
import { CheckinClient } from "@/components/checkin/checkin-client";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const [ultimos, contador] = await Promise.all([getUltimosCheckins(), getContadorCheckins()]);

  return <CheckinClient ultimosIniciais={ultimos} contador={contador} />;
}
