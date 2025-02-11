
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getRoute,
  calculateDistance,
  getFuelPrice,
  type FuelStation,
} from "@/lib/fuelApi";

export const useStationFilters = (
  userLocation: [number, number] | undefined,
  filteredStations: FuelStation[],
  setSelectedStation: (station: FuelStation | undefined) => void,
  setRouteCoordinates: (coordinates: number[][]) => void
) => {
  const [activeFilter, setActiveFilter] = useState<"nearest" | "cheapest" | null>(null);
  const { toast } = useToast();

  const findCheapestStation = async (selectedFuel: string) => {
    if (!filteredStations.length || !userLocation) {
      toast({
        title: "Error",
        description: "Primero debes usar tu ubicación para obtener gasolineras cercanas",
        variant: "destructive",
      });
      return;
    }

    // Usar la misma lista de estaciones que ya está filtrada
    const cheapestStation = filteredStations.reduce((cheapest, current) => {
      const cheapestPrice = getFuelPrice(cheapest, selectedFuel);
      const currentPrice = getFuelPrice(current, selectedFuel);
      
      // Si alguno de los precios no está disponible, mantener el que sí lo está
      if (cheapestPrice === "No disponible") return current;
      if (currentPrice === "No disponible") return cheapest;
      
      const cheapestValue = parseFloat(cheapestPrice.replace(',', '.'));
      const currentValue = parseFloat(currentPrice.replace(',', '.'));
      
      return currentValue < cheapestValue ? current : cheapest;
    }, filteredStations[0]);

    // Verificar si el precio está disponible para la estación más barata
    if (getFuelPrice(cheapestStation, selectedFuel) === "No disponible") {
      toast({
        title: "Error",
        description: "No se encontraron estaciones con el combustible seleccionado",
        variant: "destructive",
      });
      return;
    }

    setSelectedStation(cheapestStation);
    setActiveFilter("cheapest");

    const [userLat, userLng] = userLocation;
    const stationLat = parseFloat(cheapestStation.Latitud.replace(',', '.'));
    const stationLng = parseFloat(cheapestStation['Longitud (WGS84)'].replace(',', '.'));

    try {
      const route = await getRoute(
        [userLng, userLat],
        [stationLng, stationLat]
      );
      
      if (route) {
        setRouteCoordinates(route);
        toast({
          title: "Gasolinera más barata encontrada",
          description: `${cheapestStation.Rótulo} - ${getFuelPrice(cheapestStation, selectedFuel)}€/L`,
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "Error",
        description: "No se pudo calcular la ruta hasta la gasolinera más barata",
        variant: "destructive",
      });
    }
  };

  const findNearestStation = async () => {
    if (!filteredStations.length || !userLocation) {
      toast({
        title: "Error",
        description: "Primero debes usar tu ubicación para obtener gasolineras cercanas",
        variant: "destructive",
      });
      return;
    }

    const [userLat, userLng] = userLocation;
    
    const nearestStation = filteredStations.reduce((nearest, current) => {
      const nearestLat = parseFloat(nearest.Latitud.replace(',', '.'));
      const nearestLng = parseFloat(nearest['Longitud (WGS84)'].replace(',', '.'));
      const currentLat = parseFloat(current.Latitud.replace(',', '.'));
      const currentLng = parseFloat(current['Longitud (WGS84)'].replace(',', '.'));
      
      const distNearest = calculateDistance(userLat, userLng, nearestLat, nearestLng);
      const distCurrent = calculateDistance(userLat, userLng, currentLat, currentLng);
      
      return distCurrent < distNearest ? current : nearest;
    }, filteredStations[0]);

    setSelectedStation(nearestStation);
    setActiveFilter("nearest");
    
    const stationLat = parseFloat(nearestStation.Latitud.replace(',', '.'));
    const stationLng = parseFloat(nearestStation['Longitud (WGS84)'].replace(',', '.'));
    const distance = calculateDistance(userLat, userLng, stationLat, stationLng);

    try {
      const route = await getRoute(
        [userLng, userLat],
        [stationLng, stationLat]
      );
      
      if (route) {
        setRouteCoordinates(route);
        toast({
          title: "Gasolinera más cercana encontrada",
          description: `${nearestStation.Rótulo} - a ${distance.toFixed(1)}km`,
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "Error",
        description: "No se pudo calcular la ruta hasta la gasolinera más cercana",
        variant: "destructive",
      });
    }
  };

  return {
    activeFilter,
    findCheapestStation,
    findNearestStation,
  };
};
