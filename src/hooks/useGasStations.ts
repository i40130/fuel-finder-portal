
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchFuelStations,
  calculateDistance,
  getFuelPrice,
  type FuelStation,
} from "@/lib/fuelApi";

export const useGasStations = () => {
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadStations = async () => {
      setLoading(true);
      try {
        const data = await fetchFuelStations();
        setStations(data);
        toast({
          title: "Datos actualizados",
          description: `Se han cargado ${data.length} estaciones de servicio`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de las estaciones",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [toast]);

  const getAvailableBrands = (
    routeCoordinates?: number[][],
    userLocation?: [number, number]
  ) => {
    const availableStations = stations.filter(station => {
      const stationLat = parseFloat(station.Latitud.replace(',', '.'));
      const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
      
      if (routeCoordinates) {
        return routeCoordinates.some(point => {
          const distance = calculateDistance(
            stationLat,
            stationLng,
            point[1],
            point[0]
          );
          return distance <= 5;
        });
      } else if (userLocation) {
        const [userLat, userLng] = userLocation;
        const distance = calculateDistance(userLat, userLng, stationLat, stationLng);
        return distance <= 10;
      }
      return false;
    });

    return Array.from(new Set(availableStations.map(station => station.Rótulo)))
      .sort((a, b) => a.localeCompare(b));
  };

  return {
    stations,
    setStations,
    filteredStations,
    setFilteredStations,
    loading,
    setLoading,
    getAvailableBrands,
  };
};
