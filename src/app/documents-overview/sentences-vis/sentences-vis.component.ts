import {Component, OnInit, OnChanges, Input} from '@angular/core';
import * as d3 from 'd3';

@Component({
    selector: 'app-sentences-vis',
    templateUrl: './sentences-vis.component.html',
    styleUrls: ['./sentences-vis.component.css']
})
export class SentencesVisComponent implements OnInit, OnChanges {

    selectedSentence = "";
    @Input()
    sentences = [];

    constructor() {
    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        const sentences: SimpleChange = changes.sentences;
        this.updateSentences(sentences.currentValue);
    }

    updateSentences(sentences) {
        var that = this;
        var margin = {top: 20, right: 20, bottom: 20, left: 50},
            width = 700 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        d3.selectAll("#sentences-vis").remove();
        var svg = d3.select("#sentences-vis-box").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "sentences-vis")
            .append("g")
            .attr("transform", "translate("
                + margin.left + "," + margin.top + ")");

        var data = [];
        for (var i = 0; i < sentences.length; i++) {
            data.push(sentences[i].length);
        }

        // set the ranges
        var x = d3.scaleBand()
            .range([0, width])
            .padding(0.2);
        var y = d3.scaleLinear()
            .range([height, 0]);

        // Scale the range of the data in the domains
        x.domain(data.map(function (d, i) {
            return i;
        }));
        y.domain([0, d3.max(data, function (d) {
            return d;
        })]);

        // append the rectangles for the bar chart
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "sentence-bar")
            .attr("x", function (d, i) {
                return x(i);
            })
            .attr("width", x.bandwidth())
            .attr("y", function (d) {
                return y(d);
            })
            .attr("height", function (d) {
                return height - y(d);
            })
            .on("mouseover", function (d, i) {
                that.selectedSentence = that.sentences[i];
            });
    }

    ngAfterContentInit() {

    }

}
