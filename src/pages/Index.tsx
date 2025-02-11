
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/Map";
import {
  fetchFuelStations,
  filterStations,
  getRoute,
  calculateDistance,
  getFuelPrice,
  type FuelStation,
} from "@/lib/fuelApi";
import { SearchForm } from "@/components/SearchForm";
import { FilterButtons } from "@/components/FilterButtons";
import { StationList } from "@/components/StationList";

const Index = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<FuelStation[]>([]);
  const [selectedFuel, setSelectedFuel] = useState("gasolina95");
  const [selectedBrand, setSelectedBrand] = useState<string>("todas");
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>();
  const [selectedStation, setSelectedStation] = useState<FuelStation>();
  const [userLocation, setUserLocation] = useState<[number, number]>();
  const [activeFilter, setActiveFilter] = useState<"nearest" | "cheapest" | null>(null);
  const { toast } = useToast();

  const getAvailableBrands = () => {
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

  const uniqueBrands = getAvailableBrands();

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

  useEffect(() => {
    setSelectedBrand("todas");
  }, [filteredStations]);

  useEffect(() => {
    setRouteCoordinates(undefined);
    setSelectedStation(undefined);
  }, [selectedFuel]);

  useEffect(() => {
    if (selectedBrand === "todas") return;
    
    setFilteredStations(prev => 
      stations.filter(station => {
        if (routeCoordinates) {
          const stationLat = parseFloat(station.Latitud.replace(',', '.'));
          const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
          
          return routeCoordinates.some(point => {
            const distance = calculateDistance(
              stationLat,
              stationLng,
              point[1],
              point[0]
            );
            return distance <= 5;
          });
        }
        else if (userLocation) {
          const [userLat, userLng] = userLocation;
          const stationLat = parseFloat(station.Latitud.replace(',', '.'));
          const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
          const distance = calculateDistance(userLat, userLng, stationLat, stationLng);
          return distance <= 10 && station.Rótulo === selectedBrand;
        }
        return false;
      })
    );
  }, [selectedBrand, stations, routeCoordinates, userLocation]);

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

  const handleGetUserLocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setUserLocation([userLat, userLng]);
          
          const nearbyStations = stations.filter(station => {
            const stationLat = parseFloat(station.Latitud.replace(',', '.'));
            const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
            const distance = calculateDistance(userLat, userLng, stationLat, stationLng);
            return distance <= 10;
          }).sort((a, b) => {
            const aLat = parseFloat(a.Latitud.replace(',', '.'));
            const aLng = parseFloat(a['Longitud (WGS84)'].replace(',', '.'));
            const bLat = parseFloat(b.Latitud.replace(',', '.'));
            const bLng = parseFloat(b['Longitud (WGS84)'].replace(',', '.'));
            
            const distA = calculateDistance(userLat, userLng, aLat, aLng);
            const distB = calculateDistance(userLat, userLng, bLat, bLng);
            return distA - distB;
          });

          const filteredNearbyStations = selectedBrand === "todas" 
            ? nearbyStations 
            : nearbyStations.filter(station => station.Rótulo === selectedBrand);

          setFilteredStations(filteredNearbyStations);
          setRouteCoordinates([[userLng, userLat]]);
          setSelectedStation(undefined); // Solo reseteamos la selección cuando cambiamos de ubicación
          
          toast({
            title: "Ubicación encontrada",
            description: `Se encontraron ${filteredNearbyStations.length} gasolineras en un radio de 10km`,
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

  const findCheapestStation = async () => {
    if (!filteredStations.length || !userLocation) {
      toast({
        title: "Error",
        description: "Primero debes usar tu ubicación para obtener gasolineras cercanas",
        variant: "destructive",
      });
      return;
    }

    const cheapestStation = filteredStations.reduce((cheapest, current) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-semibold tracking-tight">
            Buscador de Gasolineras en Ruta
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Encuentra las gasolineras más cercanas a tu ruta y compara precios
          </p>
        </div>

        <Card className="p-6 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <SearchForm
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            selectedFuel={selectedFuel}
            setSelectedFuel={setSelectedFuel}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            loading={loading}
            setLoading={setLoading}
            stations={stations}
            setFilteredStations={setFilteredStations}
            setRouteCoordinates={setRouteCoordinates}
            uniqueBrands={uniqueBrands}
            handleGetUserLocation={handleGetUserLocation}
            userLocation={userLocation}
            routeCoordinates={routeCoordinates}
          />
          <FilterButtons
            userLocation={userLocation}
            loading={loading}
            filteredStations={filteredStations}
            findCheapestStation={findCheapestStation}
            findNearestStation={findNearestStation}
            activeFilter={activeFilter}
          />
        </Card>

        <Map 
          stations={filteredStations} 
          routeCoordinates={routeCoordinates} 
          selectedStation={selectedStation}
          userLocation={userLocation}
        />

        <StationList
          filteredStations={filteredStations}
          selectedFuel={selectedFuel}
          selectedStation={selectedStation}
          onStationClick={handleStationClick}
        />
      </div>
    </div>
  );
};

export default Index;

