const cityCoordinates = {
  北京: [39.9042, 116.4074],
  上海: [31.2304, 121.4737],
  广州: [23.1291, 113.2644],
  深圳: [22.5431, 114.0579],
  成都: [30.5728, 104.0668],
  四川: [30.5728, 104.0668],
  重庆: [29.563, 106.5516],
  杭州: [30.2741, 120.1551],
  武汉: [30.5928, 114.3055],
  西安: [34.3416, 108.9398],
  南京: [32.0603, 118.7969],
  厦门: [24.4798, 118.0894],
  东京: [35.6762, 139.6503],
  伦敦: [51.5072, -0.1276],
  巴黎: [48.8566, 2.3522],
  纽约: [40.7128, -74.006],
};

const internationalCities = new Set(["东京", "伦敦", "巴黎", "纽约"]);

function distanceKm(a, b) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earth = 6371;
  const lat = toRadians(b[0] - a[0]);
  const lon = toRadians(b[1] - a[1]);
  const h =
    Math.sin(lat / 2) ** 2 +
    Math.cos(toRadians(a[0])) * Math.cos(toRadians(b[0])) * Math.sin(lon / 2) ** 2;
  return Math.round(earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function stableFallbackDistance(origin, destination) {
  const seed = [...`${origin}${destination}`].reduce((total, char) => total + char.charCodeAt(0), 0);
  return 620 + (seed % 1900);
}

export function calculateDelivery(origin, destination) {
  const cleanOrigin = origin.trim() || "北京";
  const cleanDestination = destination.trim() || "成都";
  const samePlace = cleanOrigin === cleanDestination;
  const knownOrigin = cityCoordinates[cleanOrigin];
  const knownDestination = cityCoordinates[cleanDestination];
  const kilometers = samePlace
    ? 18
    : knownOrigin && knownDestination
      ? distanceKm(knownOrigin, knownDestination)
      : stableFallbackDistance(cleanOrigin, cleanDestination);
  const isInternational = internationalCities.has(cleanOrigin) || internationalCities.has(cleanDestination);

  let days = 1;
  if (isInternational) days = Math.min(12, Math.max(6, Math.ceil(kilometers / 1400) + 3));
  else if (kilometers > 2200) days = 5;
  else if (kilometers > 1400) days = 4;
  else if (kilometers > 650) days = 3;
  else if (kilometers > 120) days = 2;

  const arrival = new Date();
  arrival.setDate(arrival.getDate() + days);

  return {
    origin: cleanOrigin,
    destination: cleanDestination,
    kilometers,
    days,
    arrivalDate: arrival.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    demoDuration: Math.min(13000, 4200 + days * 1100),
  };
}

