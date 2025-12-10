//Defining html sections for later
const detailDashContainer = d3.select("#dash");

const dashHeader = d3.select("#Dash-header")

//"Turn off" dash when hitting close button
d3.select("#close-chart-button").on("click", function() {
    detailDashContainer.classed("is-visible", false);
    });

//Change color of dropdown when you hover over it
function overSelect(event) {
    d3.select(this).style("background-color", "#f3f4f6");
}
function offSelect(event) {
    d3.select(this).style("background-color", "#ffffff");
}
let selectDrop = d3.select("#dropdown-selector")
    .on("mouseover", overSelect)
    .on("mouseleave", offSelect)

//Hexbin Map SVG
const svg = d3.select("#hexbinmap"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

//Map and projection
const projection = d3.geoMercator()
    .scale(500) // This is the zoom
    .translate([1210, 650]); // You have to play with these values to center your map

//Path generator
const path = d3.geoPath()
    .projection(projection)

//Tooltip for hexbin map
let tooltip = d3.select("#maingraphic")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("border-color", "#2a326e")
    .style("padding", "5px")
    .style("font-size", 10)
    .style("fill", "#2a326e")
    .style("position", "absolute");

let mouseover = function(event, d) {
    tooltip.style("opacity", 1)
    d3.select(this).style("cursor", "pointer");
};
let mousemove = function(event, d) {
    const childPop = 72500000
    //tooltip depends on version of map you're looking at
    if (currentDataKey === 'default') {
        message = "This cell represents " + `<strong>${((d.properties.CHILD_POP)/725000).toFixed(2)}%</strong>` + " of American children.";
    } else if (currentDataKey === 'R_Rank') {
        if (d.properties.R_Rank === null) {
            message = "Not Ranked"
        } else {
        message = "Rank:" + `${d.properties.R_Rank}`;
        }
    } else {
        message = "Rank:" + `${d.properties.Qual_Rank}`
    }
    tooltip
    .html(message)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px")
};
let mouseleave = function(d) {
    tooltip.style("opacity", 0)
    d3.select(this).style("cursor", "default");
};

//Which color of the map we're looking at presently
let currentDataKey = 'default';

/* I'm sure there's a more elegant way to do this, but this takes the childcare
type and produces a data structure with correct labels, etc*/
function getCostKeys(type) {
    if (type === "CENTER") {
        return [["ADJ_CENTER_INFANT_COST", 
        "ADJ_CENTER_TODDLER_COST", 
        "ADJ_CENTER_PRESCHOOL_COST", 
        "ADJ_CENTER_SCHOOLAGE_COST"], {"ADJ_CENTER_INFANT_COST":"Infant", 
        "ADJ_CENTER_TODDLER_COST":"Toddler", 
        "ADJ_CENTER_PRESCHOOL_COST":"Preschool", 
        "ADJ_CENTER_SCHOOLAGE_COST":"School Age"}, {"CENTER": "Center"}];
    } else {
        return [["ADJ_FAMILY_INFANT_COST", 
        "ADJ_FAMILY_TODDLER_COST", 
        "ADJ_FAMILY_PRESCHOOL_COST", 
        "ADJ_FAMILY_SCHOOLAGE_COST"], {"ADJ_FAMILY_INFANT_COST":"Infant", 
        "ADJ_FAMILY_TODDLER_COST":"Toddler", 
        "ADJ_FAMILY_PRESCHOOL_COST":"Preschool", 
        "ADJ_FAMILY_SCHOOLAGE_COST":"School Age"}, {"FAMILY": "Family"}];
    }
;}

//Define a format for percentage tickmarks
const customTick = (d) => `${parseInt(d*100)}%`;

function renderExtraLine() {
    const barExtra = d3.select("#dhhs-expl")
        .attr("width", 85)
        .attr("height", 410)
        .attr("viewBox", "0 0 85 410");

    barExtra.selectAll("*").remove();
    
    const yScale = d3.scaleLinear()
        .domain([0, 0.26]) // e.g. Max cost share 30%
        .range([355, 70]); // within chart container

    barExtra.append("line")
        .attr('class', 'dhhs-marker')
        .attr('x1', 0)
        .attr('y1', yScale(.07))
        .attr('x2', 85)
        .attr('y2', yScale(.07))
        .style('stroke', 'black')
        .style("stroke-dasharray", ("3, 3"))
        .attr("stroke-width", 2);

    barExtra
        .append("text")
        .style("fill", "#2a326e")
        .attr("text-anchor", "middle")
        .attr("x", 12)
        .attr("y", yScale(.07) - 45)
        .append("tspan")
        .text("US HHS")
        .attr("x", 40) // Set x-coordinate for the first line
        .append("tspan")
        .attr("x", 40) // Set x-coordinate for subsequent lines to align them
        .attr("dy", "1.2em") // Offset the y-coordinate for the next line
        .text("Budgetary")
        .append("tspan")
        .attr("x", 40)
        .attr("dy", "1.2em")
        .text("Suggestion");
}

function renderDetailChart(stateDataProperties, stateName, type, id) {
    // Generate title for side dash
    dashHeader
    .html("2022 " + `${stateName}` + " at a Glance"
    )
    // Toggle dash to visible
    detailDashContainer.classed("is-visible", true);

    const detailBarContainer = d3.select(id)
        .attr("width", 200)
        .attr("height", 410)
        .attr("viewBox", "0 0 200 410");

    detailBarContainer.selectAll("*").remove();

    noDataStates = ["Arkansas", "New Mexico", "Vermont", "Indiana", "Pennsylvania", "Missouri"]

    const [costKeys, ageLabels, typeLabels] = getCostKeys(type)

    // Transform the properties object into an array for D3
    const chartData = costKeys.map(key => ({ 
        label: ageLabels[key], //key.replace('ADJ_'+ `${type}_`, '').replace('_COST', ''), // Clean up labels for display
        value: stateDataProperties[key]
    }));
    
    // Define Scales (adjust domains/ranges as necessary)
    const xScale = d3.scaleBand()
        .domain(chartData.map(d => d.label))
        .range([0, 140]) // within chart container
        .padding(0.1);

    detailBarContainer.append("g")
        .attr("class", "bar-x-axis")
        .attr("transform", `translate(30,${360})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")
        .style("fill", "#2a326e");

    const yScale = d3.scaleLinear()
        .domain([0, 0.26]) // e.g. Max cost share 30%
        .range([355, 70]); // within chart container

    detailBarContainer.append("g")
        .attr("class", "bar-y-axis")
        .call(d3.axisLeft(yScale).tickFormat(customTick))
        .attr("transform", `translate(30,0)`);

    function overBar(event, d) {
        d3.select(this).style("opacity", .8)
        console.log(`#${stateName}-` + `${type}-` + `${d.label}`)
        d3.select("#Rhode Island-CENTER-Infant").style("fill", "black")
        d3.select(`#${stateName}-` + `${type}-` + `${d.label}`)
            .style("opacity", 1);
    };

    function offBar(event, d) {
        d3.select(this).style("opacity", 1)
        d3.select(`#${stateName}-` + `${type}-` + `${d.label}`)
            .style("opacity", 0);
    };

    badTextSolution = {"CENTER": {"text": "Cost to Send One Child", "x1":32, "x2": 82, "y":12, "sub": "of State Median"}, 
                    "FAMILY": {"text": "to Daycare Expressed as %", "x1":0, "x2": 0, "y":12, "sub": "Household Income"}}

    if (noDataStates.includes(stateName) || (stateName === "Mississippi" & type === "FAMILY")) {
        detailBarContainer
            .append("circle")
            .attr("cx", 110)
            .attr("cy", 190)
            .attr("r", 0)
            .style("fill", "rgb(0, 0, 0)")
            .style("opacity", .1)
        
        detailBarContainer.selectAll("circle")
            .transition()
            .duration(800)
            .attr("r", 60)
        

        detailBarContainer
            .append("text")
            .style("fill", "#2a326e")
            .attr("text-anchor", "middle")
            .attr("x", 110)
            .attr("y", 180)
            .append("tspan")
            .text("No pricing data")
            .attr("x", 110) // Set x-coordinate for the first line
            .append("tspan")
            .attr("x", 110) // Set x-coordinate for subsequent lines to align them
            .attr("dy", "1.2em") // Offset the y-coordinate for the next line
            .text("available for")
            .append("tspan")
            .attr("x", 110)
            .attr("dy", "1.2em")
            .text(`${stateName}.`);
    
        if (stateName === "Mississippi") {
            detailBarContainer
                .append("text")
                .style("fill", "#2a326e")
                .attr("class", "bad-text-title")
                .attr("x", badTextSolution[type]["x1"])
                .attr("y", badTextSolution[type]["y"])
                .append("tspan")
                .text(`${badTextSolution[type]["text"]}`)
                .attr("x", badTextSolution[type]["x1"])
                .append("tspan")
                .attr("x", badTextSolution[type]["x2"])
                .attr("dy", "1.2em")
                .text(`${badTextSolution[type]["sub"]}`)

            detailBarContainer.append("line")
                .attr('class', 'dhhs-marker')
                .attr('x1', 0)
                .attr('y1', yScale(.07))
                .attr('x2', 200)
                .attr('y2', yScale(.07))
                .style('stroke', 'black')
                .style("stroke-dasharray", ("3, 3"))
                .attr("stroke-width", 2)
                .style('fill', "#2a326e");
            
            extraLine = d3.select("#dhhs-expl")
                .style("visibility", "visible");
        } else {
        extraLine = d3.select("#dhhs-expl")
            .style("visibility", "hidden");}
    } else {
    
    extraLine = d3.select("#dhhs-expl")
            .style("visibility", "visible")

    //bad title solution
    detailBarContainer
        .append("text")
        .style("fill", "#2a326e")
        .attr("class", "bad-text-title")
        .attr("x", badTextSolution[type]["x1"])
        .attr("y", badTextSolution[type]["y"])
        .append("tspan")
        .text(`${badTextSolution[type]["text"]}`)
        .attr("x", badTextSolution[type]["x1"])
        .append("tspan")
        .attr("x", badTextSolution[type]["x2"])
        .attr("dy", "1.2em")
        .text(`${badTextSolution[type]["sub"]}`)

    // Add Title
    detailBarContainer
        .append("text")
        .style("fill", "#2a326e")
        .attr("x", 100)
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .text(`${typeLabels[type]}` + "-based Care");

    let hoverLabelGroup = detailBarContainer.append("g")
        .attr("class", "hover-label-group");

    hoverLabelGroup.selectAll("text")
        .data(chartData)
        .join("text")
        .style("fill", "#2a326e")
        .attr("id", (d, i) => `${stateName}-` + `${type}-` + `${d.label}`)
        .attr("class", "bar-val")
        .attr("text-anchor", "middle")
        .attr("x", d => xScale(d.label) + 45)
        .attr("y", d => yScale(d.value) + 20)
        .text(d => `${parseInt(d.value*100)}%`)
        .style("fill", "white")
        .style('opacity', 0);

    // Draw the bars
    detailBarContainer.selectAll(".detail-bar")
        .data(chartData)
        .enter().append("rect")
        .attr("class", "detail-bar")
        .attr("x", d => xScale(d.label) + 30) // Offset for margin
        .attr("y", 355) // Offset for title/margin
        .attr("width", xScale.bandwidth())
        .attr("height", 0) // Assuming 100px main chart area height
        .attr("fill", "#5f68b0")
            .on("mouseover", overBar)
            .on("mouseleave", offBar)

    detailBarContainer.selectAll("rect")
        .transition()
        .duration(800)
        .attr("y", d => yScale(d.value))
        .attr("height", d => 359 - yScale(d.value))
        .delay(function(d,i){return(i*100)})

    detailBarContainer.append("line")
        .attr('class', 'dhhs-marker')
        .attr('x1', 0)
        .attr('y1', yScale(.07))
        .attr('x2', 200)
        .attr('y2', yScale(.07))
        .style('stroke', 'black')
        .style("stroke-dasharray", ("3, 3"))
        .style('fill', "#2a326e")
        .attr("stroke-width", 2);
    }
}

function initializeMap(data) {
    function updateMapColors(newKey, data) {
        currentDataKey = newKey;
        
        if (currentDataKey === 'default') {
            minVal = 1;
            maxVal = 3;
        } else {
            let newValues = data.map(d => d.properties[currentDataKey]);
            minVal = d3.min(newValues);
            maxVal = d3.max(newValues);
        };

        domvals = [minVal, maxVal]

        colorScale.domain([minVal, maxVal]);

        if (newKey === 'default') {
            colors = ["#5f68b0", "#5f68b0"]
            colorScale.range(colors);
        } else if (newKey === 'R_Rank') {
            colors = ["#1c5fed", "#8de3db"] //#43d7c8
            colorScale.range(colors);
        } else {
            colors = ["#8618ad", "#fc5dad"] //#fc5dc7
            colorScale.range(colors);
        }

        d3.selectAll(".state_hex")
            .transition()
            .duration(500)
            .style("fill", function(d) {
                if (newKey === 'default') {
                    return "#5f68b0";
                } else {
                    const value = d.properties[currentDataKey];
                    return value ? colorScale(value) : "#a8adaa";
                };
            });

        if (currentDataKey != "default") {
            console.log(colors)

            legendGroup.selectAll("*").remove();

            legendGroup.append("text")
                .attr("class", "legend-tick")
                .attr("id", "legend-max")
                .attr("x", 695)
                .attr("y", 165)
                .transition()
                .duration(600)
                .text("Most")
                .style("fill", "#2a326e")
                .style("opacity", 1)

            legendGroup.append("text")
                .attr("class", "legend-tick")
                .attr("id", "legend-min")
                .attr("x", 695)
                .attr("y", 345)
                .transition()
                .duration(600)
                .text("Least")
                .style("fill", "#2a326e")
                .style("opacity", 1)

            grad = legendGroup.append('defs')
                .append('linearGradient')
                .attr('id', 'grad')
                .attr('x1', '0%')
                .attr('x2', '0%')
                .attr('y1', '0%')
                .attr('y2', '100%');

            grad.selectAll('stop')
                .data(colors)
                .enter()
                .append('stop')
                .style('stop-color', function(d){ console.log(d); return d; })
                .attr('offset', function(d,i){
                    return 100 * (i / (colors.length - 1)) + '%';
                });

            legendGroup.append('rect')
                .attr("id", "legend")
                .attr('x', 650)
                .attr('width', 40)
                .style('fill', 'url(#grad)')
                .transition()
                .duration(500)
                .attr('y', 150)
                .attr('height', 200)

            } else {
            d3.selectAll('.legend-tick')
                .transition()
                .duration(500)
                .style("opacity", 0)

            d3.select('#legend')
                .transition()
                .duration(500)
                .attr('y', 0)
                .attr("height", 0);
            }

        }

    const colorScale = d3.scaleLinear()
    
    // Draw the map
    svg.append("g")
      .attr("class", "hexagons")
      .selectAll("path")
      .data(data)
      .join("path")
          .attr("class", "state_hex")
          .attr("id", function(d, i) {return d.properties.STATE_NAME})
          .attr("fill", "#5f68b0")
          .attr("d", path)
          .attr("stroke", "white")
          .on("click", function(event, d) {
                renderDetailChart(d.properties, d.properties.STATE_NAME, 'CENTER', "#center-bar-svg");
                renderDetailChart(d.properties, d.properties.STATE_NAME, 'FAMILY', "#family-bar-svg");
                renderExtraLine();
            })
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseleave);

    // Add the labels
    svg.append("g")
      .attr("class", "state_labels")
      .selectAll("labels")
      .data(data)
      .join("text")
        .attr("class", "state_abbr")
        .attr("user-select", "none")
        .attr("x", function(d){return path.centroid(d)[0]})
        .attr("y", function(d){return path.centroid(d)[1]})
        .text(function(d){ return d.properties.iso3166_2})
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-size", 11)
        .style("fill", "#2a326e")
        .style("fill", "white")
        .on("click", function(event, d) {
            renderDetailChart(d.properties, d.properties.STATE_NAME, 'CENTER', "#center-bar-svg");
            renderDetailChart(d.properties, d.properties.STATE_NAME, 'FAMILY', "#family-bar-svg");
            renderExtraLine();
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    const legendGroup = svg.append("g")
    .attr("class", "legend-container");

    grad = legendGroup.append('defs')
        .append('linearGradient')
        .attr('id', 'grad')
        .attr('x1', '0%')
        .attr('x2', '0%')
        .attr('y1', '0%')
        .attr('y2', '100%');
    
    legendGroup.append("rect")
        .attr("id", "legend")
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', 0)

    // updates choropleth or lackthereof
    updateMapColors(currentDataKey, data);

    d3.select("#dropdown-selector")
        .on("change", function() {
        const selectedValue = d3.select(this).property("value");
        updateMapColors(selectedValue, data);
    });
}

//run it
d3.json("https://raw.githubusercontent.com/clleone/capp30239/refs/heads/main/Interactive%20Project/childcare.geojson").then(function(data){
    console.log("Inspecting properties of the first feature:", data.features[0].properties);
    initializeMap(data.features);
})