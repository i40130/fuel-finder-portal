export interface FuelStation {
  "C.P.": string;
  Dirección: string;
  Horario: string;
  Latitud: string;
  Localidad: string;
  "Longitud (WGS84)": string;
  Margen: string;
  Municipio: string;
  "Precio Biodiesel": string;
  "Precio Bioetanol": string;
  "Precio Gas Natural Comprimido": string;
  "Precio Gas Natural Licuado": string;
  "Precio Gases licuados del petróleo": string;
  "Precio Gasoleo A": string;
  "Precio Gasoleo B": string;
  "Precio Gasoleo Premium": string;
  "Precio Gasolina 95 E10": string;
  "Precio Gasolina 95 E5": string;
  "Precio Gasolina 95 E5 Premium": string;
  "Precio Gasolina 98 E10": string;
  "Precio Gasolina 98 E5": string;
  "Precio Hidrogeno": string;
  Provincia: string;
  Remisión: string;
  Rótulo: string;
  "Tipo Venta": string;
  "% BioEtanol": string;
  "% Éster metílico": string;
  IDEESS: string;
  IDMunicipio: string;
  IDProvincia: string;
  IDCCAA: string;
  distance?: number;
}

export async function fetchFuelStations(): Promise<FuelStation[]> {
  try {
    // Usamos un proxy CORS para evitar problemas de acceso a la API
    const response = await fetch(
      "https://corsproxy.io/?https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres"
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.ListaEESSPrecio || [];
  } catch (error) {
    console.error("Error fetching fuel stations:", error);
    return [];
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

export function filterStations(
  stations: FuelStation[],
  userLat: number,
  userLng: number,
  fuelType: string,
  maxDistance: number = 10
): FuelStation[] {
  return stations
    .map((station) => ({
      ...station,
      distance: calculateDistance(
        userLat,
        userLng,
        parseFloat(station.Latitud.replace(",", ".")),
        parseFloat(station["Longitud (WGS84)"].replace(",", "."))
      ),
    }))
    .filter((station) => station.distance <= maxDistance)
    .sort((a, b) => {
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }
      return 0;
    });
}

export function getNearestStation(
  stations: FuelStation[],
  userLat: number,
  userLng: number
): FuelStation | null {
  if (stations.length === 0) return null;

  const stationsWithDistance = stations
    .map((station) => ({
      ...station,
      distance: calculateDistance(
        userLat,
        userLng,
        parseFloat(station.Latitud.replace(",", ".")),
        parseFloat(station["Longitud (WGS84)"].replace(",", "."))
      ),
    }))
    .sort((a, b) => {
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }
      return 0;
    });

  return stationsWithDistance[0];
}

export function getCheapestStationInRadius(
  stations: FuelStation[],
  userLat: number,
  userLng: number,
  fuelType: string,
  maxDistance: number = 10
): FuelStation | null {
  const stationsInRadius = filterStations(stations, userLat, userLng, fuelType, maxDistance);
  
  if (stationsInRadius.length === 0) return null;

  return stationsInRadius.reduce((cheapest, current) => {
    const cheapestPrice = parseFloat(getFuelPrice(cheapest, fuelType).replace(",", "."));
    const currentPrice = parseFloat(getFuelPrice(current, fuelType).replace(",", "."));
    
    if (isNaN(cheapestPrice)) return current;
    if (isNaN(currentPrice)) return cheapest;
    
    return currentPrice < cheapestPrice ? current : cheapest;
  }, stationsInRadius[0]);
}

export function getFuelPrice(station: FuelStation, fuelType: string): string {
  const priceKey = getFuelPriceKey(fuelType);
  const price = station[priceKey as keyof FuelStation];
  return typeof price === "string" ? price : "N/A";
}

function getFuelPriceKey(fuelType: string): string {
  const fuelTypes: { [key: string]: string } = {
    gasolina95: "Precio Gasolina 95 E5",
    gasolina98: "Precio Gasolina 98 E5",
    diesel: "Precio Gasoleo A",
    dieselplus: "Precio Gasoleo Premium",
  };
  return fuelTypes[fuelType] || "Precio Gasolina 95 E5";
}
