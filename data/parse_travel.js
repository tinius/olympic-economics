import fs from 'fs'
import _ from 'lodash'

let travel = JSON.parse(fs.readFileSync('ustravel.json'))

// Utah & the states that neighbour it
let states = ['Utah', 'Nevada', 'Idaho', 'Wyoming', 'New Mexico', 'Arizona', 'Colorado']

let data = travel.bundles
	.filter(b => states.includes(b.name))
	.map(b => {
		let name = b.name
		let expenditures = b.kits.find(k => k.id === 36).data // found this id by manually checking JSON
		return { name, expenditures }
	})

fs.writeFileSync('../interactive/us_travel_parsed.json', JSON.stringify(data, null, 2))

console.log('parsed US travel expenditures data')