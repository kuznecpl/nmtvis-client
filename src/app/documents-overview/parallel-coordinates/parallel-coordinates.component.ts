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

    metricDisplayName = {
        "confidence": "Confidence",
        "coverage_deviation_penalty": "Coverage Deviation Penalty",
        "keyphrase_score": "Keyphrases",
        "order_id": "Document Order",
        "ap_in": "AP in",
        "ap_out": "AP out",
        "coverage_penalty": "Coverage Penalty",
        "length": "Sentence Length"
    }

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

        var margin = {top: 30, right: 10, bottom: 20, left: -70},
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
        var metrics = ["confidence", "length", "keyphrase_score", "order_id", "coverage_penalty"];
        // Extract the list of dimensions and create a scale for each.
        dimensions = metrics // d3.keys(sentences[0].score)
            .filter(function (d) {
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
        /*
         .style("stroke", function (d) {
         return d.score["confidence"] > 0.7 ? "#42a5f5" : "#ef5350";
         });*/
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
                return that.metricDisplayName[d];
            })


        var triangleMap = {false: "0,0 8,8 16,0", true: "0,8 16,8 8,0"};

        var sortGroup = axisGroup
            .append("g")
            .attr("transform", "translate(-7, 125)");
        var sortIcon = this.createSortIcon(sortGroup, true);
        sortIcon.on("click", function (d) {
            if (d3.select(this).classed("active-sort-icon")) {
                sortDirectionMap[d] = !sortDirectionMap[d];
            }
            that.onSortMetric.emit([d, sortDirectionMap[d]]);
            d3.select(".active-sort-icon").classed("active-sort-icon", false);
            d3.select(this).classed("active-sort-icon", true);
            that.switchSortIcon(d3.select(this), sortDirectionMap[d]);
        })

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

    switchSortIcon(parent, ascending) {
        parent.selectAll("path").remove();
        var arrow = "M196.54,401.991h-54.817V9.136c0-2.663-0.854-4.856-2.568-6.567C137.441,0.859,135.254,0,132.587,0H77.769c-2.663,0-4.856,0.855-6.567,2.568c-1.709,1.715-2.568,3.905-2.568,6.567v392.855H13.816c-4.184,0-7.04,1.902-8.564,5.708c-1.525,3.621-0.855,6.95,1.997,9.996l91.361,91.365c2.094,1.707,4.281,2.562,6.567,2.562c2.474,0,4.665-0.855,6.567-2.562l91.076-91.078c1.906-2.279,2.856-4.571,2.856-6.844c0-2.676-0.859-4.859-2.568-6.584C201.395,402.847,199.208,401.991,196.54,401.991z";
        let s1 = "M333.584,438.536h-73.087c-2.666,0-4.853,0.855-6.567,2.573c-1.709,1.711-2.568,3.901-2.568,6.564v54.815c0,2.673,0.855,4.853,2.568,6.571c1.715,1.711,3.901,2.566,6.567,2.566h73.087c2.666,0,4.856-0.855,6.563-2.566c1.718-1.719,2.563-3.898,2.563-6.571v-54.815c0-2.663-0.846-4.854-2.563-6.564C338.44,439.392,336.25,438.536,333.584,438.536z";
        let s2 = "M388.4,292.362H260.494c-2.666,0-4.853,0.855-6.567,2.566c-1.71,1.711-2.568,3.901-2.568,6.563v54.823c0,2.662,0.855,4.853,2.568,6.563c1.714,1.711,3.901,2.566,6.567,2.566H388.4c2.666,0,4.855-0.855,6.563-2.566c1.715-1.711,2.573-3.901,2.573-6.563v-54.823c0-2.662-0.858-4.853-2.573-6.563C393.256,293.218,391.066,292.362,388.4,292.362z";
        let s4 = "M504.604,2.568C502.889,0.859,500.702,0,498.036,0H260.497c-2.666,0-4.853,0.855-6.567,2.568c-1.709,1.715-2.568,3.905-2.568,6.567v54.818c0,2.666,0.855,4.853,2.568,6.567c1.715,1.709,3.901,2.568,6.567,2.568h237.539c2.666,0,4.853-0.855,6.567-2.568c1.711-1.714,2.566-3.901,2.566-6.567V9.136C507.173,6.473,506.314,4.279,504.604,2.568z";
        let s3 = "M443.22,146.181H260.494c-2.666,0-4.853,0.855-6.567,2.57c-1.71,1.713-2.568,3.9-2.568,6.567v54.816c0,2.667,0.855,4.854,2.568,6.567c1.714,1.711,3.901,2.57,6.567,2.57H443.22c2.663,0,4.853-0.855,6.57-2.57c1.708-1.713,2.563-3.9,2.563-6.567v-54.816c0-2.667-0.855-4.858-2.563-6.567C448.069,147.04,445.879,146.181,443.22,146.181z";

        let d1 = "M260.494,219.271H388.4c2.666,0,4.855-0.855,6.563-2.57c1.715-1.713,2.573-3.9,2.573-6.567v-54.816c0-2.667-0.858-4.854-2.573-6.567c-1.708-1.711-3.897-2.57-6.563-2.57H260.494c-2.666,0-4.853,0.855-6.567,2.57c-1.71,1.713-2.568,3.9-2.568,6.567v54.816c0,2.667,0.855,4.854,2.568,6.567C255.641,218.413,257.828,219.271,260.494,219.271z";
        let d2 = "M260.497,73.089h73.087c2.666,0,4.856-0.855,6.563-2.568c1.718-1.714,2.563-3.901,2.563-6.567V9.136c0-2.663-0.846-4.853-2.563-6.567C338.44,0.859,336.25,0,333.584,0h-73.087c-2.666,0-4.853,0.855-6.567,2.568c-1.709,1.715-2.568,3.905-2.568,6.567v54.818c0,2.666,0.855,4.853,2.568,6.567C255.645,72.23,257.831,73.089,260.497,73.089z";
        let d3 = "M504.604,441.109c-1.715-1.718-3.901-2.573-6.567-2.573H260.497c-2.666,0-4.853,0.855-6.567,2.573c-1.709,1.711-2.568,3.901-2.568,6.564v54.815c0,2.673,0.855,4.853,2.568,6.571c1.715,1.711,3.901,2.566,6.567,2.566h237.539c2.666,0,4.853-0.855,6.567-2.566c1.711-1.719,2.566-3.898,2.566-6.571v-54.815C507.173,445.011,506.314,442.82,504.604,441.109z";
        let d4 = "M260.494,365.445H443.22c2.663,0,4.853-0.855,6.57-2.566c1.708-1.711,2.563-3.901,2.563-6.563v-54.823c0-2.662-0.855-4.853-2.563-6.563c-1.718-1.711-3.907-2.566-6.57-2.566H260.494c-2.666,0-4.853,0.855-6.567,2.566c-1.71,1.711-2.568,3.901-2.568,6.563v54.823c0,2.662,0.855,4.853,2.568,6.563C255.641,364.59,257.828,365.445,260.494,365.445z";

        parent.append("path").attr("d", arrow);

        if (!ascending) {
            parent.append("path").attr("d", s1)
            parent.append("path").attr("d", s2);
            parent.append("path").attr("d", s3);
            parent.append("path").attr("d", s4);
        } else {
            parent.append("path").attr("d", d1)
            parent.append("path").attr("d", d2);
            parent.append("path").attr("d", d3);
            parent.append("path").attr("d", d4);
        }

    }

    createSortIcon(parent, ascending) {
        var g = parent.append("g").attr("transform", "scale(0.03)").classed("sort-icon", true);

        var arrow = "M196.54,401.991h-54.817V9.136c0-2.663-0.854-4.856-2.568-6.567C137.441,0.859,135.254,0,132.587,0H77.769c-2.663,0-4.856,0.855-6.567,2.568c-1.709,1.715-2.568,3.905-2.568,6.567v392.855H13.816c-4.184,0-7.04,1.902-8.564,5.708c-1.525,3.621-0.855,6.95,1.997,9.996l91.361,91.365c2.094,1.707,4.281,2.562,6.567,2.562c2.474,0,4.665-0.855,6.567-2.562l91.076-91.078c1.906-2.279,2.856-4.571,2.856-6.844c0-2.676-0.859-4.859-2.568-6.584C201.395,402.847,199.208,401.991,196.54,401.991z";
        let s1 = "M333.584,438.536h-73.087c-2.666,0-4.853,0.855-6.567,2.573c-1.709,1.711-2.568,3.901-2.568,6.564v54.815c0,2.673,0.855,4.853,2.568,6.571c1.715,1.711,3.901,2.566,6.567,2.566h73.087c2.666,0,4.856-0.855,6.563-2.566c1.718-1.719,2.563-3.898,2.563-6.571v-54.815c0-2.663-0.846-4.854-2.563-6.564C338.44,439.392,336.25,438.536,333.584,438.536z";
        let s2 = "M388.4,292.362H260.494c-2.666,0-4.853,0.855-6.567,2.566c-1.71,1.711-2.568,3.901-2.568,6.563v54.823c0,2.662,0.855,4.853,2.568,6.563c1.714,1.711,3.901,2.566,6.567,2.566H388.4c2.666,0,4.855-0.855,6.563-2.566c1.715-1.711,2.573-3.901,2.573-6.563v-54.823c0-2.662-0.858-4.853-2.573-6.563C393.256,293.218,391.066,292.362,388.4,292.362z";
        let s4 = "M504.604,2.568C502.889,0.859,500.702,0,498.036,0H260.497c-2.666,0-4.853,0.855-6.567,2.568c-1.709,1.715-2.568,3.905-2.568,6.567v54.818c0,2.666,0.855,4.853,2.568,6.567c1.715,1.709,3.901,2.568,6.567,2.568h237.539c2.666,0,4.853-0.855,6.567-2.568c1.711-1.714,2.566-3.901,2.566-6.567V9.136C507.173,6.473,506.314,4.279,504.604,2.568z";
        let s3 = "M443.22,146.181H260.494c-2.666,0-4.853,0.855-6.567,2.57c-1.71,1.713-2.568,3.9-2.568,6.567v54.816c0,2.667,0.855,4.854,2.568,6.567c1.714,1.711,3.901,2.57,6.567,2.57H443.22c2.663,0,4.853-0.855,6.57-2.57c1.708-1.713,2.563-3.9,2.563-6.567v-54.816c0-2.667-0.855-4.858-2.563-6.567C448.069,147.04,445.879,146.181,443.22,146.181z";

        let d1 = "M260.494,219.271H388.4c2.666,0,4.855-0.855,6.563-2.57c1.715-1.713,2.573-3.9,2.573-6.567v-54.816c0-2.667-0.858-4.854-2.573-6.567c-1.708-1.711-3.897-2.57-6.563-2.57H260.494c-2.666,0-4.853,0.855-6.567,2.57c-1.71,1.713-2.568,3.9-2.568,6.567v54.816c0,2.667,0.855,4.854,2.568,6.567C255.641,218.413,257.828,219.271,260.494,219.271z";
        let d2 = "M260.497,73.089h73.087c2.666,0,4.856-0.855,6.563-2.568c1.718-1.714,2.563-3.901,2.563-6.567V9.136c0-2.663-0.846-4.853-2.563-6.567C338.44,0.859,336.25,0,333.584,0h-73.087c-2.666,0-4.853,0.855-6.567,2.568c-1.709,1.715-2.568,3.905-2.568,6.567v54.818c0,2.666,0.855,4.853,2.568,6.567C255.645,72.23,257.831,73.089,260.497,73.089z";
        let d3 = "M504.604,441.109c-1.715-1.718-3.901-2.573-6.567-2.573H260.497c-2.666,0-4.853,0.855-6.567,2.573c-1.709,1.711-2.568,3.901-2.568,6.564v54.815c0,2.673,0.855,4.853,2.568,6.571c1.715,1.711,3.901,2.566,6.567,2.566h237.539c2.666,0,4.853-0.855,6.567-2.566c1.711-1.719,2.566-3.898,2.566-6.571v-54.815C507.173,445.011,506.314,442.82,504.604,441.109z";
        let d4 = "M260.494,365.445H443.22c2.663,0,4.853-0.855,6.57-2.566c1.708-1.711,2.563-3.901,2.563-6.563v-54.823c0-2.662-0.855-4.853-2.563-6.563c-1.718-1.711-3.907-2.566-6.57-2.566H260.494c-2.666,0-4.853,0.855-6.567,2.566c-1.71,1.711-2.568,3.901-2.568,6.563v54.823c0,2.662,0.855,4.853,2.568,6.563C255.641,364.59,257.828,365.445,260.494,365.445z";

        g.append("path").attr("d", arrow);

        if (!ascending) {
            g.append("path").attr("d", s1)
            g.append("path").attr("d", s2);
            g.append("path").attr("d", s3);
            g.append("path").attr("d", s4);
        } else {
            g.append("path").attr("d", d1)
            g.append("path").attr("d", d2);
            g.append("path").attr("d", d3);
            g.append("path").attr("d", d4);
        }

        return g;
    }

    ngAfterViewInit() {

    }
}

