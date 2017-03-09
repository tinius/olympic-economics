from bs4 import BeautifulSoup
import urllib.request
import json
import os.path
import re

# cache HTML while further developing scraper
if os.path.isfile('bids.html') :
	with open('bids.html', 'r') as f :
		html = f.read()

else :
	html = urllib.request.urlopen('http://gamesbids.com/eng/past-bid-results/').read()
	with open('bids.html', 'w') as f :
		f.write(str(html))

soup = BeautifulSoup(html)

# only post-war Games and no Youth Olympics please
def filter_games(o) :
	year_string = o.find_all('td')[-8].get_text()
	return not re.search('youth', year_string, re.I) and int(year_string[:4]) > 1948

def get_cell(column, i) : 
	x = column.get_text().split('\\n')
	return x[i] if len(x) > i and x[i] not in ['', '–'] else None  

def map_olympics(o) :

	tds = o.find_all('td')

	cities_td = tds[-7]
	candidates = cities_td.get_text().split('\\n')

	rows = tds[-6].get_text().split('\\n')

	points_grouped = [ [ get_cell(column, i) for column in tds[-6:] ] for i, row in enumerate(rows) ]

	year_string = tds[-8].get_text()
	winter = True if re.search('winter', year_string, re.I) else False


	return {
		'bidders' : candidates,
		'yearString' : year_string.strip()
	}

olympics = list(map(map_olympics, filter(filter_games, soup.table.find_all('tr')[3:])))

with open('bids_scraped.json', 'w') as f :
	json.dump(olympics, f, indent=2)