
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

    // Filtrar primero las estaciones que tienen el combustible disponible
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
      const cheapestPrice = getFuelPrice(cheapest, selectedFuel);
      const currentPrice = getFuelPrice(current, selectedFuel);
      
      const cheapestValue = parseFloat(cheapestPrice.replace(',', '.'));
      const currentValue = parseFloat(currentPrice.replace(',', '.'));
      
      return currentValue < cheapestValue ? current : cheapest;
    }, stationsWithFuel[0]);

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
    
    // Calcular distancias y ordenar
    const stationsWithDistance = filteredStations.map(station => {
      const stationLat = parseFloat(station.Latitud.replace(',', '.'));
      const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
      const distance = calculateDistance(userLat, userLng, stationLat, stationLng);
      return { station, distance };
    }).sort((a, b) => a.distance - b.distance);

    const nearestStation = stationsWithDistance[0].station;
    const distance = stationsWithDistance[0].distance;

    setSelectedStation(nearestStation);
    setActiveFilter("nearest");

    const stationLat = parseFloat(nearestStation.Latitud.replace(',', '.'));
    const stationLng = parseFloat(nearestStation['Longitud (WGS84)'].replace(',', '.'));

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
