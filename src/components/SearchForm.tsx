
import { Search, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { geocodeCity, getRoute, type FuelStation } from "@/lib/fuelApi";
import { useToast } from "@/hooks/use-toast";

interface SearchFormProps {
  origin: string;
  setOrigin: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  selectedFuel: string;
  setSelectedFuel: (value: string) => void;
  selectedBrand: string;
  setSelectedBrand: (value: string) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  stations: FuelStation[];
  setFilteredStations: (stations: FuelStation[]) => void;
  setRouteCoordinates: (coordinates: number[][]) => void;
  uniqueBrands: string[];
  handleGetUserLocation: () => void;
  userLocation: [number, number] | undefined;
  routeCoordinates: number[][] | undefined;
}

export function SearchForm({
  origin,
  setOrigin,
  destination,
  setDestination,
  selectedFuel,
  setSelectedFuel,
  selectedBrand,
  setSelectedBrand,
  loading,
  setLoading,
  stations,
  setFilteredStations,
  setRouteCoordinates,
  uniqueBrands,
  handleGetUserLocation,
  userLocation,
  routeCoordinates,
}: SearchFormProps) {
  const { toast } = useToast();

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
        const routeStations = stations.filter(station => {
          const stationLat = parseFloat(station.Latitud.replace(',', '.'));
          const stationLng = parseFloat(station['Longitud (WGS84)'].replace(',', '.'));
          
          return route.some(point => {
            const distance = calculateDistance(
              stationLat,
              stationLng,
              point[1],
              point[0]
            );
            return distance <= 5;
          });
        });

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

  return (
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
          onValueChange={setSelectedFuel}
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

        {(userLocation || routeCoordinates) && (
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
    </div>
  );
}
