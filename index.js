const request = require("request");
const mustache = require("mustache");

const fs = require("fs");

let template = fs.readFileSync("./template.xml") + "";

let scraper = {
	getCurrentFlights: function(){
		return new Promise((resolve, reject) => {
			request.get('https://data-live.flightradar24.com/zones/fcgi/feed.js?faa=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1', function(err, httpResponse, body) {
				body = JSON.parse(body);

				Object.keys(body).forEach((key) => {
					if(!(body[key][16] && body[key][16].indexOf("HBAL") === 0)){
						delete body[key];
					}
				});

				resolve(body);
			});
		});
	},
	getFlight: function(id){
		return new Promise((resolve, reject) => {
			request.get('https://data-live.flightradar24.com/clickhandler/?version=1.5&flight='+id, function(err, httpResponse, body) {
				body = JSON.parse(body);

				resolve(body);
			});
		});
	}
}

scraper.getCurrentFlights().then((flights) => {
	flights = Object.keys(flights).map((id) => {
		return scraper.getFlight(id);
	});

	Promise.all(flights).then((flights) => {
		flights = flights.map((flight) => {
			flight.trail = flight.trail.map((dot) => {
				dot.time = new Date(dot.ts * 1000).toISOString();

				return dot;
			});

			flight = {
				name: flight.identification.callsign,
				points: flight.trail
			};

			return flight;
		});

		let view ={
			"name": "Baloon map",
			"date": new Date().toISOString(),
			"tracks": flights
		};

		console.log(mustache.render(template, view));
	});
})

