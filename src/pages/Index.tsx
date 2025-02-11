
import { useState, useEffect } from "react";
import { Search, MapPin, Fuel, Filter, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/Map";
import {
  fetchFuelStations,
  filterStations,
  getFuelPrice,
  geocodeCity,
  getRoute,
  calculateDistance,
  type FuelStation,
} from "@/lib/fuelApi";

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
  const { toast } = useToast();

  // Get unique brands from filtered stations only
  const uniqueBrands = Array.from(new Set(filteredStations.map(station => station.Rótulo)))
    .sort((a, b) => a.localeCompare(b));

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

  // Reset selected brand when filtered stations change
  useEffect(() => {
    setSelectedBrand("todas");
  }, [filteredStations]);

  // Apply brand filter to filtered stations
  useEffect(() => {
    if (selectedBrand === "todas") return;
    
    setFilteredStations(prev => 
      prev.filter(station => station.Rótulo === selectedBrand)
    );
  }, [selectedBrand]);

  const handleCalculateRoute = async () => {
    if (!origin || !destination) {
      toast({
        title: "Error",
        description: "Por favor, introduce origen y destino",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const originCoords = await geocodeCity(origin);
      const destCoords = await geocodeCity(destination);

      if (!originCoords || !destCoords) {
        toast({
          title: "Error",
          description: "No se pudieron encontrar las coordenadas de las ciudades",
          variant: "destructive",
        });
        return;
      }

      const route = await getRoute(originCoords, destCoords);
      if (route) {
        setRouteCoordinates(route);
        // Filter stations near the route
        const routeStations = stations.filter(station => {
          const stationLat = parseFloat(station.Latitud.replace(',', '.'));
          const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
          
          // Check if station is within 5km of any point in the route
          return route.some(point => {
            const distance = calculateDistance(
              stationLat,
              stationLng,
              point[1],
              point[0]
            );
            return distance <= 5; // 5km radius
          });
        });

        // Sort stations by distance along the route
        const sortedStations = routeStations.sort((a, b) => {
          const aLat = parseFloat(a.Latitud.replace(',', '.'));
          const aLng = parseFloat(a['Longitud (WGS84)'].replace(',', '.'));
          const bLat = parseFloat(b.Latitud.replace(',', '.'));
          const bLng = parseFloat(b['Longitud (WGS84)'].replace(',', '.'));

          const aMinDist = Math.min(...route.map(point => 
            calculateDistance(aLat, aLng, point[1], point[0])));
          const bMinDist = Math.min(...route.map(point => 
            calculateDistance(bLat, bLng, point[1], point[0])));

          return aMinDist - bMinDist;
        });
        
        // Apply brand filter if selected
        const finalStations = selectedBrand === "todas" 
          ? sortedStations 
          : sortedStations.filter(station => station.Rótulo === selectedBrand);

        setFilteredStations(finalStations);
        toast({
          title: "Ruta calculada",
          description: `Se encontraron ${finalStations.length} gasolineras cerca de la ruta`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al calcular la ruta",
        variant: "destructive",
      });
      console.error('Error calculating route:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStationClick = (station: FuelStation) => {
    setSelectedStation(station);
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
            return distance <= 10; // 10km radius
          }).sort((a, b) => {
            const aLat = parseFloat(a.Latitud.replace(',', '.'));
            const aLng = parseFloat(a['Longitud (WGS84)'].replace(',', '.'));
            const bLat = parseFloat(b.Latitud.replace(',', '.'));
            const bLng = parseFloat(b['Longitud (WGS84)'].replace(',', '.'));
            
            const distA = calculateDistance(userLat, userLng, aLat, aLng);
            const distB = calculateDistance(userLat, userLng, bLat, bLng);
            return distA - distB;
          });

          // Apply brand filter if selected
          const filteredNearbyStations = selectedBrand === "todas" 
            ? nearbyStations 
            : nearbyStations.filter(station => station.Rótulo === selectedBrand);

          setFilteredStations(filteredNearbyStations);
          setRouteCoordinates([[userLng, userLat]]); // Center map on user location
          
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

  const findCheapestStation = () => {
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
    toast({
      title: "Gasolinera más barata encontrada",
      description: `${cheapestStation.Rótulo} - ${getFuelPrice(cheapestStation, selectedFuel)}€/L`,
    });
  };

  const findNearestStation = () => {
    if (!filteredStations.length || !userLocation) {
      toast({
        title: "Error",
        description: "Primero debes usar tu ubicación para obtener gasolineras cercanas",
        variant: "destructive",
      });
      return;
    }

    const nearestStation = filteredStations[0]; // Ya están ordenadas por distancia
    setSelectedStation(nearestStation);
    
    const [userLat, userLng] = userLocation;
    const stationLat = parseFloat(nearestStation.Latitud.replace(',', '.'));
    const stationLng = parseFloat(nearestStation['Longitud (WGS84)'].replace(',', '.'));
    const distance = calculateDistance(userLat, userLng, stationLat, stationLng);

    toast({
      title: "Gasolinera más cercana encontrada",
      description: `${nearestStation.Rótulo} - a ${distance.toFixed(1)}km`,
    });
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ciudad de origen
                </label>
                <Input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Ej: Madrid"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Ciudad de destino
                </label>
                <Input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Ej: Barcelona"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Select
                value={selectedFuel}
                onValueChange={(value) => setSelectedFuel(value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Tipo de combustible" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina95">Gasolina 95</SelectItem>
                  <SelectItem value="gasolina98">Gasolina 98</SelectItem>
                  <SelectItem value="diesel">Diésel</SelectItem>
                  <SelectItem value="dieselplus">Diésel Plus</SelectItem>
                </SelectContent>
              </Select>

              {filteredStations.length > 0 && (
                <Select
                  value={selectedBrand}
                  onValueChange={setSelectedBrand}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filtrar por empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las empresas</SelectItem>
                    {uniqueBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                onClick={handleCalculateRoute}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                disabled={loading || !origin || !destination}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Calcular Ruta
              </Button>
              <Button
                onClick={handleGetUserLocation}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                disabled={loading}
              >
                <Navigation className="mr-2 h-4 w-4" />
                Usar mi ubicación
              </Button>
            </div>
            {userLocation && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={findCheapestStation}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                  disabled={loading || !filteredStations.length}
                >
                  <Fuel className="mr-2 h-4 w-4" />
                  Encontrar la más barata
                </Button>
                <Button
                  onClick={findNearestStation}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                  disabled={loading || !filteredStations.length}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Encontrar la más cercana
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Map 
          stations={filteredStations} 
          routeCoordinates={routeCoordinates} 
          selectedStation={selectedStation}
          userLocation={userLocation}
        />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station) => (
            <Card
              key={station.IDEESS}
              className={`p-6 transition-all duration-300 cursor-pointer ${
                selectedStation?.IDEESS === station.IDEESS 
                  ? 'ring-2 ring-green-500 shadow-xl bg-green-50 scale-105' 
                  : 'hover:shadow-lg hover:scale-102'
              }`}
              onClick={() => handleStationClick(station)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`font-semibold text-lg ${
                    selectedStation?.IDEESS === station.IDEESS 
                      ? 'text-green-700' 
                      : ''
                  }`}>
                    {station.Rótulo}
                  </h3>
                </div>
                <Fuel className={`h-6 w-6 ${
                  selectedStation?.IDEESS === station.IDEESS 
                    ? 'text-green-500' 
                    : 'text-teal-500'
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;

