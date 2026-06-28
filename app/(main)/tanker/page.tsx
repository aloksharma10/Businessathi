import { Tanker } from "@/components/tanker/Tanker";
import { getTankerDrivers } from "@/action/tanker";

export default async function TankerPage() {
  const drivers = await getTankerDrivers();

  return <Tanker initialDrivers={drivers} />;
}
