import * as d3 from 'd3';
import {BeamNodeDialog} from './sentence-view.component';

export class BeamTree {

    treemap;
    root;
    svg;
    colorScale;
    colors;

    constructor(private treeData: any, private that: any) {

    }

    build() {
        var w = this.that.sentence.length * 90;
        // Set the dimensions and margins of the diagram
        var margin = {top: 20, right: 30, bottom: 30, left: 50},
            width = w - margin.left - margin.right,
            height = 300 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        d3.selectAll("#tree-vis").remove();
        this.svg = d3.select("#tree").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "tree-vis")
            .append("g")
            .attr("transform", "translate("
                + margin.left + "," + margin.top + ")");

        var i = 0,
            duration = 500,
            root;

        // declares a tree layout and assigns the size
        this.treemap = d3.tree<BeamNode>().size([height, width]).separation(function (a, b) {
            return a.parent == b.parent ? 2 : 3;
        });

        var colors = ["#2c7bb6", "#00a6ca", "#00ccbc", "#90eb9d", "#ffff8c", "#f9d057", "#f29e2e", "#e76818", "#d7191c"];

        this.colors = ['#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f'];
        var domain = [];
        for (var i = -3.0; i <= 0; i += 3.0 / (this.colors.length - 1)) {
            domain.push(i);
        }
        this.colorScale = d3.scaleLinear().domain(domain).range(this.colors).clamp(true);
        this.buildColorLegend();

        this.treeData.is_golden = true;

        // Assigns parent, children, height, depth
        this.root = d3.hierarchy(this.treeData, function (d) {
            return d.children;
        });
        this.root.x0 = height / 2;
        this.root.y0 = 0;

        // Collapse after the second level
        //root.children.forEach(collapse);

        this.update(this.root);

    }

    updateData(treeData) {
        this.treeData = treeData;
        // Assigns parent, children, height, depth
        this.root = d3.hierarchy(this.treeData, function (d) {
            return d.children;
        });
        this.root.x0 = height / 2;
        this.root.y0 = 0;
        this.update(this.root);
    }

    update(source) {

        // Assigns the x and y position for the nodes
        var treeData = this.treemap(this.root);
        var that = this.that;
        var beamTree = this;
        var duration = 400;

        // Compute the new tree layout.
        var nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);

        var scale = d3.scaleLinear().domain([1, 10]).range([30, 0]);

        nodes.forEach(function (d) {

            if (!d.children) {
                d.y = d.parent.y + 80 - scale(that.decodeText(d.data.name).length);
            } else if (d.parent) {
                d.y = d.parent.y + 80 - scale(that.decodeText(d.data.name).length);
            } else {
                d.y = 0;
            }
        });

        // ****************** Nodes section ***************************

        // Update the nodes...
        var node = this.svg.selectAll('g.node')
            .data(nodes, function (d: any) {
                return beamTree.getNodeId(d);
            });

        // Enter any new modes at the parent's previous position.
        var nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', function (d) {
                beamTree.click(d, this);
            })
            .on('mouseover', function (d) {
                beamTree.mouseover(d, this);
            })
            .on('mouseout', function (d) {
                beamTree.mouseout(d, this);
            });

        // Add Circle for the nodes
        nodeEnter.append('circle')
            .attr('class', function (d) {
                return "node";
            })
            .attr('r', 10)
            .style("fill", function (d) {
                return beamTree.colorScale(d.data.logprob);
            });

        // Add labels for the nodes
        nodeEnter.append('text')
            .attr("dy", "-.8em")
            .attr("x", function (d) {
                return -13;
            })
            .attr("text-anchor", function (d) {
                //return d.children ? "end" : "start";
                return "end";
            })
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .text(function (d) {
                var logprob = d.data.logprob ? d.data.logprob.toString() : "";

                var path = beamTree.getPath(d);
                if (path in that.correctionMap && that.correctionMap[path] === d.data.name) {
                    return that.decodeText(d.data.name) + "*";
                }

                return that.decodeText(d.data.name);
            });

        // UPDATE
        var nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            })
            .attr("text-anchor", function (d) {
                //return d.children ? "end" : "start";
                return "end";
            });

        nodeUpdate.select('text')
            .attr("x", function (d) {
                return -13;
            })
            .attr("text-anchor", function (d) {
                //return d.children ? "end" : "start";
                return "end";
            })
            .text(function (d) {
                var logprob = d.data.logprob ? d.data.logprob.toString() : "";

                var path = beamTree.getPath(d);
                if (path in that.correctionMap && that.correctionMap[path] === d.data.name) {
                    return that.decodeText(d.data.name) + "*";
                }

                return that.decodeText(d.data.name);
            });
        // Update the node attributes and style
        nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style("fill", function (d) {
                return beamTree.colorScale(d.data.logprob);
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
        var link = this.svg.selectAll('path.link')
            .data(links, function (d: any) {
                return beamTree.getNodeId(d);
            });

        // Enter any new links at the parent's previous position.
        var linkEnter = link.enter().insert('path', "g")
            .attr("class", function (d) {
                if (d.data.isCandidate) {
                    return "link candidate-link"
                } else if (d.data.is_golden) {
                    return "link golden-link";
                } else {
                    return "link";
                }
            })
            .attr('d', function (d) {
                var o = {x: source.x0, y: source.y0}
                return beamTree.diagonal(o, o)
            });

        // UPDATE
        var linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate
            .transition()
            .duration(duration)
            .attr("class", function (d) {
                if (d.data.isCandidate) {
                    return "link candidate-link"
                } else if (d.data.is_golden) {
                    return "link golden-link";
                } else {
                    return "link";
                }
            })
            .attr('d', function (d) {
                return beamTree.diagonal(d, d.parent)
            });

        // Remove any exiting links
        var linkExit = link.exit()
            .transition()
            .duration(duration)
            .attr('d', function (d) {
                var o = {x: source.x, y: source.y}
                return beamTree.diagonal(o, o)
            })
            .remove();

        // Store the old positions for transition.
        nodes.forEach(function (d: any) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

    }

    addToDocumentUnkMap(d, word) {
        var that = this.that;
        var maxWordIndex = this.getMaxAttnSourceWordIndex(d);
        var maxAttn = d.data.attn[0][maxWordIndex];
        var maxWord = that.sentence[maxWordIndex];

        if (maxAttn > 0.9) {
            if (!(maxWord in that.documentUnkMap)) {
                that.documentUnkMap[maxWord] = [];
            }
            if (that.documentUnkMap[maxWord].indexOf(word) === -1) {
                that.documentUnkMap[maxWord].push(word);
            }
        }
    }

    // Toggle children on click.
    click(d, el) {

        this.that.clicks += 1;

        if (d.data.name === "EOS" && !d.data.isCandidate) {
            this.resetGoldenHypothesisBeam(this.that.beam);
            this.setGoldenHypothesis(d);
            this.setGoldenHypothesisBeam(this.that.beam, this.getPathList(d));
            this.that.attention = this.getBeamAttention(d);
            this.that.translation = this.getTranslation(d);
            this.that.updateTranslation();
            return;
        }

        if (d.data.name === "EDIT") {
            var that = this.that;
            that.partial = this.getPath(d);

            d = d.parent;
            if (d.data.attn && d.data.attn[0]) {
                that.beamAttention = [];
                that.beamAttention = d.data.attn[0].slice(0, that.sentence.length);

                var dialogRef = that.dialog.open(BeamNodeDialog, {
                    width: "400px",
                    data: {
                        attention: that.beamAttention,
                        partial: that.partial,
                        sentence: that.sentence,
                        word: ""
                    },
                });

                dialogRef.afterClosed().subscribe(result => {
                    if (d.data.name === "UNK" && result.word.length > 0) {
                        this.addToDocumentUnkMap(d, result.word);

                        var partial = this.getPath(d);
                        that.unkMap[partial] = result.word;
                        that.onCorrectionChange(result.word);
                    }
                    else if (result.word.length > 0) {
                        that.correctionMap[that.partial] = result.word;
                        if (that.partial in that.unkMap) {
                            delete that.unkMap[that.partial];
                        }
                        that.onCorrectionChange(result.word);
                    } else {
                        that.attentionOverrideMap[that.partial] = that.beamAttention.slice();
                        that.onAttentionChange();
                    }
                });
            }
            this.update(d);
            return;
        }


        if (this.isCandidateNode(d) && d.parent && d.parent.data.name === "UNK") {
            // UNK replacement
            this.that.unkMap[this.getPath(d.parent)] = d.data.name;

            this.addToDocumentUnkMap(d.parent, d.data.name);

            this.that.onCorrectionChange(d.data.name);
        }
        else if (this.isCandidateNode(d)) {
            this.that.correctionMap[this.getPath(d)] = d.data.name;
            if (this.getPath(d) in this.that.unkMap) {
                delete this.that.unkMap[this.getPath(d)];
            }
            this.that.onCorrectionChange(d.data.name);
        } else if (this.hasCandidateNodes(d)) {
            this.removeCandidateNodes(d, el);
        } else {
            this.addCandidateNodes(d, el);
        }
    }

    getBeamNode(node, path) {
        if (path.length === 0) {
            return node;
        }
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i].name === path[0]) {
                return this.getBeamNode(node.children[i], path.slice(1));
            }
        }
    }

    isCandidateNode(d) {
        var beamNode = this.getBeamNode(this.treeData, this.getPathList(d).slice(1));
        return beamNode.isCandidate === true;
    }

    hasCandidateNodes(d) {
        var beamNode = this.getBeamNode(this.treeData, this.getPathList(d).slice(1));
        for (var i = 0; i < beamNode.children.length; i++) {
            if (beamNode.children[i].isCandidate) {
                return true;
            }
        }
        return false;
    }

    removeCandidateNodes(d, el) {
        var beamNode = this.getBeamNode(this.treeData, this.getPathList(d).slice(1));
        var children = [];

        for (var i = 0; i < beamNode.children.length; i++) {
            if (!beamNode.children[i].isCandidate) {
                children.push(beamNode.children[i]);
            }
        }
        beamNode.children = children;
        this.updateData(this.treeData);
    }

    getMaxAttnSourceWordIndex(d) {
        var maxSourceIndex = 0;
        for (var i = 1; i < d.data.attn[0].length; i++) {
            if (d.data.attn[0][i] > d.data.attn[0][maxSourceIndex]) {
                maxSourceIndex = i;
            }
        }
        return maxSourceIndex;
    }


    addCandidateNodesUNK(d, el) {
        let maxSourceIndex = this.getMaxAttnSourceWordIndex(d);
        var candidates = [];
        let attentionThreshold = 0.9;

        if (d.data.attn[0][maxSourceIndex] > attentionThreshold && maxSourceIndex < this.that.sentence.length) {
            var maxWord = this.that.sentence[maxSourceIndex];

            if (candidates.indexOf(maxWord) === -1) {
                candidates.push(maxWord);
            }

            if (maxWord in this.that.documentUnkMap) {
                let possibleTranslations = this.that.documentUnkMap[maxWord];
                for (var i = 0; i < possibleTranslations.length; i++) {
                    if (candidates.indexOf(possibleTranslations[i]) === -1) {
                        candidates.push(possibleTranslations[i]);
                    }
                }
            }
        }
        candidates.push("EDIT");

        var beamNode = this.getBeamNode(this.treeData, this.getPathList(d).slice(1));
        for (var i = 0; i < candidates.length; i++) {
            beamNode.children.push({
                attn: [],
                name: candidates[i],
                children: [],
                logprob: -3,
                candidates: [],
                isCandidate: true
            });
        }
        this.updateData(this.treeData);
    }

    addCandidateNodes(d, el) {
        var element = d3.select(el);

        if (d.data.name === "UNK") {
            this.addCandidateNodesUNK(d, el);
            return;
        }

        var candidates = [];
        var existingChildren = [];
        for (var i = 0; i < d.data.children.length; i++) {
            existingChildren.push(d.data.children[i].name);
        }
        for (var i = 0; i < d.data.children.length; i++) {
            for (var j = 0; j < d.data.children[i].candidates.length; j++) {
                var candidate = d.data.children[i].candidates[j];
                if (existingChildren.indexOf(candidate) === -1 && candidates.indexOf(candidate) === -1) {
                    candidates.push(candidate);
                }
            }
        }
        candidates.push("EDIT");

        var that = this.that;

        // 1. Get all candidates from children, excluding existing ones
        // 2. Push all candidates as children
        // 3. Update

        var beamNode = this.getBeamNode(this.treeData, this.getPathList(d).slice(1));
        for (var i = 0; i < candidates.length; i++) {
            beamNode.children.push({
                attn: [],
                name: candidates[i],
                children: [],
                logprob: -3,
                candidates: [],
                isCandidate: true
            });
        }
        this.updateData(this.treeData);
    }

    mouseover(d, el) {
        var that = this.that;
        that.hovers += 1;
        if (!d.data.isCandidate && d.data.attn) {
            that.beamAttention = d.data.attn[0].slice(0, that.sentence.length);
        }
    }

    mouseout(d, el) {
        var element = d3.select(el);
    }

    // Creates a curved (diagonal) path from parent to the child node
    diagonal(s, d) {

        var path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

        return path
    }


    getNodeId(d) {
        var path = [];

        while (d) {
            path.push(d.data.name);
            d = d.parent;
        }

        return path.reverse().join("#");
    }

    getPathList(d) {
        var path = [];

        while (d) {
            path.push(d.data.name);
            d = d.parent;
        }

        return path.reverse();
    }


    getPath(d) {
        var path = [];

        while (d) {
            path.push(d.data.is_unk ? "UNK" : d.data.name);
            d = d.parent;
        }

        return path.reverse().slice(0, -1).join(" ");
    }


    getTranslation(d) {
        var path = [];

        while (d) {
            path.push(this.that.decodeText(d.data.name));
            d = d.parent;
        }

        return path.reverse().slice(1);
    }


    getRoot(d) {
        var root = d;

        while (root.parent) {
            root = root.parent;
        }

        return root;
    }


    getBeamAttention(d) {
        var attention = [];

        while (d && d.data.name !== 'SOS') {
            attention.push(d.data.attn[0]);
            d = d.parent;
        }
        console.log(attention);
        return attention.reverse();
    }


    resetGoldenHypothesis(d) {
        if (!d.data) {
            return;
        }

        d.data.is_golden = false;

        if (!d.children || d.children.length == 0) {
            return;
        }

        for (var i = 0; i < d.children.length; i++) {
            this.resetGoldenHypothesis(d.children[i]);
        }
    }


    setGoldenHypothesis(d) {
        this.resetGoldenHypothesis(this.getRoot(d));
        var node = d;
        while (node) {
            node.data.is_golden = true;
            node = node.parent;
        }
        this.update(this.root);
    }

    resetGoldenHypothesisBeam(beam) {
        if (!beam) {
            return;
        }
        beam.is_golden = false

        for (var i = 0; i < beam.children.length; i++) {
            this.resetGoldenHypothesisBeam(beam.children[i]);
        }
    }

    setGoldenHypothesisBeam(beam, hypothesis) {
        if (hypothesis.length === 0) {
            return;
        }

        beam.is_golden = true
        for (var i = 0; i < beam.children.length; i++) {
            if (beam.children[i].name === hypothesis[0]) {
                this.setGoldenHypothesis(beam.children[i], hypothesis.slice(1))
            }
        }

    }

    buildColorLegend() {
        var w = 90;
        var h = 40;
        var legend = this.svg.append("defs")
            .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");


        var data = [];
        for (var i = 0.0; i < this.colors.length; i++) {
            data.push({offset: (i / this.colors.length) * 100 + "%", color: this.colors[i]});
        }
        legend.selectAll("stop")
            .data(data)
            .enter().append("stop")
            .attr("offset", function (d) {
                return d.offset;
            })
            .attr("stop-color", function (d) {
                return d.color;
            });

        var rect = this.svg.append("g")
            .attr("transform", "translate(150, 260)");

        rect
            .append("rect")
            .attr("width", w)
            .attr("height", h - 30)
            .style("fill", "url(#gradient)")
            .attr("transform", "translate(0,10)");

        rect
            .append("text")
            .text("Word Probability")
            .style("font-size", "12px");
    }
}