
// runs my python3 based scraper plus a number of node scripts consecutively

module.exports = grunt => {

	grunt.loadNpmTasks('grunt-shell');

	var nodeCmds = ['parse_scraped.js', 'match_new.js', 'monotonic.js', 'parse_travel.js']
		.map(filename => './node_modules/.bin/babel-node ' + filename + ' --presets es2015')

	grunt.initConfig({
	    shell: {
	        options: {
	            stderr: false
	        },
	        target: {
	            command: ['python3 bid_scraper.py'].concat(nodeCmds).join(' && ')
	        }
	    }
	});

	grunt.registerTask('default', ['shell'])
}