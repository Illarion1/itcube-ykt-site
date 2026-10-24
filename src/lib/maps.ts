import { site } from '../data/site';

const { lat, lon } = site.coords;
const { city, firmId } = site.twoGis;

// «Построить маршрут» в 2ГИС: откуда ехать, 2ГИС спросит сам (или возьмёт местоположение),
// куда — здание IT-куба вместе с карточкой организации (точка «долгота,широта;номер»)
export const routeUrl = `https://2gis.ru/${city}/directions/points/%7C${lon}%2C${lat}%3B${firmId}`;

// Карта 2ГИС для сайта — бесплатный виджет, ключ не нужен. На карте карточка IT-куба:
// адрес, телефон, часы работы, кнопки «Путь сюда» и «Доехать с 2ГИС»
export const mapWidgetUrl = `https://widgets.2gis.com/widget?type=firmsonmap&options=${encodeURIComponent(
  JSON.stringify({ pos: { lat, lon, zoom: 16 }, opt: { city }, org: firmId }),
)}`;
