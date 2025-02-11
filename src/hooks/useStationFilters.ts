
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

    // Filtrar estaciones que tienen el precio del combustible seleccionado
    const stationsWithFuel = filteredStations.filter(station => {
      const price = getFuelPrice(station, selectedFuel);
      return price !== "No disponible";
    });

    if (stationsWithFuel.length === 0) {
      toast({
        title: "Error",
        description: "No se encontraron estaciones con el combustible seleccionado",
        variant: "destructive",
      });
      return;
    }

    const cheapestStation = stationsWithFuel.reduce((cheapest, current) => {
      const cheapestPrice = parseFloat(getFuelPrice(cheapest, selectedFuel).replace(',', '.'));
      const currentPrice = parseFloat(getFuelPrice(current, selectedFuel).replace(',', '.'));
      return currentPrice < cheapestPrice ? current : cheapest;
    });

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
    });

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
