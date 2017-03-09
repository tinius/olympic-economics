import fs from 'fs'
import parse from 'csv-parse/lib/sync'
import _ from 'lodash'

let years = [1980, 1985, 1990, 1995, 2000, 2005, 2010, 2011, 2012, 2013, 2014]

let hdi = parse(fs.readFileSync('hdi.csv').toString())
	.map(row => {
		return {
			'name' : row[0].trim(),
			'hdi' : row.slice(1).map((d, i) => { return { 'year' : years[i], 'hdi' : parseFloat(d) > 0 ? parseFloat(d) : null } })
		}
	})

let exceptions = {

	'USA' : 'United States',
	'South Korea' : 'Korea (Republic of)',
	'CAN' : 'Canada',
	'Bosnia-Herzegovina' : 'Bosnia and Herzegovina',
	'Russia' : 'Russian Federation',
	'Puerto Rico' : 'United States' // Hm.
}

let bids = JSON.parse(fs.readFileSync('bids_parsed.json'))

let hdiCountryData = _(bids)
	.map(obj => {
		return obj.bidders
			.map(bidder => {
				return hdi.find(row => row.name === bidder.country)
			})
	})
	.flatten()
	.uniqBy('name')
	.filter(obj => obj && obj.hdi)
	.keyBy('name')
	.mapValues(obj => obj.hdi)
	.valueOf()


fs.writeFileSync('hdi_dict.json', JSON.stringify(hdiCountryData, null, 2))

console.log('created a dictionary of bids and HDI entries')