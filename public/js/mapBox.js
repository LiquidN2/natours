export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibGlkcXVpZG4yIiwiYSI6ImNrMTV1czBzZDAwczgzb211emprcTVjNHUifQ.Q_cuTO8eEsI0rNdUOJUqjg';

  const map = new mapboxgl.Map({
    container: 'map', // id of the element containing map
    style: 'mapbox://styles/mapbox/light-v10',
    // style: 'mapbox://styles/lidquidn2/ck15v2rif10tz1co8z460kln0', // stylesheet location
    scrollZoom: false // disable scroll zoom
    // center: [-118.2588942, 34.0434003],
    // zoom: 10
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker to map
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup info
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend the map bound to current location
    bounds.extend(loc.coordinates);
  });

  // Fit all the locations on the map
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
