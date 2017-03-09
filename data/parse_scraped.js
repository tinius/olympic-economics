import fs from 'fs'

let exceptions = {

	'USA' : 'United States',
	'South Korea' : 'Korea (Republic of)',
	'CAN' : 'Canada',
	'Bosnia-Herzegovina' : 'Bosnia and Herzegovina',
	'Russia' : 'Russian Federation',
	'Finand' : 'Finland',
	'Puerto Rico' : 'United States' // Hm.
}

let parseYear = (yearString) => {
	return parseInt(/[0-9]{4}/.exec(yearString)[0])
}

let parseWinter = (yearString) => {
	return yearString.search(/winter/i) >= 0 ? true : false
}

let bids = JSON.parse(fs.readFileSync('bids_scraped.json'))

	let bids_parsed = bids
		.map(obj => {

			let year = parseYear(obj.yearString)
			let winter = parseWinter(obj.yearString)

			let bidders = obj.bidders.map(str => {

				let countryStr = str.split(',').slice(-1)[0].trim()
				let country = /innsbruck/i.test(countryStr) ? 'Austria' :
					(/withdrawn/i.test(countryStr) ? countryStr.split('(')[0].trim() : countryStr )

				country = exceptions[country] ? exceptions[country] : country
				
				let city = str.split(',')[0]

				return {
					city,
					country
				}

			})

			let host = bidders[0]

			return {
				year,
				winter,
				bidders,
				host
			}

		})

// write result to data dir for other scripts to access, to interactive dir for client side code to use

fs.writeFileSync('bids_parsed.json', JSON.stringify(bids_parsed, null, 2))
fs.writeFileSync('../interactive/bids_parsed.json', JSON.stringify(bids_parsed, null, 2))

console.log('completed initial parsing of scraped data')