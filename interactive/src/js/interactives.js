import * as d3 from 'd3'
import sportsCost from './sports_cost.json!'
import bids from './bids_parsed.json!'
import hdiDict from './hdi_interpolated.json!'
import usTravel from './us_travel_parsed.json!'

// shared functions

let $ = (sel) => {
    return document.querySelector(sel)
}

let $$ = (sel) => {
    return document.querySelectorAll(sel)
}

// use with Array.reduce
let flatten = (cur, arr) => {
   return arr ? arr.concat(cur) : cur
}

// smells like Python spirit
let sorted = (arr, lambda) => {
    return arr.slice().sort(lambda)
}

// Sports cost interactive

let drawSportsCost = (svgEl) => {

    let svg = d3.select(svgEl)
    let margin = 8
    let width = svgEl.clientWidth || svgEl.getBoundingClientRect().width

    let costScale = x => x*(width-2*margin)/21.890

    let axisOffset = 24

    let gradient = svg
        .append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%')
        .attr('x2', '0%')
        .attr('y1', '0%')
        .attr('y2', '100%')
        .attr('gradientUnits', 'userSpaceOnUse')

    gradient.append('stop')
        .attr('offset', '60%')
        .attr('stop-color', '#ddd')
        .attr('stop-opacity', 1)

    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#ddd')
        .attr('stop-opacity', 0)

    let lines = svg
        .selectAll('.cost-axis')
        .data(d3.range(1, 22).filter(n => n % 2 === 0)) // don't show line at 0
        .enter()
        .append('line')
        .attr('x1', d => margin + costScale(d))
        .attr('x2', d => margin + costScale(d))
        .attr('y1', axisOffset)
        .attr('y2', sportsCost.length*26 + axisOffset + 4)
        .attr('class', (d, i) => i % 2 === 1 ? 'cost-axis' : 'cost-axis hide-on-mobile')

    let defaultSortFunc = (a, b) => b.year - a.year

    let sortedData = sorted(sportsCost, defaultSortFunc)

    let axisLabels = svg
        .selectAll('.cost-axis-label')
        .data(d3.range(0, 22).filter(n => n % 2 === 0))
        .enter()
        .append('text')
        .text(d => {
            return d === 20 ? `$${d} bn.` : d
        })
        .attr('x', d => margin + costScale(d))
        .attr('y', 16)
        .attr('class', (d, i) => i % 2 === 0 ? 'cost-axis-label' : 'cost-axis-label hide-on-mobile')

    let gs = svg
        .selectAll('.bar-group')
        .data(sortedData)
        .enter()
        .append('g')
        .attr('class', 'bar-group')
        .attr('transform', (d, i) => {
            return `translate(${margin}, ${axisOffset + 4 + i*26})`
        })

    let bars = gs
        .append('rect')
        .attr('width', d => costScale(d.cost))
        .attr('height', 22)
        .attr('class', d => d.winter ? 'cost-bar winter' : 'cost-bar summer')

    let labels = gs
        .append('text')
        .attr('x', d => {
            let width = costScale(d.cost)
            return width < 100 ? width + 4 : width - 4
        })
        .attr('y', 15)
        .text(d => d.city === 'Rio' ? `${d.city} ${d.year} *` : `${d.city} ${d.year}`)
        .attr('class', d => {
            let width = costScale(d.cost)
            return width < 100 ? 'bar-label' : 'bar-label inside-bar'
        })

    // called every time one of the checkboxes is ticked/unticked

    function change() {

        let gBox = $('.js-group')
        let sBox = $('.js-sort')

        let sortFunc = (a, b) => sBox.checked ? 
            b.cost - a.cost
             : defaultSortFunc(a, b)

        let groupFunc = gBox.checked ?
            (a, b) => {
                return a.winter - b.winter !== 0 ?
                    a.winter - b.winter :
                    sortFunc(a,b)
            }
            : sortFunc

        let newData = sorted(sportsCost, groupFunc)

        gs
            .transition()
            .duration(600)
            .ease(d3.easeCubic)
            .attr('transform', (d, i) => {
                let y = newData.indexOf(d)*26
                return `translate(${margin}, ${axisOffset + 4 + y})`
            })
    }

    d3.select('.js-sort').on('change', change)
    d3.select('.js-group').on('change', change)

}

// Utah + neighbouring states travel expenditures interactive

let drawUsTravel = (svgEl) => {

    let svg = d3.select(svgEl)

    let prev = null
    let prevLabel = null

    let width = svgEl.clientWidth || svgEl.getBoundingClientRect().width
    let height = 380

    let margins = {
        'top' : 16,
        'bottom' : 24,
        'left' : 8,
        'right' : 8
    }


    let maxChange = d3.max(usTravel.map(s => s.expenditures.map((e, i, arr) => e/arr[0])).reduce(flatten))

    let xScale = d3.scaleLinear()
        .domain([0, 14])
        .range([margins.left, width-margins.right])

    let yScale = d3.scaleLinear()
        .domain([0.8, 2.05])
        .range([height-margins.bottom, margins.top])

    let yLines = svg
        .selectAll('us-y-line')
        .data([1, 1.25, 1.5, 1.75, 2])
        .enter()
        .append('line')
        .attr('x1', margins.left)
        .attr('x2', width - margins.right)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('class', 'us-y-line')

    let allPoints = usTravel
        .map(s => {
            return s.expenditures
                .map((e, i, arr) => e/arr[0])
                .map((e, i) => {
                    return {
                        'growth' : e,
                        'year' : i,
                        'state' : s.name
                    }
                })
        })
        .reduce(flatten)

    let voronoi = d3.voronoi()
        .x(d => xScale(d.year))
        .y(d => yScale(d.growth))
        .extent([[0, 0], [ width, height ]])

    // draw line and label for each state

    usTravel.forEach(state => {

        let lineGen = d3.line()
            .x((d, i) => xScale(i))
            .y((d, i, arr) => yScale(d/arr[0]))

        svg
            .append('path')
            .datum(state.expenditures)
            .attr('d', lineGen)
            .attr('data-state', state.name)
            .attr('class', d => {
                return state.name === 'Utah' ? 'us-line us-line-olympic' :
                (state.name === 'U.S.' ? 'us-line us-line-total' : 'us-line')
            })

        svg.append('text')
            .attr('x', xScale(8))
            .attr('y', yScale(state.expenditures[8]/state.expenditures[0]) - 6)
            .attr('class', state.name === 'Utah' ? 'us-state-label us-state-label-utah is-hidden' : 'us-state-label is-hidden')
            .attr('data-state', state.name)
            .text(state.name)


    })

    let xAxis = svg
        .append('line')
        .attr('x1', margins.left)
        .attr('x2', width-margins.right)
        .attr('y1', height-margins.bottom)
        .attr('y2', height-margins.bottom)
        .attr('class', 'basic-axis us-x-axis')

    let xLabels = svg
        .selectAll('us-x-label')
        .data(d3.range(1, 14))
        .enter()
        .append('text')
        .attr('class', (d, i) => {
            return i % 2 === 1 ? 'basic-label basic-label-x us-x-label' : 'basic-label basic-label-x us-x-label hide-on-mobile'
        })
        .attr('x', d => xScale(d))
        .attr('y', height - margins.bottom + 16)
        .text(d => 2000 + d)

    let yLabels = svg
        .selectAll('us-y-label')
        .data([1, 1.25, 1.5, 1.75, 2])
        .enter()
        .append('text')
        .attr('x', margins.left + 4)
        .attr('y', d => yScale(d) - 4)
        .attr('class', 'basic-label')
        .text(d => {
            let p = parseInt((d-1)*100)
            return p === 0 ? 0 : (p > 0 ? `+${p}%` : `${p}%` )
        })

    let olympicsLine = svg
        .append('line')
        .attr('x1', xScale(2))
        .attr('x2', xScale(2))
        .attr('y1', margins.top)
        .attr('y2', height-margins.bottom)
        .attr('class', 'olympics-line')

    let olympicsHint = svg
        .append('text')
        .attr('x', xScale(2) + 4)
        .attr('y', yScale(1.875) + 4)
        .attr('class', 'olympics-hint')
        .text('Salt Lake City Olympics')

    let unhighlightLine = () => {
        if(prevLabel){
            prevLabel.classed('is-hidden', true)
        }
        if(prev){
            prev.classed('us-line-hl', false)
        }
    }

    let highlightLine = (state) => {
        
        unhighlightLine()

        let el = d3.select(`.us-line[data-state="${state}"]`)
            .classed('us-line-hl', true)

        el.node().parentNode.appendChild(el.node())

        let t = d3.select(`.us-state-label[data-state="${state}"]`)

        t.node().parentNode.appendChild(t.node())
        t.classed('is-hidden', false)

        prevLabel = t
        prev = el
    }

    let voronoiPolys = svg
        .selectAll('.voronoi')
        .data(voronoi(allPoints).polygons())
        .enter()
        .append('path')
        .attr('d', d => {
            return d ? "M" + d.join("L") + "Z" : null
        })
        .attr('class', 'voronoi')
        .on('mouseover', (d, i) => {
            unhighlightLine()
            let state = d.data.state
            highlightLine(state)
        })

    svg.on('mouseleave', () => {
        highlightLine('Utah')
    })

    highlightLine('Utah')

}

// Human Development Index interactive

let drawHdi = (svgEl) => {

    let width = svgEl.clientWidth || svgEl.getBoundingClientRect().width
    let height = 380

    let margins = {
        'left' : 4,
        'top' : 16,
        'bottom' : 32,
        'right' : 4
    }

    let padding = 12

    let margin = 24
    let axisOffset = 24

    let xScale = d3.scaleLinear()
        .domain([1988, 2020])
        .range([margins.left+padding, width-margins.right-padding])

    let yScale = d3.scaleLinear()
        .domain([0.5, 0.91])
        .range([height-margins.bottom-padding, margins.top+padding])

    let svg = d3.select(svgEl)

    let bidGroups = svg
        .selectAll('.year-group')
        .data(bids.filter(b => b.year < 2022))
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(${xScale(d.year)}, 0)`)
        .attr('class', 'year-group')

    let xAxis = svg
        .append('line')
        .attr('x1', margins.left)
        .attr('x2', width - margins.right)
        .attr('y1', height - margins.bottom)
        .attr('y2', height - margins.bottom)
        .attr('class', 'hdi-axis')

    let yAxis = svg
        .append('line')
        .attr('x1', margins.left)
        .attr('x2', margins.left)
        .attr('y1', height - margins.bottom)
        .attr('y2', margins.top)
        .attr('class', 'hdi-axis')

    let bidLabels = bidGroups
        .append('text')
        .attr('x', 0)
        .attr('y', (d, i) => {
            return (i % 2 === 0 || d.year < 1994) ? height - 16 : height
        })
        .text(d => '\'' + String(d.year).slice(2))
        .attr('class', 'bid-year-label')

    let moreDeveloped = svg
        .append('text')
        .attr('x', margins.left + 6)
        .attr('y', margins.top + padding)
        .attr('class', 'bid-help-label')
        .text('more developed')

    let lessDeveloped = svg
        .append('text')
        .attr('x', margins.left + 6)
        .attr('y', height-margins.bottom-padding)
        .attr('class', 'bid-help-label')
        .text('less developed')

    let gamesBidFor = svg
        .append('text')
        .attr('x', margins.left + width/2 - margins.right)
        .attr('y', height + 20 )
        .attr('class', 'bid-center-label')
        .text('Olympics')


    let allBids = bids
        .filter(bid => bid.year >= 1988 && bid.year < 2022)
        .map(bid => {
            return bid.bidders.map(bidder => {

                let hdiObj = (hdiDict[bidder.country] || []).find(o => o.year === bid.year - 7)

                return {
                    'bidder' : bidder,
                    'year' : bid.year,
                    'winter' : bid.winter,
                    'host' : bidder.city === bid.host.city,
                    'hdi' : hdiObj ? hdiObj.hdi : undefined
                }
            })
        })
        .reduce(flatten)
        .filter(bid => bid.hdi)

    let bidGroup = svg
        .append('g')
        .attr('class', 'bid-layer')

    bidGroup
        .selectAll('.bid-hdi-point')
        .data(allBids)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => yScale(d.hdi))
        .attr('r', 5.5)
        .attr('class', d => {

            let css = 'bid-hdi-point'
            css += d.host ? ' bid-selected' : ''
            css += d.winter ? ' bid-winter' : ' bid-summer'
            return css
        })
        .attr('data-id', d => d.bidder.city.toLowerCase()) //+ d.year)

    bidGroup
        .selectAll('.bid-label')
        .data(allBids)
        .enter()
        .append('text')
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.hdi) - 12)
        .text(d => {
            let c = d.bidder.country
            if(c === 'Korea (Republic of)') { c = 'South Korea' }
            return d.bidder.city + ', ' + c
        })
        .attr('class', d => {

            let x = xScale(d.year)

            return x > width - 100 ? 'bid-label bid-label-right is-hidden' :
                ( x < 100 ? 'bid-label bid-label-left is-hidden' : 'bid-label is-hidden' )

            'bid-label is-hidden'
        })
        .attr('data-id', d => d.bidder.city.toLowerCase() + d.year)

    let bids2000 = bids[7].bidders.map(b => {
            return hdiDict[b.country]
        }).filter(d => d)

    let hdiGen = d3.line()
        .x(d => xScale(d.year + 7))
        .y(d => yScale(d.hdi))

    let voronoi = d3.voronoi()
        .x(d => xScale(d.year))
        .y(d => yScale(d.hdi))
        .extent([[0, 0], [ width, height ]])

    let uniqueBy = (arr, comp) => {
        return arr.filter( (e1, i) => {
            return arr.findIndex(e2 => comp(e1, e2)) === i
        })
    }

    let prev = null
    let prevLabel = null

    let uniqueBids = uniqueBy(allBids, (a, b) => a.year === b.year && a.hdi === b.hdi)


    let unhighlightNode = () => {
        if(prevLabel){
            prevLabel.classed('is-hidden', true)
        }
        if(prev){
            prev.each(function(el){
                d3.select(this).classed('hdi-hl', false)
            })
        }
    }

    // unhighlight last node if cursor leaves interactive
    svg.on('mouseleave', unhighlightNode)

    let highlightNode = (d, i) => {
        unhighlightNode()

        let city = d.data.bidder.city.toLowerCase()
        let id_ = d.data.bidder.city.toLowerCase() + d.data.year
        

        // highlight all bids the city has ever made
        let els = d3.selectAll(`.bid-hdi-point[data-id="${city}"]`)
            .classed('hdi-hl', true)
        els.each(function(el) {
            this.parentNode.appendChild(this)
        })

        // but only one label
        let t = d3.select(`.bid-label[data-id="${id_}"]`)

        t.node().parentNode.appendChild(t.node())
        t.classed('is-hidden', false)

        prevLabel = t
        prev = els
    }

    let dragging = false

    let voronoiPolys = svg
        .append('g')
        .selectAll('.voronoi')
        .data(voronoi(uniqueBids).polygons())
        .enter()
        .append('path')
        .attr('d', d => {
            return "M" + d.join("L") + "Z";
        })
        .attr('class', 'voronoi')
        .on('mouseover', highlightNode)
        .on('touchstart', () => dragging = false)
        .on('touchmove', () => dragging = true)
        .on('touchend', (d, i) => {
            return dragging ? null : highlightNode(d, i)
        })

}

// draw all three interactives

drawSportsCost($('#sports-cost'))
drawUsTravel($('#us-travel'))
drawHdi($('#hdi'))