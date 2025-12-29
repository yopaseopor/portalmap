// Versatiles Colorful Vector Tile Style Implementation
// Based on traditional colorful map design with vibrant colors and comprehensive features
function createVersatilesColorfulStyle() {
	return function(feature, resolution) {
		const zoom = Math.round(Math.log2(156543 / resolution));
		const properties = feature.getProperties();
		const featureLayer = properties.layer;

		// BACKGROUND - Warm beige/off-white
		if (featureLayer === 'background') {
			return new ol.style.Style({
				fill: new ol.style.Fill({color: '#f9f4ee'})
			});
		}

		// OCEAN WATER - Deep blue
		if (featureLayer === 'ocean') {
			return new ol.style.Style({
				fill: new ol.style.Fill({color: '#bed9f7'})
			});
		}

		// WATER POLYGONS - Rivers, lakes, etc.
		if (featureLayer === 'water_polygons') {
			const kind = properties.kind;
			let opacity = zoom >= 4 ? 1 : 0;

			return new ol.style.Style({
				fill: new ol.style.Fill({
					color: `rgba(190, 217, 247, ${opacity})`
				})
			});
		}

		// WATER LINES - Rivers and canals
		if (featureLayer === 'water_lines') {
			const kind = properties.kind;
			let width = 0;
			let color = '#bed9f7';

			if (kind === 'river') {
				if (zoom >= 9) {
					width = zoom >= 15 ? 5 : zoom >= 12 ? 3 : 2;
				}
			} else if (kind === 'canal') {
				if (zoom >= 10) {
					width = zoom >= 15 ? 4 : zoom >= 12 ? 2.5 : 1.5;
				}
			} else if (kind === 'stream') {
				if (zoom >= 13) {
					width = zoom >= 17 ? 3 : zoom >= 15 ? 2 : 1.5;
				}
			} else if (kind === 'ditch') {
				if (zoom >= 14) {
					width = zoom >= 17 ? 2 : 1;
				}
			}

			if (width > 0) {
				return new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: color,
						width: width,
						lineCap: 'round',
						lineJoin: 'round'
					})
				});
			}
		}

		// WATER DAMS
		if (featureLayer === 'dam_lines' || featureLayer === 'dam_polygons') {
			if (zoom >= 12) {
				return new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: '#bed9f7',
						width: 2
					}),
					fill: new ol.style.Fill({color: '#f9f4ee'})
				});
			}
		}

		// WATER PIERS/BRIDGES
		if (featureLayer === 'pier_lines' || featureLayer === 'pier_polygons') {
			const kind = properties.kind;
			if (zoom >= 12 && (kind === 'pier' || kind === 'breakwater' || kind === 'groyne')) {
				return new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: '#f9f4ee',
						width: 1
					}),
					fill: new ol.style.Fill({color: '#f9f4ee'})
				});
			}
		}

		// LAND USE - ORANGE/BROWN palette for different land uses
		if (featureLayer === 'land') {
			const kind = properties.kind;
			let color = '#f9f4ee'; // Default background
			let opacity = 0.2; // Very subtle

			switch (kind) {
				case 'commercial':
				case 'retail':
					color = '#f7deef'; // Light pink
					opacity = zoom >= 10 ? 0.251 : 0;
					break;
				case 'industrial':
				case 'railway':
				case 'quarry':
					color = '#fff494'; // Light yellow
					opacity = zoom >= 10 ? 0.333 : 0;
					break;
				case 'residential':
				case 'garages':
					color = '#e4e0dc'; // Light gray-beige
					opacity = zoom >= 10 ? 0.2 : 0;
					break;
				case 'agriculture':
				case 'farmland':
				case 'farmyard':
				case 'brownfield':
				case 'greenfield':
				case 'orchard':
				case 'vineyard':
				case 'greenhouse_horticulture':
				case 'plant_nursery':
					color = '#f0e5cc'; // Sandy brown
					opacity = zoom >= 10 ? 0.25 : 0;
					break;
				case 'landfill':
					color = '#ddd990'; // Pale olive
					opacity = zoom >= 10 ? 0.2 : 0;
					break;
				case 'park':
				case 'village_green':
				case 'recreation_ground':
					color = '#a2d165'; // Medium green
					opacity = zoom >= 11 ? 1 : zoom >= 10 ? 0.5 : 0;
					break;
				case 'allotments':
				case 'garden':
					color = '#a2d165'; // Same green as park
					opacity = zoom >= 11 ? 1 : zoom >= 10 ? 0.5 : 0;
					break;
				case 'cemetery':
				case 'grave_yard':
					color = '#ddcfbd'; // Beige
					opacity = zoom >= 13 ? 1 : 0;
					break;
				case 'miniature_golf':
				case 'playground':
				case 'golf_course':
					color = '#f1f5dc'; // Very pale green
					opacity = zoom >= 11 ? 1 : 0;
					break;
				case 'bare_rock':
				case 'scree':
				case 'shingle':
					color = '#e0e4e5'; // Very light blue-gray
					opacity = 1;
					break;
				case 'forest':
					color = '#66aa51'; // Rich forest green
					opacity = zoom >= 7 ? Math.min(0.1 + (zoom - 7) * 0.05, 1) : 0;
					break;
				case 'grass':
				case 'grassland':
				case 'meadow':
				case 'wet_meadow':
					color = '#a2d195'; // Light green
					opacity = zoom >= 11 ? 1 : zoom >= 10 ? 0.5 : 0;
					break;
				case 'heath':
				case 'scrub':
					color = '#a2d165'; // Medium green
					opacity = zoom >= 11 ? 1 : zoom >= 10 ? 0.5 : 0;
					break;
				case 'beach':
				case 'sand':
					color = '#fffef7'; // Nearly white
					opacity = 1;
					break;
				case 'bog':
				case 'marsh':
				case 'string_bog':
				case 'swamp':
					color = '#c3e6d9'; // Pale blue-green
					opacity = 1;
					break;
			}

			if (opacity > 0) {
				return new ol.style.Style({
					fill: new ol.style.Fill({
						color: `rgba(${hexToRgb(color)},${opacity})`
					})
				});
			}
		}

		// SITES - Special areas like hospitals, universities, prisons
		if (featureLayer === 'sites') {
			const kind = properties.kind;
			let color = '#ffffff';
			let opacity = 1;

			switch (kind) {
				case 'danger_area':
					color = '#ff0000';
					opacity = 0.3;
					break;
				case 'university':
				case 'college':
					color = '#ffff00';
					opacity = 0.1;
					break;
				case 'school':
					color = '#ffff00';
					opacity = 0.1;
					break;
				case 'hospital':
					color = '#ff6464';
					opacity = 0.1;
					break;
				case 'prison':
					color = '#fdf2fc'; // Light purple-gray
					opacity = 0.1;
					break;
				case 'parking':
				case 'bicycle_parking':
					color = '#dfd8d5'; // Beige-gray
					opacity = kind === 'parking' ? 1 : 0.8;
					break;
				case 'construction':
					color = '#6b6b6b'; // Dark gray
					opacity = 0.1;
					break;
			}

			return new ol.style.Style({
				fill: new ol.style.Fill({
					color: `rgba(${hexToRgb(color)},${opacity})`
				}),
				stroke: new ol.style.Stroke({
					color: kind === 'danger_area' ? '#ff0000' : color,
					width: 1
				})
			});
		}

		// AIRPORTS
		if (featureLayer === 'street_polygons') {
			const kind = properties.kind;
			if ((kind === 'runway' || kind === 'taxiway') && zoom >= 10) {
				return new ol.style.Style({
					fill: new ol.style.Fill({color: 'rgba(255,255,255,0.5)'})
				});
			}
		}

		if (featureLayer === 'streets' && zoom >= 10) {
			const kind = properties.kind;
			let width = 0;
			let color = '#cccccc';

			if (kind === 'runway') {
				width = 8;
				color = '#cccccc';
			} else if (kind === 'taxiway') {
				width = 4;
				color = '#cccccc';
			}

			if (width > 0) {
				return new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: color,
						width: width / zoom, // Scale down based on zoom
						lineJoin: 'round',
						lineCap: 'round'
					})
				});
			}
		}

		// BUILDINGS - Warm orange/brown
		if (featureLayer === 'buildings') {
			const opacity = zoom >= 14 ? 1 : zoom >= 15 ? 0.8 : 0.5;
			return new ol.style.Style({
				fill: new ol.style.Fill({
					color: `rgba(226, 210, 190, ${opacity})`
				}),
				stroke: zoom >= 16 ? new ol.style.Stroke({
					color: 'rgba(217, 177, 146, 0.5)',
					width: 0.5
				}) : undefined
			});
		}

		// STREETS - TUNNELS
		if (featureLayer === 'streets') {
			const tunnel = properties.tunnel;
			const kind = properties.kind;
			const bridge = properties.bridge;

			if (tunnel === true && !bridge) {
				// TUNNEL STYLES - Dashed with grayish color
				let width = 0;
				let color = '#dedede';

				switch (kind) {
					case 'motorway':
						if (zoom >= 5) {
							width = zoom >= 14 ? 8 : zoom >= 10 ? 5 : 3;
						}
						break;
					case 'trunk':
						if (zoom >= 7) {
							width = zoom >= 14 ? 7 : zoom >= 10 ? 4 : 2.5;
						}
						break;
					case 'primary':
						if (zoom >= 8) {
							width = zoom >= 14 ? 6 : zoom >= 10 ? 4 : 2.5;
						}
						break;
					case 'secondary':
						if (zoom >= 11) {
							width = zoom >= 14 ? 5 : zoom >= 12 ? 4 : 2.5;
						}
						break;
					case 'tertiary':
						if (zoom >= 12) {
							width = zoom >= 14 ? 4.5 : zoom >= 13 ? 3.5 : 2.5;
						}
						break;
					case 'living_street':
					case 'residential':
						if (zoom >= 12) {
							width = zoom >= 14 ? 4 : zoom >= 13 ? 3 : 2;
						}
						break;
					case 'service':
						if (zoom >= 14) {
							width = zoom >= 15 ? 3 : 2;
						}
						break;
					case 'track':
						if (zoom >= 14) {
							width = zoom >= 15 ? 3 : 2;
						}
						break;
					case 'footway':
					case 'path':
						if (zoom >= 15) {
							width = 1.5;
							color = '#f0f0f0';
						}
						break;
				}

				if (width > 0) {
					return new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: color,
							width: width,
							lineCap: 'round',
							lineJoin: 'round',
							lineDash: [2, 0.5] // Dashed pattern for tunnels
						})
					});
				}
			} else if (!tunnel && bridge) {
				// BRIDGE STYLES - Different colors for bridges
				return new ol.style.Style({
					fill: new ol.style.Fill({color: '#f4f0e9'}) // Bridge deck color
				});
			}
		}

		// STREETS - NORMAL ROADS
		if (featureLayer === 'streets' && !properties.tunnel && !properties.bridge) {
			const kind = properties.kind;
			let width = 0;
			let color = '#ffffff';

			switch (kind) {
				case 'motorway':
					if (zoom >= 5) {
						width = zoom >= 12 ? 8 : zoom >= 9 ? 6 : 4;
						color = '#ffdb94'; // Orange highway
					}
					break;
				case 'trunk':
					if (zoom >= 6) {
						width = zoom >= 12 ? 7 : zoom >= 8 ? 5 : 3.5;
						color = '#ffdb94'; // Orange trunk
					}
					break;
				case 'primary':
					if (zoom >= 8) {
						width = zoom >= 12 ? 6 : zoom >= 10 ? 4 : 3;
						color = '#ffea82'; // Yellow primary
					}
					break;
				case 'secondary':
					if (zoom >= 9) {
						width = zoom >= 12 ? 5 : zoom >= 10 ? 4 : 2.5;
						color = '#ffea82'; // Yellow secondary
					}
					break;
				case 'tertiary':
					if (zoom >= 10) {
						width = zoom >= 12 ? 4.5 : zoom >= 11 ? 3.5 : 2.5;
						color = '#ffea82'; // Yellow tertiary
					}
					break;
				case 'living_street':
				case 'residential':
					if (zoom >= 12) {
						width = zoom >= 14 ? 4 : zoom >= 13 ? 3 : 2;
						color = '#fafafa'; // Off-white residential
					}
					break;
				case 'service':
					if (zoom >= 12) {
						width = zoom >= 15 ? 3 : zoom >= 13 ? 2.5 : 2;
						color = '#f0f0f0'; // Light gray service
					}
					break;
				case 'track':
				case 'path':
				case 'footway':
				case 'cycleway':
				case 'pedestrian':
					if (zoom >= 14) {
						width = zoom >= 16 ? 1.5 : 1;
						color = '#f0f0f0'; // Very light gray for trails
					}
					break;
			}

			if (width > 0) {
				return new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: color,
						width: width,
						lineCap: 'round',
						lineJoin: 'round'
					})
				});
			}
		}

		// PLACE LABELS
		if (featureLayer === 'place_labels') {
			const name = properties.name;
			const kind = properties.kind;

			if (!name) return undefined;

			let fontSize = 8;
			let visible = false;

			switch (kind) {
				case 'city':
					if (zoom >= 7) {
						fontSize = zoom >= 10 ? 14 : zoom >= 8 ? 12 : 10;
						visible = true;
					}
					break;
				case 'town':
					if (zoom >= 9) {
						fontSize = zoom >= 13 ? 12 : 11;
						visible = true;
					}
					break;
				case 'village':
					if (zoom >= 13) {
						fontSize = 10;
						visible = true;
					}
					break;
				case 'hamlet':
					if (zoom >= 13) {
						fontSize = 9;
						visible = true;
					}
					break;
				case 'suburb':
					if (zoom >= 11) {
						fontSize = 10;
						visible = true;
					}
					break;
				case 'neighbourhood':
					if (zoom >= 14) {
						fontSize = 9;
						visible = true;
					}
					break;
				case 'quarter':
					if (zoom >= 13) {
						fontSize = 9;
						visible = true;
					}
					break;
			}

			if (visible) {
				return new ol.style.Style({
					text: new ol.style.Text({
						text: name,
						font: `bold ${fontSize}px Arial, sans-serif`,
						fill: new ol.style.Fill({color: '#403a45'}), // Dark text
						stroke: new ol.style.Stroke({
							color: '#ffffff',
							width: 3
						}),
						textAlign: 'center',
						textBaseline: 'bottom'
					})
				});
			}
		}

		// STREET LABELS
		if (featureLayer === 'street_labels') {
			const name = properties.name;
			if (!name || zoom < 14) return undefined;

			return new ol.style.Style({
				text: new ol.style.Text({
					text: name,
					font: `bold 10px Arial, sans-serif`,
					fill: new ol.style.Fill({color: '#333333'}),
					stroke: new ol.style.Stroke({
						color: '#ffffff',
						width: 2
					}),
					placement: 'line',
					textAlign: 'center'
				})
			});
		}

		// BOUNDARY LABELS
		if (featureLayer === 'boundary_labels') {
			const name = properties.name;
			const adminLevel = properties.admin_level;

			if (!name) return undefined;

			let fontSize = 10;
			let visible = false;

			switch (adminLevel) {
				case 2:
					if (zoom >= 4) {
						fontSize = zoom >= 5 ? 12 : 10;
						visible = true;
					}
					break;
				case 4:
					if (zoom >= 5) {
						fontSize = zoom >= 8 ? 12 : 10;
						visible = true;
					}
					break;
			}

			if (visible) {
				return new ol.style.Style({
					text: new ol.style.Text({
						text: name,
						font: `bold ${fontSize}px Arial, sans-serif`,
						fill: new ol.style.Fill({color: '#334d6e'}),
						stroke: new ol.style.Stroke({
							color: '#ffffff',
							width: 2
						}),
						textAlign: 'center',
						textBaseline: 'bottom'
					})
				});
			}
		}

		// HOUSE NUMBERS
		if (featureLayer === 'addresses' && zoom >= 17) {
			const housenumber = properties.housenumber;
			if (housenumber) {
				return new ol.style.Style({
					text: new ol.style.Text({
						text: housenumber,
						font: `9px Arial, sans-serif`,
						fill: new ol.style.Fill({color: '#888888'}),
						stroke: new ol.style.Stroke({
							color: '#ffffff',
							width: 1
						}),
						textAlign: 'center',
						textBaseline: 'bottom'
					})
				});
			}
		}

		// POI LABELS WITH EMOJIS
		if (featureLayer === 'pois' && zoom >= 16) {
			const name = properties.name;
			const classType = properties.class;

			if (!classType) return undefined;

			let emoji = '📍';

			switch (classType) {
				case 'restaurant':
				case 'fast_food':
					emoji = '🍽️';
					break;
				case 'cafe':
					emoji = '☕';
					break;
				case 'pub':
				case 'bar':
					emoji = '🍻';
					break;
				case 'supermarket':
					emoji = '🛒';
					break;
				case 'bank':
					emoji = '🏦';
					break;
				case 'place_of_worship':
					emoji = '⛪';
					break;
				case 'hospital':
					emoji = '🏥';
					break;
				case 'school':
					emoji = '🎓';
					break;
				case 'hotel':
					emoji = '🏨';
					break;
				case 'cinema':
					emoji = '🎬';
					break;
				case 'pharmacy':
					emoji = '💊';
					break;
				case 'dentist':
					emoji = '🦷';
					break;
				case 'parking':
					emoji = '🅿️';
					break;
				case 'fuel':
					emoji = '⛽';
					break;
				case 'bakery':
					emoji = '🥖';
					break;
				case 'butcher':
					emoji = '🥩';
					break;
				case 'florist':
					emoji = '💐';
					break;
				case 'library':
					emoji = '📖';
					break;
				case 'police':
					emoji = '🚔';
					break;
				case 'fire_station':
					emoji = '🚒';
					break;
				case 'post office':
					emoji = '📮';
					break;
				case 'townhall':
					emoji = '🏛️';
					break;
				default:
					return undefined; // Don't show unknown POIs
			}

			return new ol.style.Style({
				text: new ol.style.Text({
					text: name ? `${emoji} ${name}` : emoji,
					font: `10px Arial, sans-serif`,
					fill: new ol.style.Fill({color: '#111111'}),
					stroke: new ol.style.Stroke({
						color: '#ffffff',
						width: 2
					}),
					textAlign: 'left',
					placement: 'point',
					textBaseline: 'bottom'
				})
			});
		}

		return undefined;
	};
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '0,0,0';
}
