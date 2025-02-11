
import { Fuel } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getFuelPrice, type FuelStation } from "@/lib/fuelApi";
import { useEffect, useState } from "react";

interface StationListProps {
  filteredStations: FuelStation[];
  selectedFuel: string;
  selectedStation: FuelStation | undefined;
  onStationClick: (station: FuelStation) => void;
}

export function StationList({
  filteredStations,
  selectedFuel,
  selectedStation,
  onStationClick,
}: StationListProps) {
  // Mantener un estado local para la selección que persista
  const [localSelectedStation, setLocalSelectedStation] = useState<FuelStation | undefined>(selectedStation);

  // Actualizar el estado local cuando cambia la selección externa
  useEffect(() => {
    setLocalSelectedStation(selectedStation);
  }, [selectedStation]);

  const handleStationClick = (station: FuelStation) => {
    setLocalSelectedStation(station);
    onStationClick(station);
  };

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredStations.map((station) => {
        const isSelected = localSelectedStation?.IDEESS === station.IDEESS;
        
        return (
          <Card
            key={station.IDEESS}
            className={`p-6 transition-all duration-300 cursor-pointer ${
              isSelected
                ? 'ring-2 ring-green-500 shadow-xl bg-green-50 scale-105' 
                : 'hover:shadow-lg hover:scale-102'
            }`}
            onClick={() => handleStationClick(station)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className={`font-semibold text-lg ${
                  isSelected ? 'text-green-700' : ''
                }`}>
                  {station.Rótulo}
                </h3>
              </div>
              <Fuel className={`h-6 w-6 ${
                isSelected ? 'text-green-500' : 'text-teal-500'
              }`} />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">
                  {selectedFuel === "gasolina95"
                    ? "Gasolina 95"
                    : selectedFuel === "gasolina98"
                    ? "Gasolina 98"
                    : selectedFuel === "diesel"
                    ? "Diésel"
                    : "Diésel Plus"}
                  :
                </span>{" "}
                {getFuelPrice(station, selectedFuel)} €/L
              </p>
              <p className="text-sm text-gray-600 truncate">
                {station.Dirección}, {station.Municipio}
              </p>
              <p className="text-sm text-gray-600">
                Horario: {station.Horario}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
