export type WeatherIconKind =
  | "sun"
  | "cloud-sun"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
  source: LocationSource;
}

export type LocationSource = "gps" | "ip" | "manual" | "default";

export interface CitySearchResult {
  id: string;
  detail: string;
  location: WeatherLocation;
}

export interface WeatherCondition {
  label: string;
  icon: WeatherIconKind;
}

export interface WeatherHour extends WeatherCondition {
  time: string;
  temperature: number;
  precipitationProbability: number;
  isDay: boolean;
}

export interface WeatherViewModel extends WeatherCondition {
  city: string;
  locationSource: LocationSource;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
  isDay: boolean;
  hourly: WeatherHour[];
}

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    is_day: number[];
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export const YUEQING_LOCATION: WeatherLocation = {
  name: "乐清市",
  latitude: 28.116,
  longitude: 120.9834,
  source: "default",
};

export function buildReverseGeocodeUrl(coordinates?: {
  latitude: number;
  longitude: number;
}): string {
  const params = new URLSearchParams({ localityLanguage: "zh" });
  if (coordinates) {
    params.set("latitude", String(coordinates.latitude));
    params.set("longitude", String(coordinates.longitude));
  }
  return `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`;
}

export function parseReverseGeocodeResponse(
  data: Record<string, unknown>,
  source: "gps" | "ip",
): WeatherLocation {
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  const nameCandidates = [data.city, data.locality, data.principalSubdivision];
  const name = nameCandidates.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Incomplete reverse geocoding response");
  }

  return { name, latitude, longitude, source };
}

export function buildCitySearchUrl(query: string): string {
  const params = new URLSearchParams({
    name: query.trim(),
    count: "5",
    language: "zh",
    format: "json",
  });
  return `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
}

export function parseCitySearchResponse(data: Record<string, unknown>): CitySearchResult[] {
  if (!Array.isArray(data.results)) return [];

  return data.results.flatMap((entry): CitySearchResult[] => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

    const detail = [item.admin1, item.country]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(" · ");

    return [{
      id: String(item.id ?? `${latitude},${longitude}`),
      detail,
      location: { name, latitude, longitude, source: "manual" },
    }];
  });
}

export function buildWeatherUrl(location: WeatherLocation): string {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: "2",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0) return { label: "晴朗", icon: "sun" };
  if (code === 1 || code === 2) return { label: "局部多云", icon: "cloud-sun" };
  if (code === 3) return { label: "阴天", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "有雾", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "毛毛雨", icon: "drizzle" };
  if (code === 61 || code === 80) return { label: "小雨", icon: "rain" };
  if (code === 63 || code === 81) return { label: "中雨", icon: "rain" };
  if (code === 65 || code === 82 || code === 66 || code === 67) return { label: "大雨", icon: "rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: "降雪", icon: "snow" };
  if (code >= 95) return { label: "雷暴", icon: "storm" };
  return { label: "多云", icon: "cloud" };
}

export function normalizeWeatherResponse(
  data: OpenMeteoResponse,
  location: WeatherLocation,
): WeatherViewModel {
  if (!data.current || !data.hourly || !data.daily) {
    throw new Error("Incomplete weather response");
  }

  const currentCondition = getWeatherCondition(data.current.weather_code);
  const currentHour = `${data.current.time.slice(0, 13)}:00`;
  const currentHourIndex = data.hourly.time.indexOf(currentHour);
  const futureIndexes = data.hourly.time
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time > currentHour)
    .slice(0, 5);

  const hourly: WeatherHour[] = [
    {
      time: "现在",
      temperature: Math.round(data.current.temperature_2m),
      precipitationProbability: Math.round(data.hourly.precipitation_probability[currentHourIndex] ?? 0),
      isDay: data.current.is_day === 1,
      ...currentCondition,
    },
    ...futureIndexes.map(({ time, index }) => ({
      time: `${time.slice(11, 13)}时`,
      temperature: Math.round(data.hourly.temperature_2m[index]),
      precipitationProbability: Math.round(data.hourly.precipitation_probability[index] ?? 0),
      isDay: data.hourly.is_day[index] === 1,
      ...getWeatherCondition(data.hourly.weather_code[index]),
    })),
  ];

  return {
    city: location.name,
    locationSource: location.source,
    temperature: Math.round(data.current.temperature_2m),
    apparentTemperature: Math.round(data.current.apparent_temperature),
    humidity: Math.round(data.current.relative_humidity_2m),
    windSpeed: Math.round(data.current.wind_speed_10m),
    high: Math.round(data.daily.temperature_2m_max[0]),
    low: Math.round(data.daily.temperature_2m_min[0]),
    isDay: data.current.is_day === 1,
    hourly,
    ...currentCondition,
  };
}
