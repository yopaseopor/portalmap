// OSM Customyopaseopor Vector Tile Style Implementation
// Authentic recreation of the original customyopaseopor.json styling with full transportation hierarchy
function createCustomyopaseoporStyle() {
	return function(feature, resolution) {
		const zoom = Math.round(Math.log2(156543 / resolution));
		const properties = feature.getProperties();
		const featureLayer = properties.layer;

		// BACKGROUND - Exact match to JSON: #f9f4ee
		if (featureLayer === 'background') {
			return new ol.style.Style({
				fill: new ol.style.Fill({color: '#f9f4ee'})
			});
		}

		// OCEAN/WATER - Exact color from JSON: #beddf3, rgb(203,210,223)
		if (featureLayer === 'ocean' || featureLayer === 'water') {
			return new ol.style.Style({
				fill: new ol.style.Fill({color: '#beddf3'})
			});
		}

		// WATER POLYGONS - Rivers, lakes, etc. with #beddf3 color
		if (featureLayer === 'water_polygons') {
			const kind = properties.kind;
			let opacity = zoom >= 4 ? 1 : 0;

			return new ol.style.Style({
				fill: new ol.style.Fill({
					color: `rgba(190, 221, 243, ${opacity})`
				})
			});
		}

		// WATER LINES - Rivers and canals with #beddf3
		if (featureLayer === 'water_lines') {
			const kind = properties.kind;
			let width = 0;

			// Water lines - widths based on JSON river widths [9,15,17,18,20]
			if (kind === 'river') {
				if (zoom >= 9) {
					width = zoom >= 18 ? 2 : zoom >= 17 ? 1.5 : zoom >= 15 ? 1 : 0.5;
				}
			} else if (kind === 'canal') {
				if (zoom >= 10) {
					width = zoom >= 18 ? 2 : zoom >= 17 ? 1.5 : zoom >= 15 ? 1 : 0.5;
				}
			} else if (kind === 'stream') {
				if (zoom >= 13) {
					width = zoom >= 18 ? 1.5 : zoom >= 17 ? 1 : zoom >= 15 ? 0.7 : 0.5;
				}
			} else if (kind === 'ditch') {
				if (zoom >= 14) {
					width = zoom >= 18 ? 1 : zoom >= 17 ? 0.7 : 1;
				}
			}

			if (width > 0) {
				return new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: '#beddf3',
						width: width,
						lineCap: 'round',
						lineJoin: 'round'
					})
				});
			}
		}

		// LANDCOVER - Wood and grass from JSON
		if (featureLayer === 'landcover') {
			const classType = properties.class;
			if (classType === 'wood') {
				return new ol.style.Style({
					fill: new ol.style.Fill({color: 'rgba(102, 173, 164, 0.5)'})
				});
			}
			if (classType === 'grass') {
				return new ol.style.Style({
					fill: new ol.style.Fill({color: 'rgba(171,199,219, 0.5)'})
				});
			}
		}

		// LAND USE AREAS - Exact colors from JSON
		if (featureLayer === 'land') {
			const kind = properties.kind;
			let color = '#ffffff';
			let opacity = 1;

			switch (kind) {
				case 'commercial':
				case 'retail':
					color = '#f7deef'; // rgba(247,222,239,0.25098039215686274)
					opacity = zoom >= 11 ? 0.251 : zoom >= 10 ? 1 : 0;
					break;
				case 'industrial':
				case 'quarry':
				case 'railway':
					color = '#fff494'; // rgba(255,244,148,0.3333333333333333)
					opacity = zoom >= 11 ? 0.333 : zoom >= 10 ? 1 : 0;
					break;
				case 'residential':
				case 'garages':
					color = '#eae6e0'; // rgba(234,230,224,0.2)
					opacity = zoom >= 12 ? 0.2 : zoom >= 11 ? 0.2 : 0;
					break;
				case 'farm':
				case 'farmland':
				case 'farmyard':
				case 'greenfield':
				case 'greenhouse_horticulture':
				case 'orchard':
				case 'plant_nursery':
				case 'vineyard':
				case 'brownfield':
					color = '#f0e5d1'; // Custom agricultural color
					opacity = zoom >= 11 ? 0.25 : 0;
					break;
				case 'waste':
				case 'landfill':
					color = '#dbd6bd'; // RGB equivalent
					opacity = zoom >= 11 ? 0.2 : 0;
					break;
				case 'park':
				case 'village_green':
				case 'recreation_ground':
				case 'allotments':
				case 'garden':
					color = '#d9d9a5'; // RGB equivalent
					opacity = zoom >= 12 ? 1 : 0;
					break;
				case 'forest':
					color = '#66aa44'; // Exact from JSON
					opacity = zoom >= 8 ? 0.1 : 0;
					break;
				case 'grass':
				case 'grassland':
				case 'meadow':
				case 'wet_meadow':
				case 'heath':
				case 'scrub':
					color = '#d8e8c8'; // RGB equivalent
					opacity = zoom >= 12 ? 1 : 0;
					break;
				case 'cemetery':
				case 'grave_yard':
					color = '#dddbca'; // RGB equivalent
					opacity = zoom >= 14 ? 1 : 0;
					break;
				case 'leisure':
				case 'miniature_golf':
				case 'playground':
				case 'golf_course':
					color = '#e7edde'; // RGB equivalent, full density
					opacity = 1;
					break;
				case 'rock':
				case 'bare_rock':
				case 'scree':
				case 'shingle':
					color = '#e0e4e5'; // RGB equivalent
					opacity = 1;
					break;
				case 'sand':
				case 'beach':
					color = '#fafaed'; // RGB equivalent
					opacity = 1;
					break;
				case 'wetland':
				case 'bog':
				case 'marsh':
				case 'string_bog':
				case 'swamp':
					color = '#d3e6db'; // RGB equivalent
					opacity = 2;
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

		// BUILDINGS - Exact from JSON: #f2eae2 and #dfdbd7
		if (featureLayer === 'buildings') {
			const opacity = zoom >= 14 ? 0.9 : 0.4;
			return [
				new ol.style.Style({
					fill: new ol.style.Fill({
						color: `rgba(242, 234, 226, ${opacity})`
					})
				}),
				new ol.style.Style({
					fill: new ol.style.Fill({
						color: `rgba(223, 219, 215, ${opacity})`
					}),
					stroke: zoom >= 16 ? new ol.style.Stroke({
						color: `rgba(214, 177, 146, ${opacity})`,
						width: 0.5
					}) : undefined
				})
			];
		}

		// STREETS - FROM JSON: motorway #2176ff, trunk #900C3F, primary #C70039, secondary #FF5733
		if (featureLayer === 'streets' && !properties.tunnel && !properties.bridge) {
			const kind = properties.kind;
			let width = 0;
			let color = '#ffffff';

			switch (kind) {
				case 'motorway':
					if (zoom >= 5) {
						width = zoom >= 20 ? 168 : zoom >= 19 ? 84 : zoom >= 18 ? 38 : zoom >= 16 ? 14 : zoom >= 14 ? 7 : zoom >= 10 ? 4 : zoom >= 6 ? 1 : 0.5;
						color = '#2176ff'; // Exact from JSON
					}
					break;
				case 'trunk':
					if (zoom >= 5) {
						width = zoom >= 20 ? 168 : zoom >= 19 ? 84 : zoom >= 18 ? 38 : zoom >= 16 ? 14 : zoom >= 14 ? 7 : zoom >= 10 ? 4 : zoom >= 6 ? 1 : 0.5;
						color = '#900C3F'; // Exact from JSON
					}
					break;
				case 'primary':
					if (zoom >= 8) {
						width = zoom >= 20 ? 168 : zoom >= 19 ? 84 : zoom >= 18 ? 36 : zoom >= 16 ? 12 : zoom >= 14 ? 6 : zoom >= 10 ? 3 : 2;
						color = '#C70039'; // Exact from JSON
					}
					break;
				case 'secondary':
					if (zoom >= 9) {
						width = zoom >= 20 ? 160 : zoom >= 19 ? 80 : zoom >= 18 ? 36 : zoom >= 16 ? 12 : zoom >= 14 ? 4 : zoom >= 10 ? 3 : 2;
						color = '#FF5733'; // Exact from JSON
					}
					break;
				case 'tertiary':
					if (zoom >= 11) {
						width = zoom >= 20 ? 160 : zoom >= 19 ? 80 : zoom >= 18 ? 36 : zoom >= 16 ? 12 : zoom >= 14 ? 4 : 1;
						color = '#FFC300'; // Yellow tertiary
					}
					break;
				case 'residential':
				case 'living_street':
					if (zoom >= 13) {
						width = zoom >= 20 ? 100 : zoom >= 19 ? 60 : zoom >= 18 ? 24 : zoom >= 16 ? 8 : zoom >= 14 ? 4 : 2;
						color = '#808080'; // Gray residential
					}
					break;
				case 'unclassified':
					if (zoom >= 13) {
						width = zoom >= 20 ? 160 : zoom >= 19 ? 80 : zoom >= 18 ? 36 : zoom >= 16 ? 12 : zoom >= 14 ? 4 : 2;
						color = '#fff4a5'; // Light yellow
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

		// TUNNEL STYLES - Dashed lines with reduced opacity
		if (featureLayer === 'streets' && properties.tunnel === true) {
			const kind = properties.kind;
			let width = 0;
			let color = '';

			switch (kind) {
				case 'motorway':
				case 'trunk':
				case 'primary':
				case 'secondary':
				case 'tertiary':
				case 'unclassified':
				case 'residential':
				case 'living_street':
					if (zoom >= 10) {
						width = zoom >= 13 ? 2 : 1.5;
						color = '#dedede'; // Gray tunnel
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
						lineDash: [4, 2]
					})
				});
			}
		}

		// BRIDGE STYLES - Similar to tunnels but solid
		if (featureLayer === 'streets' && properties.bridge === true) {
			const kind = properties.kind;
			let width = 0;
			let color = '';

			switch (kind) {
				case 'motorway':
				case 'trunk':
				case 'primary':
				case 'secondary':
				case 'tertiary':
				case 'unclassified':
				case 'residential':
				case 'living_street':
					if (zoom >= 10) {
						width = zoom >= 13 ? 2 : 1.5;
						color = '#f4f0e9'; // Bridge color
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

		// AIRPORT FEATURES
		if (featureLayer === 'airport') {
			const kind = properties.kind;
			if (kind === 'runway') {
				if (zoom >= 14) {
					return new ol.style.Style({
						stroke: new ol.style.Stroke({
							color: '#ffffff',
							width: zoom >= 17 ? 38 : zoom >= 16 ? 20 : zoom >= 15 ? 12 : 6
						})
					});
				}
			}
		}

		// PLACE LABELS - Different styling for different place types
		if (featureLayer === 'place_labels') {
			const name = properties.name;
			const kind = properties.kind;

			if (!name) return undefined;

			let fontSize = 11;
			let visible = false;
			let color = '#283049';

			switch (kind) {
				case 'country':
				case 'capital':
					if (zoom >= 5) {
						fontSize = zoom >= 10 ? 16 : 12;
						visible = true;
						color = '#283049';
					}
					break;
				case 'state_capital':
					if (zoom >= 6) {
						fontSize = zoom >= 10 ? 15 : 11;
						visible = true;
						color = '#283049';
					}
					break;
				case 'city':
					if (zoom >= 7) {
						fontSize = zoom >= 10 ? 14 : 11;
						visible = true;
						color = '#283049';
					}
					break;
				case 'town':
					if (zoom >= 9) {
						fontSize = zoom >= 12 ? 14 : 11;
						visible = true;
						color = '#283040';
					}
					break;
				case 'village':
					if (zoom >= 11) {
						fontSize = zoom >= 12 ? 14 : 11;
						visible = true;
						color = '#283030';
					}
					break;
			}

			if (visible) {
				return new ol.style.Style({
					text: new ol.style.Text({
						text: name,
						font: `bold ${fontSize}px Arial, sans-serif`,
						fill: new ol.style.Fill({color: color}),
						stroke: new ol.style.Stroke({
							color: '#ffffff',
							width: zoom <= 8 ? 2 : 1
						}),
						textAlign: 'center',
						textBaseline: 'bottom'
					})
				});
			}
		}

		// BOUNDARY LABELS
		if (featureLayer === 'boundary_labels') {
			const name = properties.name;
			const adminLevel = properties.admin_level;

			if (!name) return undefined;

			let fontSize = 8;
			let visible = false;

			if (adminLevel === 2) {
				if (zoom >= 4) {
					fontSize = zoom >= 5 ? 11 : 8;
					visible = true;
				}
			} else if (adminLevel === 4) {
				if (zoom >= 7) {
					fontSize = zoom >= 10 ? 12 : 10;
					visible = true;
				}
			}

			if (visible) {
				return new ol.style.Style({
					text: new ol.style.Text({
						text: name.toUpperCase(),
						font: `bold ${fontSize}px Arial, sans-serif`,
						fill: new ol.style.Fill({color: '#363647'}),
						stroke: new ol.style.Stroke({
							color: '#ffffff',
							width: zoom <= 5 ? 2 : 1
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
			if (!name || zoom < 12) return undefined;

			return new ol.style.Style({
				text: new ol.style.Text({
					text: name,
					font: `bold 13px Arial, sans-serif`,
					fill: new ol.style.Fill({color: '#333344'}),
					stroke: new ol.style.Stroke({
						color: '#ffffff',
						width: 2
					}),
					placement: 'line',
					textAlign: 'center'
				})
			});
		}

		// PUBLIC TRANSPORT - Buses, trams, subways from JSON
		if (featureLayer === 'public_transport') {
			const kind = properties.kind;
			const name = properties.name;

			if (zoom >= 16 && (kind === 'bus_stop' || kind === 'bus_stop' === kind)) {
				return new ol.style.Style({
					image: new ol.style.Icon({
						src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTggMTJoOE0xMiAxNHY0IiBzdHJva2U9IiM2NjYyNmEiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjEyIiB5PSI5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBzdHJva2U9IiM2NjYyNmEiIGZvbnQtc2l6ZT0iOCI+QlVTPC90ZXh0Pjwvc3ZnPg==',
						scale: 0.7
					}),
					text: name ? new ol.style.Text({
						text: name,
						font: '10px Arial, sans-serif',
						fill: new ol.style.Fill({color: '#66626a'}),
						stroke: new ol.style.Stroke({
							color: '#ffffff',
							width: 2
						}),
						offsetY: -20
					}) : undefined
				});
			}
		}

		// POI FEATURES with proper sprite system
		if (featureLayer === 'pois') {
			const classType = properties.class ||
						 (properties.amenity || properties.leisure || properties.shop || properties.tourism || properties.man_made || properties.historic || properties.emergency || properties.highway || properties.office);

			if (zoom >= 16 && classType) {
				const name = properties.name;
				let iconUrl = '';

				// Use icons that match the JSON sprite system
				switch (classType) {
					case 'restaurant':
					case 'fast_food':
						iconUrl = '🍽️';
						break;
					case 'cafe':
						iconUrl = '☕';
						break;
					case 'bar':
						iconUrl = '🍺';
						break;
					case 'bank':
						iconUrl = '🏦';
						break;
					case 'atm':
						iconUrl = '🏧';
						break;
					case 'hospital':
						iconUrl = '🏥';
						break;
					case 'pharmacy':
						iconUrl = '💊';
						break;
					case 'school':
						iconUrl = '🎓';
						break;
					case 'police':
						iconUrl = '🚔';
						break;
					case 'fire_station':
						iconUrl = '🚒';
						break;
					case 'fuel':
						iconUrl = '⛽';
						break;
					case 'parking':
						iconUrl = '🅿️';
						break;
					case 'place_of_worship':
						iconUrl = '⛪';
						break;
					case 'library':
						iconUrl = '📖';
						break;
					case 'cinema':
						iconUrl = '🎬';
						break;
					case 'theatre':
						iconUrl = '🎭';
						break;
					default:
						iconUrl = '📍';
						break;
				}

				return new ol.style.Style({
					text: new ol.style.Text({
						text: name ? `${iconUrl} ${name}` : iconUrl,
						font: '12px Arial, sans-serif',
						fill: new ol.style.Fill({color: '#555555'}),
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
		}

		return undefined;
	};
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '0,0,0';
}
