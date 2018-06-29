import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import * as d3 from 'd3';
import {BeamNode} from './beam-node';

@Component({
    selector: 'app-sentence-view',
    templateUrl: './sentence-view.component.html',
    styleUrls: ['./sentence-view.component.css']
})

export class SentenceViewComponent implements OnInit {
    title = 'DNN Vis';
    sentence = [];
    translation = [];
    curr = [];
    heatmap = "";
    inputSentence = "";
    attention = [];
    loading = false;
    haveContent = false;
    sliderValues = [{word: "test", value: 0.2}, {word: "apple", value: 0.4}]
    translationIndex = 0;
    beamAttention = []
    partial = "";
    beamSize = 3;
    sentenceId;
    documentId;

    constructor(private http: HttpClient, private route: ActivatedRoute) {
    }

    ngOnInit() {

        this.route.paramMap.subscribe(params => {
            this.documentId = params.get("document_id");
            this.sentenceId = params.get("sentence_id");
            console.log("/" + this.documentId);
        });
    }

    ngAfterContentInit() {

    }

    beamSizeChange(event) {
        this.beamSize = event.target.value;
        this.http.post('http://46.101.224.19:5000/beamUpdate', {
            sentence: this.inputSentence,
            beam_size: event.target.value
        }).subscribe(data => {
            this.updateBeamGraph(data["beam"]);
        });
    }

    attentionChange(event, i) {
        var changedValue = event.value;
        var restValue = (1.0 - changedValue) / this.beamAttention.length;

        for (var j = 0; j < this.beamAttention.length; j++) {
            if (j != i) {
                this.beamAttention[j] = restValue;
            }
        }
    }

    onAttentionChange() {
        this.http.post('http://46.101.224.19:5000/attentionUpdate', {
            sentence: this.inputSentence,
            partial: this.partial,
            attention: this.beamAttention,
            beam_size: this.beamSize
        }).subscribe(data => {
            this.updateBeamGraph(data["beam"]);
        });
    }

    updateBeamGraph(treeData) {
        // Set the dimensions and margins of the diagram
        var margin = {top: 20, right: 90, bottom: 30, left: 90},
            width = 960 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        d3.selectAll("svg").remove();
        var svg = d3.select("#tree").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate("
                + margin.left + "," + margin.top + ")");

        var i = 0,
            duration = 750,
            root;

        // declares a tree layout and assigns the size
        var treemap = d3.tree<BeamNode>().size([height, width]);

        var colorScale = d3.scaleSequential(d3.interpolateReds)
            .domain([-3, 0])

        // Assigns parent, children, height, depth
        root = d3.hierarchy(treeData, function (d) {
            return d.children;
        });
        root.x0 = height / 2;
        root.y0 = 0;

        // Collapse after the second level
        //root.children.forEach(collapse);

        update(root);

        var that = this;

        function update(source) {

            // Assigns the x and y position for the nodes
            var treeData = treemap(root);

            // Compute the new tree layout.
            var nodes = treeData.descendants(),
                links = treeData.descendants().slice(1);

            nodes.forEach(function (d) {
                d.y = d.depth * 80
            });

            // ****************** Nodes section ***************************

            // Update the nodes...
            var node = svg.selectAll('g.node')
                .data(nodes, function (d: any) {
                    return d.id || (d.id = ++i);
                });

            // Enter any new modes at the parent's previous position.
            var nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", function (d) {
                    return "translate(" + source.y0 + "," + source.x0 + ")";
                })
                .on('click', click);

            // Add Circle for the nodes
            nodeEnter.append('circle')
                .attr('class', 'node')
                .attr('r', 1e-6)
                .style("fill", function (d) {
                    return colorScale(d.data.logprob);
                });

            // Add labels for the nodes
            nodeEnter.append('text')
                .attr("dy", "-.5em")
                .attr("x", function (d) {
                    return d.children ? -13 : 13;
                })
                .attr("text-anchor", function (d) {
                    return d.children ? "end" : "start";
                })
                .style("font-weight", "bold")
                .text(function (d) {
                    var logprob = d.data.logprob ? d.data.logprob.toString() : "";
                    return d.data.name;
                });

            // UPDATE
            var nodeUpdate = nodeEnter.merge(node);

            // Transition to the proper position for the node
            nodeUpdate.transition()
                .duration(duration)
                .attr("transform", function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                });

            // Update the node attributes and style
            nodeUpdate.select('circle.node')
                .attr('r', 10)
                .style("fill", function (d) {
                    return colorScale(d.data.logprob);
                })
                .attr('cursor', 'pointer');


            // Remove any exiting nodes
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function (d) {
                    return "translate(" + source.y + "," + source.x + ")";
                })
                .remove();

            // On exit reduce the node circles size to 0
            nodeExit.select('circle')
                .attr('r', 1e-6);

            // On exit reduce the opacity of text labels
            nodeExit.select('text')
                .style('fill-opacity', 1e-6);

            // ****************** links section ***************************

            // Update the links...
            var link = svg.selectAll('path.link')
                .data(links, function (d: any) {
                    return d.id;
                });

            // Enter any new links at the parent's previous position.
            var linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr('d', function (d) {
                    var o = {x: source.x0, y: source.y0}
                    return diagonal(o, o)
                });

            // UPDATE
            var linkUpdate = linkEnter.merge(link);

            // Transition back to the parent element position
            linkUpdate.transition()
                .duration(duration)
                .attr('d', function (d) {
                    return diagonal(d, d.parent)
                });

            // Remove any exiting links
            var linkExit = link.exit().transition()
                .duration(duration)
                .attr('d', function (d) {
                    var o = {x: source.x, y: source.y}
                    return diagonal(o, o)
                })
                .remove();

            // Store the old positions for transition.
            nodes.forEach(function (d: any) {
                d.x0 = d.x;
                d.y0 = d.y;
            });

            // Creates a curved (diagonal) path from parent to the child nodes
            function diagonal(s, d) {

                var path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

                return path
            }

            function getPath(d) {
                var path = [];

                while (d) {
                    path.push(d.data.name);
                    d = d.parent;
                }

                return path.reverse().join(" ");
            }

            // Toggle children on click.
            function click(d) {
                console.log(d);

                that.partial = getPath(d);

                if (d.data.attn) {
                    that.beamAttention = [];
                    that.beamAttention = d.data.attn[0].slice(0, that.sentence.length);
                    console.log(that.beamAttention);
                }
                update(d);
            }
        }
    }

    onClick() {
        console.log(this.inputSentence);
        this.inputSentence = this.inputSentence.toLowerCase();
        this.loading = true;
        this.http.post('http://46.101.224.19:5000', {sentence: this.inputSentence}).subscribe(data => {
            this.sentence = data["sentence"].split(" ");
            this.translation = data["translation"].replace("&apos;", "'").split(" ");
            this.attention = data["attention"];
            this.beamAttention = [1, 0, 0, 0]
            console.log(data);
            this.heatmap = "http://46.101.224.19:5000/heatmap?sentence=" + this.sentence;
            this.loading = false;
            this.haveContent = true;
            this.updateBeamGraph(data["beam"]);
        });
    }

    mouseEnter(event) {
        this.curr = this.attention[event];
    }

    getColor(i) {
        let colors = ["#ffcdd2", "#ef9a9a", "#e57373", "#EF5350", "#F44336", "#E53935", "#d32f2f"]
        let index = Math.round(this.curr[i] * (colors.length - 1));

        return colors[index];
    }
}
