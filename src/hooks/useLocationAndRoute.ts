
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getRoute,
  calculateDistance,
  type FuelStation,
} from "@/lib/fuelApi";

export const useLocationAndRoute = (
  setFilteredStations: (stations: FuelStation[]) => void,
  stations: FuelStation[]
) => {
  const [userLocation, setUserLocation] = useState<[number, number]>();
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>();
  const [selectedStation, setSelectedStation] = useState<FuelStation>();
  const { toast } = useToast();

  const handleGetUserLocation = (
    selectedBrand: string,
    setLoading: (loading: boolean) => void
  ) => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation([userLat, userLng]);
          
          // Filtrar estaciones por distancia
          const nearbyStations = stations.filter(station => {
            const stationLat = parseFloat(station.Latitud.replace(',', '.'));
            const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
            const distance = calculateDistance(userLat, userLng, stationLat, stationLng);
            return distance <= 10;
          });

          // Filtrar por marca si es necesario
          const filteredByBrand = selectedBrand === "todas" 
            ? nearbyStations 
            : nearbyStations.filter(station => 
                station.Rótulo.toLowerCase().trim().includes(selectedBrand.toLowerCase().trim())
              );

          setFilteredStations(filteredByBrand);
          setRouteCoordinates([[userLng, userLat]]);
          setSelectedStation(undefined);
          
          toast({
            title: "Ubicación encontrada",
            description: `Se encontraron ${filteredByBrand.length} gasolineras en un radio de 10km`,
          });
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Error",
            description: "No se pudo obtener tu ubicación. Por favor, verifica los permisos de ubicación.",
            variant: "destructive",
          });
          setLoading(false);
        }
      );
    } else {
      toast({
        title: "Error",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleStationClick = async (station: FuelStation) => {
    setSelectedStation(station);
    
    if (userLocation) {
      const stationLat = parseFloat(station.Latitud.replace(',', '.'));
      const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
      
      try {
        const route = await getRoute(
          [userLocation[1], userLocation[0]],
          [stationLng, stationLat]
        );
        
        if (route) {
          setRouteCoordinates(route);
          toast({
            title: "Ruta calculada",
            description: `Se ha calculado la ruta hasta ${station.Rótulo}`,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo calcular la ruta hasta la gasolinera",
          variant: "destructive",
        });
        console.error('Error calculating route:', error);
      }
    } else {
      toast({
        title: "Ubicación necesaria",
        description: "Activa tu ubicación para calcular la ruta hasta la gasolinera",
        variant: "destructive",
      });
    }
  };

  return {
    userLocation,
    setUserLocation,
    routeCoordinates,
    setRouteCoordinates,
    selectedStation,
    setSelectedStation,
    handleGetUserLocation,
    handleStationClick,
  };
};

