import assert from "node:assert/strict";
import test from "node:test";

import {
  YUEQING_LOCATION,
  buildWeatherUrl,
  getWeatherCondition,
  normalizeWeatherResponse,
} from "../lib/weather.ts";

test("weather requests use Yueqing fallback and every displayed Open-Meteo field", () => {
  assert.deepEqual(YUEQING_LOCATION, {
    name: "乐清市",
    latitude: 28.116,
    longitude: 120.9834,
    isCurrentLocation: false,
  });

  const url = new URL(buildWeatherUrl(YUEQING_LOCATION));
  assert.equal(url.origin, "https://api.open-meteo.com");
  assert.equal(url.pathname, "/v1/forecast");
  assert.equal(url.searchParams.get("timezone"), "auto");
  assert.match(url.searchParams.get("current") || "", /apparent_temperature/);
  assert.match(url.searchParams.get("current") || "", /relative_humidity_2m/);
  assert.match(url.searchParams.get("hourly") || "", /precipitation_probability/);
  assert.match(url.searchParams.get("daily") || "", /temperature_2m_max/);
  assert.match(url.searchParams.get("daily") || "", /temperature_2m_min/);
});

test("WMO weather codes map to concise Chinese conditions and icon kinds", () => {
  assert.deepEqual(getWeatherCondition(0), { label: "晴朗", icon: "sun" });
  assert.deepEqual(getWeatherCondition(2), { label: "局部多云", icon: "cloud-sun" });
  assert.deepEqual(getWeatherCondition(63), { label: "中雨", icon: "rain" });
  assert.deepEqual(getWeatherCondition(95), { label: "雷暴", icon: "storm" });
});

test("forecast normalization starts with now and keeps only future hours", () => {
  const location = { ...YUEQING_LOCATION, name: "当前位置", isCurrentLocation: true };
  const result = normalizeWeatherResponse({
    current: {
      time: "2026-07-11T14:15",
      temperature_2m: 30.4,
      apparent_temperature: 34.1,
      relative_humidity_2m: 72,
      weather_code: 2,
      wind_speed_10m: 11.2,
      is_day: 1,
    },
    hourly: {
      time: ["2026-07-11T13:00", "2026-07-11T14:00", "2026-07-11T15:00", "2026-07-11T16:00", "2026-07-11T17:00", "2026-07-11T18:00", "2026-07-11T19:00", "2026-07-11T20:00"],
      temperature_2m: [29, 30, 31, 31, 30, 29, 28, 27],
      weather_code: [1, 2, 2, 3, 61, 61, 2, 1],
      precipitation_probability: [0, 5, 10, 20, 70, 60, 15, 5],
      is_day: [1, 1, 1, 1, 1, 1, 0, 0],
    },
    daily: {
      temperature_2m_max: [32.2],
      temperature_2m_min: [25.1],
    },
  }, location);

  assert.equal(result.city, "当前位置");
  assert.equal(result.temperature, 30);
  assert.equal(result.high, 32);
  assert.equal(result.low, 25);
  assert.deepEqual(result.hourly.map((hour) => hour.time), ["现在", "15时", "16时", "17时", "18时", "19时"]);
  assert.equal(result.hourly[0].temperature, 30);
  assert.equal(result.hourly[4].precipitationProbability, 60);
});
