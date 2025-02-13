import 'ol/ol.css';
import { Map, View } from 'ol';
import { OSM } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

// 🔹 Источник данных
const API_URL = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/geonames-all-cities-with-a-population-1000/records?limit=20';
  
// 🔹 Функция для создания стиля точки (зависит от населения)
const createCityStyle = (population) => {
    const radius = Math.sqrt(population / 1000000) * 10;

    return new Style({
        image: new CircleStyle({
            radius: Math.max(radius, 5),
            fill: new Fill({ color: 'rgba(0, 0, 255, 0.5)' }), // Синие точки
            stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)', width: 1 })
        })
    });
};

// 🔹 Источник векторных данных для карты
const vectorSource = new VectorSource();

// 🔹 Функция загрузки данных из API
const loadCities = async () => {
  try {
      const response = await fetch("https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&rows=50&sort=population");
      if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);
      
      const data = await response.json();
      console.log("Ответ API:", data); // Проверка данных

      if (!data.records || data.records.length === 0) {
          console.error("Нет данных из API");
          return;
      }

      // 🔹 Очищаем старые точки перед добавлением новых
      vectorSource.clear();

      // 🔹 Добавляем города в виде точек
      data.records.forEach(record => {
          const { name, coordinates, population } = record.fields;
          
          if (!coordinates || coordinates.length < 2) {
              console.warn(`Нет координат для города: ${name}`);
              return;
          }

          const lon = coordinates[1]; // Долгота
          const lat = coordinates[0]; // Широта

          const cityFeature = new Feature({
              geometry: new Point(fromLonLat([lon, lat])),
              name: name,
              population: population || 0
          });

          cityFeature.setStyle(createCityStyle(population));

          vectorSource.addFeature(cityFeature); // Добавляем точку на карту
      });

  } catch (error) {
      console.error("Ошибка загрузки API:", error);
  }
};



// 🔹 Создаём карту
const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({ source: new OSM() }), // Фон карты (OpenStreetMap)
        new VectorLayer({ source: vectorSource }) // Добавляем слой с точками городов
    ],
    view: new View({
        center: fromLonLat([20, 50]), // Центр карты
        zoom: 3
    })
});

// Загружаем города при запуске
loadCities();

// 🔹 Добавляем обработчик изменения размера окна
window.addEventListener('resize', () => {
    map.updateSize();
});

