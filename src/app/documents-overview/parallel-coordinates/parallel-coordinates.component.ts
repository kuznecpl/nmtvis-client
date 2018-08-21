import {Component, OnInit, AfterViewInit, Input, Output, OnChanges, EventEmitter} from '@angular/core';
import * as d3 from 'd3';
import cloneElement = __React.cloneElement;

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
    @Input()
    topics;
    @Input()
    hoverTopic;
    @Output()
    selectedSentenceChange = new EventEmitter<string>();
    @Output()
    onSelectionChange = new EventEmitter<any>();
    @Output()
    onSortMetric = new EventEmitter<any>();
    @Output()
    onSentenceSelection = new EventEmitter<any>();

    svg;
    foreground;
    background;
    y;

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

        if (changes.topics) {
            this.topics = changes.topics.currentValue;
            this.onTopicsChange();
        }
        if (changes.sentences) {
            this.updateSentences(sentences.currentValue);
        }
        if (changes.selectedSentence) {
            d3.select('.selected-line').classed('selected-line', false);
            if (!changes.selectedSentence.currentValue) {
                return;
            }
            let id = changes.selectedSentence.currentValue.id;
            d3.select('#line-' + id).classed("selected-line", true).moveToFront();
        }
        if (changes.hoverTopic) {
            var currValue = changes.hoverTopic.currentValue;
            this.onTopicHover(currValue);

        }
    }

    updateSentences(sentences) {
        if (!sentences || sentences.length == 0) {
            return;
        }

        var margin = {top: 30, right: 10, bottom: 20, left: -90},
            width = 1000 - margin.left - margin.right,
            height = 170 - margin.top - margin.bottom;

        d3.selectAll('#parallel-coordinates-box svg').remove();
        var svg = d3.select("#parallel-coordinates-box").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        this.svg = svg;
        this.background = svg.append("g")
            .attr("class", "background");
        this.foreground = svg.append("g")
            .attr("class", "foreground");

        var x = d3.scalePoint().range([0, width]).padding(1),
            y = {},
            dragging = {};

        var line = d3.line(),
            axis = d3.axisLeft();

        var that = this;

        var dimensions;
        var sortDirectionMap = {};
        // Extract the list of dimensions and create a scale for each.
        dimensions = d3.keys(sentences[0].score).filter(function (d) {
            var extent = d3.extent(sentences, function (p) {
                return +p.score[d];
            });
            y[d] = d3.scaleLinear()
                .domain(extent)
                .range([height, 0]);
            sortDirectionMap[d] = true;
            return true;
        });
        this.y = y;

        x.domain(dimensions);

        // Add grey background lines for context.
        var background = svg.append("g")
            .attr("class", "background").selectAll("path")
            .data(sentences, function (d) {
                return d.id;
            })
            .enter()
            .append("path")
            .attr("d", path);
        background.exit().remove();

        // Add blue foreground lines for focus.
        var foreground = svg.append("g")
            .attr("class", "foreground").selectAll("path")
            .data(sentences, function (d) {
                return d.id;
            })
            .enter()
            .append("path")
            .attr("d", path)
            .attr("id", function (d) {
                return "line-" + d.id;
            })
            .on("mouseover", function (d) {
                d3.select('.selected-line').classed('selected-line', false);
                d3.select('#line-' + d.id).classed("selected-line", true).moveToFront();
                that.onSentenceSelection.emit(d.id);
                that.selectedSentenceChange.emit(d);
            });
        that.foreground = foreground;
        that.background = background;
        //var foregroundUpdate = foregroundEnter.merge(foreground);

        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions, function (d) {
                return d;
            })
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
        var axisGroup = g.append("g")
            .attr("class", "axis")
            .each(function (d) {
                d3.select(this).call(axis.scale(y[d]).ticks(5));
            });
        axisGroup.append("text")
            .style("text-anchor", "middle")
            .style("fill", "black")
            .attr("y", -9)
            .style("font-size", "12px")
            .classed("title", true)
            .text(function (d) {
                return d;
            })


        var triangleMap = {false: "0,0 8,8 16,0", true: "0,8 16,8 8,0"};

        axisGroup
            .append("g")
            .attr("transform", "translate(-7, 125)")
            .append("polygon")
            .attr("points", function (d) {
                return triangleMap[sortDirectionMap[d]];
            })
            .on("click", function (d) {
                that.onSortMetric.emit([d, sortDirectionMap[d]]);
                sortDirectionMap[d] = !sortDirectionMap[d];
                d3.select(".selected-triangle").classed("selected-triangle", false);
                d3.select(this).attr("points", function (d) {
                    return triangleMap[sortDirectionMap[d]];
                }).classed("selected-triangle", true);
            });

        // Add and store a brush for each axis.
        axisGroup.append("g")
            .attr("class", "brush")
            .each(function (d) {
                d3.select(this).call(y[d].brush = d3.brushY()
                    .extent([[-7, y[d].range()[1]], [7, y[d].range()[0]]])
                    .on("start", brushstart)
                    .on("brush end", brush)
                );
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
                    }) && that.isTopicMatch(d);
                if (display) {
                    selected.push(d);
                }
                return display ? null : 'none';
            });
            background.style("display", function (d) {
                let display = that.isTopicMatch(d);
                return display ? null : 'none';
            });
            that.onSelectionChange.emit(selected);
        }
    }

    onTopicsChange() {
        var that = this;
        var actives = [];

        if (!this.svg) {
            return;
        }
        this.svg.selectAll(".brush")
            .filter(function (d) {
                return d3.brushSelection(this);
            })
            .each(function (d) {
                var extent = d3.brushSelection(this);
                var extent = [that.y[d].invert(extent[0]), that.y[d].invert(extent[1])];
                actives.push({
                    dimension: d,
                    extent: extent,
                });
            });

        var selected = [];

        this.foreground.style("display", function (d) {
            let display = actives.every(function (p) {
                    return p.extent[0] >= d.score[p.dimension] && d.score[p.dimension] >= p.extent[1];
                }) && that.isTopicMatch(d);
            return display ? null : 'none';
        });
        this.background.style("display", function (d) {
            let display = that.isTopicMatch(d);
            return display ? null : 'none';
        });
    }

    onTopicHover(topic) {
        var that = this;

        var that = this;
        var actives = [];

        if (!this.svg) {
            return;
        }
        this.svg.selectAll(".brush")
            .filter(function (d) {
                return d3.brushSelection(this);
            })
            .each(function (d) {
                var extent = d3.brushSelection(this);
                var extent = [that.y[d].invert(extent[0]), that.y[d].invert(extent[1])];
                actives.push({
                    dimension: d,
                    extent: extent,
                });
            });

        var selected = [];

        this.foreground.style("display", function (d) {
            let display = actives.every(function (p) {
                    return p.extent[0] >= d.score[p.dimension] && d.score[p.dimension] >= p.extent[1];
                }) && that.isTopicMatch(d) && (topic ? that.isMatch(topic, d) : true);
            return display ? null : 'none';
        });

    }

    isMatch(topic, sentence) {
        return sentence.source.replace(/@@ /g, "").trim().toLowerCase().indexOf(topic.name.toLowerCase()) >= 0;
    }

    isTopicMatch(sentence) {
        for (let topic of this.topics) {
            if (topic.active && sentence.source.replace(/@@ /g, "").trim().toLowerCase().indexOf(topic.name.toLowerCase()) < 0) {
                return false;
            }
        }
        return true;
    }


    ngAfterViewInit() {

    }
}

