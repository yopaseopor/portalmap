// MapTiler Basic Vector Tile Style Implementation
// Comprehensive POI coverage with emojis for visual identification
function createMapTilerBasicStyle() {
	return function(feature, resolution) {
		const zoom = Math.round(Math.log2(156543 / resolution));
		const properties = feature.getProperties();
		const featureLayer = properties.layer;

		// LANDCOVER - Forests
		if (featureLayer === 'landcover') {
			const classType = properties.class;
			if (classType === 'wood') {
				return new ol.style.Style({
					fill: new ol.style.Fill({color: 'rgba(118, 163, 107, 0.6)'})
				});
			}
			if (classType === 'grass') {
				return new ol.style.Style({
					fill: new ol.style.Fill({color: 'hsl(82, 46%, 72%)'})
				});
			}
		}

		// WATER
		if (featureLayer === 'water') {
			return new ol.style.Style({
				fill: new ol.style.Fill({color: 'hsl(205, 56%, 73%)'})
			});
		}

		// BUILDINGS
		if (featureLayer === 'building') {
			let fillOpacity = zoom >= 13 ? 1 : 0;
			return new ol.style.Style({
				fill: new ol.style.Fill({
					color: `rgba(222, 211, 190, ${fillOpacity})`
				}),
				stroke: new ol.style.Stroke({
					color: zoom >= 16 ? 'rgba(212, 177, 146, 0.5)' : 'rgba(212, 177, 146, 0)',
					width: 0.5
				})
			});
		}

		// ROADS - ULTRA NATURAL LOOK, NO MARKING AT ALL AT LOW ZOOM
		if (featureLayer === 'transportation') {
			const classType = properties.class;
			const brunnel = properties.brunnel;

			// Skip tunnels
			if (brunnel === 'tunnel') return undefined;

			let width = 0;
			let color = '#ffffff';

			switch (classType) {
				case 'motorway':
					if (zoom >= 6) {
						width = zoom >= 12 ? 8 : zoom >= 9 ? 6 : 4; // Much thicker motorways
						color = '#666666'; // Darker gray for major highways
					}
					break;
				case 'trunk':
					if (zoom >= 6) {
						width = zoom >= 12 ? 7 : zoom >= 8 ? 5 : 3.5;
						color = '#777777'; // Medium gray for trunk roads
					}
					break;
				case 'primary':
					if (zoom >= 8) {
						width = zoom >= 12 ? 6 : zoom >= 10 ? 4 : 3;
						color = '#888888'; // Main urban streets
					}
					break;
				case 'secondary':
					if (zoom >= 9) {
						width = zoom >= 12 ? 5 : zoom >= 10 ? 4 : 2.5;
						color = '#999999'; // Neighborhood connectors
					}
					break;
				case 'tertiary':
					if (zoom >= 10) {
						width = zoom >= 12 ? 4.5 : zoom >= 11 ? 3.5 : 2.5;
						color = '#aaaaaa'; // Local streets
					}
					break;
				case 'minor':
				case 'service':
					if (zoom >= 12) {
						width = zoom >= 15 ? 3 : zoom >= 13 ? 2.5 : 2;
						color = '#bbbbbb'; // Minor roads - not brown, just light gray
					}
					break;
				case 'track':
				case 'path':
				case 'footway':
				case 'cycleway':
				case 'pedestrian':
					// TRACKS, SIDEWALKS AND FOOT PATHS - only at high zoom
					if (zoom >= 14) {
						width = zoom >= 16 ? 1.5 : 1;
						color = '#f0f0f0'; // Very light gray for pedestrian paths
					}
					break;
				case 'bridge':
					// Bridged roads
					if (zoom >= 12) {
						width = zoom >= 14 ? 4 : 2.5;
						color = '#aaaaaa';
					}
					break;
			}

			if (width === 0) return undefined;

			// SINGLE STYLE ONLY - NO CASING AT ALL, JUST NATURAL ROADS
			return new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: color,
					width: width,
					lineCap: 'round',
					lineJoin: 'round'
				})
			});
		}

		// PLACE NAMES WITH SMART PRIORITIZATION
		if (featureLayer === 'place') {
			const name = properties.name;
			const classType = properties.class;

			let fontSize = 8; // Small default for very low zooms
			let visible = false;

			if (zoom < 3) return undefined; // Too zoomed out

			switch (classType) {
				case 'city':
					// STRATIFIED APPROACH: Only TRUE major cities at low zoom levels
					if (zoom >= 3 && zoom <= 7) {
						// MAJOR CAPITALS ONLY at lowest zooms (3-7)
						// In a real implementation, you could check if city is a capital
						// or has population > X threshold
						fontSize = 12;
						visible = true;
					}
					else if (zoom >= 8 && zoom <= 11) {
						// MAJOR + PROVINCIAL CAPITALS (8-11)
						fontSize = zoom >= 10 ? 16 : 14;
						visible = true;
					}
					else if (zoom >= 12) {
						// ALL CITIES at high zoom (12+)
						fontSize = Math.min(20, zoom >= 14 ? 18 : 16);
						visible = true;
					}
					break;
				case 'town':
					// Important regional towns only at higher zoom
					if (zoom >= 10) {
						fontSize = zoom >= 13 ? 14 : 12;
						visible = true;
					}
					break;
				case 'village':
					// Local villages in populated areas
					if (zoom >= 12) {
						fontSize = zoom >= 15 ? 12 : 11;
						visible = true;
					}
					break;
				case 'neighbourhood':
				case 'suburb':
					// Only at street-level detail
					if (zoom >= 15) {
						fontSize = 10;
						visible = true;
					}
					break;
			}

			if (visible && name !== undefined && name !== null && name.trim() !== '') {
				return new ol.style.Style({
					text: new ol.style.Text({
						text: name,
						font: `bold ${fontSize}px Arial, sans-serif`,
						fill: new ol.style.Fill({color: '#000000'}),
						stroke: new ol.style.Stroke({
							color: '#ffffff',
							width: zoom <= 8 ? 3 : 2  // Thicker halo at low zoom
						}),
						textAlign: 'center',
						textBaseline: 'bottom'
					})
				});
			}
		}

		// STREET NAMES (for road labels)
		if (featureLayer === 'transportation_name') {
			const name = properties.name;
			if (!name) return undefined;

			// Show street names at zoom level 14 and above
			if (zoom < 14) return undefined;

			let fontSize = zoom >= 16 ? 9 : 7.5;

			return new ol.style.Style({
				text: new ol.style.Text({
					text: name.toUpperCase(),
					font: `bold ${fontSize}px Arial, sans-serif`,
					fill: new ol.style.Fill({color: '#000000'}),
					stroke: new ol.style.Stroke({
						color: '#ffffff',
						width: 1
					}),
					placement: 'line',
					textAlign: 'center',
					offsetY: 3 // move label slightly above the road
				})
			});
		}

		// HOUSE NUMBERS
		if (featureLayer === 'housenumber') {
			const housenumber = properties.housenumber;
			if (!housenumber) return undefined;

			// Show house numbers at zoom level 14 and above
			if (zoom < 14) return undefined;

			return new ol.style.Style({
				text: new ol.style.Text({
					text: housenumber,
					font: `10px Arial, sans-serif`,
					fill: new ol.style.Fill({color: 'rgba(212, 177, 146, 1)'}),
					stroke: new ol.style.Stroke({
						color: 'rgba(255, 255, 255, 0.8)',
						width: 1
					}),
					textAlign: 'center',
					textBaseline: 'bottom'
				})
			});
		}

		// POIs (Points of Interest) with EMOJI SPRITES - zoom 18+
		if (featureLayer === 'poi' || featureLayer === 'poi_label') {
			// Only show POIs at very high zoom (street level detail)
			if (zoom < 18) return undefined;

			const name = properties.name;
			const classType = properties.class;
			const subclass = properties.subclass;

			// Get emoji based on POI type
			let emoji = '📍'; // Default pin

			switch (classType) {
				// FOOD & DRINK
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
				case 'ice_cream':
					emoji = '🍦';
					break;

				// ACCOMMODATION
				case 'hotel':
					emoji = '🏨';
					break;
				case 'motel':
					emoji = '🏩';
					break;

				// SHOPPING & RETAIL
				case 'supermarket':
				case 'convenience':
				case 'general':
					emoji = '🛒';
					break;
				case 'clothes':
					emoji = '👕';
					break;
				case 'shoes':
					emoji = '👠';
					break;
				case 'electronics':
					emoji = '💻';
					break;
				case 'books':
					emoji = '📚';
					break;
				case 'chemist':
				case 'cosmetics':
					emoji = '🧴';
					break;
				case 'florist':
					emoji = '💐';
					break;
				case 'hairdresser':
				case 'beauty':
					emoji = '💇';
					break;
				case 'bakery':
					emoji = '🥖';
					break;
				case 'butcher':
					emoji = '🥩';
					break;
				case 'gift':
				case 'souvenir':
					emoji = '🎁';
					break;
				case 'toys':
					emoji = '🧸';
					break;
				case 'furniture':
					emoji = '🛋️';
					break;
				case 'hardware':
					emoji = '🔧';
					break;

				// FINANCIAL & BANKING
				case 'bank':
					emoji = '🏦';
					break;
				case 'atm':
					emoji = '🏧';
					break;
				case 'bureau_de_change':
					emoji = '💱';
					break;
				case 'insurance':
					emoji = '📋';
					break;

				// HEALTH & MEDICAL
				case 'pharmacy':
					emoji = '💊';
					break;
				case 'hospital':
				case 'clinic':
				case 'doctors':
					emoji = '🏥';
					break;
				case 'dentist':
					emoji = '🦷';
					break;
				case 'optician':
					emoji = '👓';
					break;
				case 'veterinary':
					emoji = '🐕‍🦺';
					break;

				// EDUCATION
				case 'school':
				case 'university':
					emoji = '🎓';
					break;
				case 'kindergarten':
					emoji = '🧒';
					break;
				case 'library':
					emoji = '📖';
					break;
				case 'college':
					emoji = '🏫';
					break;

				// ENTERTAINMENT & LEISURE
				case 'cinema':
					emoji = '🎬';
					break;
				case 'theatre':
					emoji = '🎭';
					break;
				case 'stadium':
				case 'sports_centre':
					emoji = '⚽';
					break;
				case 'nightclub':
					emoji = '🕺';
					break;
				case 'casino':
					emoji = '🎰';
					break;
				case 'art_centre':
					emoji = '🎨';
					break;
				case 'music_venue':
					emoji = '🎵';
					break;

				// TOURISM & RECREATION
				case 'park':
					emoji = '🌳';
					break;
				case 'attraction':
					emoji = '🎡';
					break;
				case 'museum':
					emoji = '🖼️';
					break;
				case 'zoo':
					emoji = '🦁';
					break;
				case 'aquarium':
					emoji = '🐠';
					break;
				case 'theme_park':
					emoji = '🎢';
					break;
				case 'viewpoint':
					emoji = '🌄';
					break;
				case 'castle':
					emoji = '🏰';
					break;
				case 'monument':
				case 'memorial':
					emoji = '🗽';
					break;
				case 'picnic_site':
					emoji = '🏞️';
					break;
				case 'playground':
					emoji = '🛝';
					break;
				case 'camp_site':
					emoji = '⛺';
					break;
				case 'hostel':
					emoji = '🛏️';
					break;

				// AMENITIES & SERVICES
				case 'toilet':
					emoji = '🚽';
					break;
				case 'drinking_water':
					emoji = '🚰';
					break;
				case 'telephone':
					emoji = '📞';
					break;
				case 'internet_cafe':
					emoji = '💻';
					break;

				// OFFICES & PROFESSIONAL
				case 'office':
					emoji = '🏢';
					break;
				case 'company':
					emoji = '🏭';
					break;
				case 'lawyer':
					emoji = '⚖️';
					break;
				case 'estate_agent':
					emoji = '🏠';
					break;
				case 'real_estate':
					emoji = '🏘️';
					break;
				case 'accountant':
					emoji = '🧮';
					break;
				case 'architect':
					emoji = '📐';
					break;
				case 'travel_agency':
					emoji = '✈️';
					break;

				// GOVERNMENT & PUBLIC
				case 'townhall':
					emoji = '🏛️';
					break;
				case 'embassy':
					emoji = '👔';
					break;
				case 'police':
					emoji = '🚔';
					break;
				case 'fire_station':
					emoji = '🚒';
					break;
				case 'post_office':
					emoji = '📮';
					break;
				case 'courthouse':
					emoji = '🏛️';
					break;

				// TRANSPORT
				case 'fuel':
				case 'gas':
					emoji = '⛽';
					break;
				case 'charging_station':
					emoji = '⚡';
					break;
				case 'parking':
					emoji = '🅿️';
					break;
				case 'car_rental':
					emoji = '🚗';
					break;
				case 'taxi':
					emoji = '🚕';
					break;
				case 'bus_station':
					emoji = '🚍';
					break;
				case 'train_station':
					emoji = '🚂';
					break;
				case 'ferry_terminal':
					emoji = '⛴️';
					break;
				case 'airport':
					emoji = '✈️';
					break;

				// RELIGION
				case 'place_of_worship':
					switch (subclass) {
						case 'christian':
							emoji = '⛪';
							break;
						case 'muslim':
							emoji = '🕌';
							break;
						case 'jewish':
							emoji = '🕍';
							break;
						case 'buddhist':
							emoji = '🛕';
							break;
						case 'hindu':
							emoji = '🕉️';
							break;
						case 'shinto':
							emoji = '🅰️';
							break;
						default:
							emoji = '⛩️';
							break;
					}
					break;

				// DEFAULT
				default:
					emoji = '📍';
					break;
			}

			return new ol.style.Style({
				text: new ol.style.Text({
					text: name ? `${emoji} ${name}` : emoji,
					font: `10px Arial, sans-serif`,
					fill: new ol.style.Fill({color: '#000000'}),
					stroke: new ol.style.Stroke({
						color: '#ffffff',
						width: 2
					}),
					textAlign: 'left',
					textBaseline: 'bottom'
				})
			});
		}

		return undefined;
	};
}
