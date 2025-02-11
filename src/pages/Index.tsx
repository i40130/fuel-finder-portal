
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

const Index = () => {
  const [location, setLocation] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGeolocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
          setLoading(false);
          toast({
            title: "Ubicación detectada",
            description: "Coordenadas actualizadas correctamente",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoading(false);
          toast({
            title: "Error de geolocalización",
            description: "No se pudo obtener tu ubicación",
            variant: "destructive",
          });
        }
      );
    } else {
      setLoading(false);
      toast({
        title: "Geolocalización no soportada",
        description: "Tu navegador no soporta geolocalización",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-semibold tracking-tight">
            Buscador de Gasolineras
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Encuentra las gasolineras más cercanas y compara precios de combustible en tiempo real
          </p>
        </div>

        <Card className="p-6 shadow-lg bg-white/80 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Latitud</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={location.lat}
                    onChange={(e) =>
                      setLocation((prev) => ({ ...prev, lat: e.target.value }))
                    }
                    placeholder="Ingresa la latitud"
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Longitud</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={location.lng}
                    onChange={(e) =>
                      setLocation((prev) => ({ ...prev, lng: e.target.value }))
                    }
                    placeholder="Ingresa la longitud"
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleGeolocation}
                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  "Obteniendo ubicación..."
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Usar mi ubicación
                  </>
                )}
              </Button>
              <Select>
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
              <Button variant="outline" className="flex-1">
                <Filter className="mr-2 h-4 w-4" />
                Más filtros
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder para las estaciones */}
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Estación {i}</h3>
                  <p className="text-sm text-gray-600">A 2.{i} km de distancia</p>
                </div>
                <Fuel className="h-6 w-6 text-teal-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Gasolina 95:</span> 1.{i}99 €/L
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Diésel:</span> 1.{i}79 €/L
                </p>
                <p className="text-sm text-gray-600 truncate">
                  Calle Example {i}, Ciudad
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
