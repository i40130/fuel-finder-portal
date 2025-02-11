import { useState, useEffect } from "react";
import { Search, MapPin, Fuel, Filter } from "lucide-react";
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
  getNearestStation,
  getCheapestStationInRadius,
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
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>();
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
        
        setFilteredStations(routeStations);
        toast({
          title: "Ruta calculada",
          description: `Se encontraron ${routeStations.length} gasolineras cerca de la ruta`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al calcular la ruta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              <Button
                onClick={handleCalculateRoute}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                disabled={loading || !origin || !destination}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Calcular Ruta
              </Button>
            </div>
          </div>
        </Card>

        <Map stations={filteredStations} routeCoordinates={routeCoordinates} />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((station) => (
            <Card
              key={station.IDEESS}
              className="p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{station.Rótulo}</h3>
                </div>
                <Fuel className="h-6 w-6 text-teal-500" />
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
