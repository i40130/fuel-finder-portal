
import { Fuel, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type FuelStation } from "@/lib/fuelApi";

interface FilterButtonsProps {
  userLocation: [number, number] | undefined;
  loading: boolean;
  filteredStations: FuelStation[];
  findCheapestStation: () => Promise<void>;
  findNearestStation: () => Promise<void>;
  activeFilter: "nearest" | "cheapest" | null;
}

export function FilterButtons({
  userLocation,
  loading,
  filteredStations,
  findCheapestStation,
  findNearestStation,
  activeFilter,
}: FilterButtonsProps) {
  if (!userLocation) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6">
      <Button
        onClick={findCheapestStation}
        className={`flex-1 ${
          activeFilter === "cheapest"
            ? "bg-yellow-600 hover:bg-yellow-700"
            : "bg-yellow-500 hover:bg-yellow-600"
        } text-white`}
        disabled={loading || !filteredStations.length}
      >
        <Fuel className="mr-2 h-4 w-4" />
        Encontrar la más barata
      </Button>
      <Button
        onClick={findNearestStation}
        className={`flex-1 ${
          activeFilter === "nearest"
            ? "bg-purple-600 hover:bg-purple-700"
            : "bg-purple-500 hover:bg-purple-600"
        } text-white`}
        disabled={loading || !filteredStations.length}
      >
        <MapPin className="mr-2 h-4 w-4" />
        Encontrar la más cercana
      </Button>
    </div>
  );
}

