
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Map from "@/components/Map";
import { SearchForm } from "@/components/SearchForm";
import { FilterButtons } from "@/components/FilterButtons";
import { StationList } from "@/components/StationList";
import { useGasStations } from "@/hooks/useGasStations";
import { useLocationAndRoute } from "@/hooks/useLocationAndRoute";
import { useStationFilters } from "@/hooks/useStationFilters";

const Index = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedFuel, setSelectedFuel] = useState("gasolina95");
  const [selectedBrand, setSelectedBrand] = useState<string>("todas");

  const {
    stations,
    filteredStations,
    setFilteredStations,
    loading,
    setLoading,
    getAvailableBrands,
  } = useGasStations();

  const {
    userLocation,
    routeCoordinates,
    selectedStation,
    setSelectedStation,
    handleGetUserLocation,
    handleStationClick,
  } = useLocationAndRoute(setFilteredStations, stations);

  const {
    activeFilter,
    findCheapestStation,
    findNearestStation,
  } = useStationFilters(userLocation, filteredStations, setSelectedStation, setRouteCoordinates);

  useEffect(() => {
    setSelectedBrand("todas");
  }, [filteredStations]);

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

  const uniqueBrands = getAvailableBrands(routeCoordinates, userLocation);

  const handleFindCheapest = () => findCheapestStation(selectedFuel);

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
            handleGetUserLocation={() => handleGetUserLocation(selectedBrand, setLoading)}
            userLocation={userLocation}
            routeCoordinates={routeCoordinates}
          />
          <FilterButtons
            userLocation={userLocation}
            loading={loading}
            filteredStations={filteredStations}
            findCheapestStation={handleFindCheapest}
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
