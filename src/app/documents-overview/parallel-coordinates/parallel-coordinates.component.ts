import {Component, OnInit, AfterViewInit, Input, Output, OnChanges, EventEmitter} from '@angular/core';
import * as d3 from 'd3';

@Component({
    selector: 'app-parallel-coordinates',
    templateUrl: './parallel-coordinates.component.html',
    styleUrls: ['./parallel-coordinates.component.css']
})
export class ParallelCoordinatesComponent implements OnInit, AfterViewInit, OnChanges {

    @Input()
    sentences = [];
    @Input()
    selectedSentence;
    @Output()
    onSelectionChange = new EventEmitter<any>();

    constructor() {
    }

    ngOnInit() {
        d3.selection.prototype.moveToFront = function () {
            return this.each(function () {
                this.parentNode.appendChild(this);
            });
        };
    }

    ngOnChanges(changes: SimpleChanges) {
        const sentences: SimpleChange = changes.sentences;

        if (changes.sentences) {
            this.updateSentences(sentences.currentValue);
        }
        if (changes.selectedSentence) {
            console.log("change")
            if (!changes.selectedSentence.currentValue) {
                return;
            }
            let id = changes.selectedSentence.currentValue.id;
            d3.select('.selected-line').classed('selected-line', false);
            d3.select('#line-' + id).classed("selected-line", true).moveToFront();
        }
    }

    updateSentences(sentences) {
        if (!sentences || sentences.length == 0) {
            return;
        }

        var that = this;

        var margin = {top: 30, right: 10, bottom: 10, left: 10},
            width = 960 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        var x = d3.scalePoint().range([0, width]).padding(1),
            y = {},
            dragging = {};

        var line = d3.line(),
            axis = d3.axisLeft(),
            background,
            foreground;

        d3.select('svg').remove();
        var svg = d3.select("#parallel-coordinates-box").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var dimensions;
        // Extract the list of dimensions and create a scale for each.
        dimensions = d3.keys(sentences[0].score).filter(function (d) {
            var extent = d3.extent(sentences, function (p) {
                return +p.score[d];
            });
            y[d] = d3.scaleLinear()
                .domain(extent)
                .range([height, 0]);
            return true;
        })

        x.domain(dimensions);

        // Add grey background lines for context.
        background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(sentences)
            .enter().append("path")
            .attr("d", path);

        // Add blue foreground lines for focus.
        foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(sentences)
            .enter().append("path")
            .attr("d", path)
            .attr("id", function (d) {
                return "line-" + d.id;
            });

        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function (d) {
                return "translate(" + x(d) + ")";
            })
            .call(d3.drag()
                .subject(function (d) {
                    return {x: x(d)};
                })
                .on("start", function (d) {
                    dragging[d] = x(d);
                    background.attr("visibility", "hidden");
                })
                .on("drag", function (d) {
                    dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                    foreground.attr("d", path);
                    dimensions.sort(function (a, b) {
                        return position(a) - position(b);
                    });
                    x.domain(dimensions);
                    g.attr("transform", function (d) {
                        return "translate(" + position(d) + ")";
                    })
                })
                .on("end", function (d) {
                    delete dragging[d];
                    transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                    transition(foreground).attr("d", path);
                    background
                        .attr("d", path)
                        .transition()
                        .delay(500)
                        .duration(0)
                        .attr("visibility", null);
                }));

        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(y[d]).ticks(5));
            })
            .append("text")
            .style("text-anchor", "middle")
            .style("fill", "black")
            .attr("y", -9)
            .text(function (d) {
                console.log(d);
                return d;
            });

        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(y[d].brush = d3.brushY()
                    .extent([[-5, y[d].range()[1]], [5, y[d].range()[0]]])
                    .on("start", brushstart).on("brush", brush));
            })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);


        function position(d) {
            var v = dragging[d];
            return v == null ? x(d) : v;
        }

        function transition(g) {
            return g.transition().duration(500);
        }

        // Returns the path for a given data point.
        function path(d) {
            return line(dimensions.map(function (p) {
                return [position(p), y[p](d.score[p])];
                return [position(p), y[p](d.scored[p])];
            }));
        }

        function brushstart() {
            d3.event.sourceEvent.stopPropagation();
        }

        // Handles a brush event, toggling the display of foreground lines.
        function brush() {
            var actives = [];
            svg.selectAll(".brush")
                .filter(function (d) {
                    return d3.brushSelection(this);
                })
                .each(function (d) {
                    var extent = d3.brushSelection(this);
                    var extent = [y[d].invert(extent[0]), y[d].invert(extent[1])];
                    actives.push({
                        dimension: d,
                        extent: extent,
                    });
                });

            var selected = [];
            foreground.style("display", function (d) {
                let display = actives.every(function (p) {
                    return p.extent[0] >= d.score[p.dimension] && d.score[p.dimension] >= p.extent[1];
                });
                if (display) {
                    selected.push(d);
                }
                return display ? null : 'none';
            });
            console.log(selected);
            that.onSelectionChange.emit(selected);
        }
    }


    ngAfterViewInit() {

    }
}

