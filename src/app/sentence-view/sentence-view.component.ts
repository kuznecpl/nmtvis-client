import {Component, OnInit, AfterContentInit, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import * as d3 from 'd3';
import {BeamNode} from './beam-node';
import {BeamTree} from './beam-tree';
import {DocumentService} from '../services/document.service';
import {ExperimentService} from '../services/experiment.service';
import {MatSnackBar} from '@angular/material';
import {Constants} from '../constants';

@Component({
    selector: 'app-sentence-view',
    templateUrl: './sentence-view.component.html',
    styleUrls: ['./sentence-view.component.css']
})

export class SentenceViewComponent implements OnInit, AfterContentInit {
    title = 'DNN Vis';
    ATTENTION_THRESHOLD = 0.2;

    sentence = [];
    translation = [];
    editedTranslation;
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
    attentionOverrideMap = {};
    correctionMap = {};
    unkMap = {};
    documentUnkMap = {};
    beamSize = 3;
    beamLength = 1;
    beamCoverage = 1;
    sentenceId;
    documentId;
    showAttentionMatrix = false;
    beamTree;
    beam;
    objectKey = Object.keys;
    sideOpened = false;
    debug = false;
    events = [];

    interval;

    experimentMetrics: any = {
        timeSpent: 0,
        clicks: 0,
        hovers: 0,
        corrections: 0,
    };

    constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router,
                private documentService: DocumentService, private experimentService: ExperimentService,
                public dialog: MatDialog, public snackBar: MatSnackBar) {
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.documentId = params.get("document_id");
            this.sentenceId = params.get("sentence_id");

            this.unkMap = {};
            this.correctionMap = {};
            this.experimentMetrics = {
                timeSpent: 0,
            };
            this.events = [];

            var that = this;
            this.documentService.getSentence(this.documentId, this.sentenceId)
                .subscribe((sentence: any) => {
                    that.sentence = sentence.inputSentence.split(" ");
                    that.inputSentence = that.decodeText(sentence.inputSentence);

                    that.translation = sentence.translation.split(" ");
                    that.attention = sentence.attention;
                    that.documentUnkMap = sentence.document_unk_map;
                    that.updateTranslation(sentence.inputSentence, sentence.translation);
                    that.updateAttentionMatrix();
                    that.updateBeamGraph(sentence.beam);
                });
            /*this.documentService.getSentences(this.documentId)
             .subscribe((sentences: any) => {
             that.documentSentences = sentences;
             });*/
        });
    }

    ngAfterContentInit() {
        this.interval = setInterval(() => {
            this.experimentMetrics.timeSpent += 1;
        }, 500);
    }

    beamSizeChange() {
        this.http.post('http://46.101.224.19:5000/beamUpdate', {
            sentence: this.encodeText(this.inputSentence),
            beam_size: this.beamSize,
            beam_length: this.beamLength,
            beam_coverage: this.beamCoverage,
            attentionOverrideMap: this.attentionOverrideMap,
            correctionMap: this.correctionMap,
            unk_map: this.unkMap
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

    onCorrectionChange(word) {
        this.http.post('http://46.101.224.19:5000/wordUpdate', {
            sentence: this.encodeText(this.inputSentence),
            attentionOverrideMap: this.attentionOverrideMap,
            correctionMap: this.correctionMap,
            beam_size: this.beamSize,
            beam_length: this.beamLength,
            beam_coverage: this.beamCoverage,
            unk_map: this.unkMap,
        }).subscribe(data => {
            this.updateBeamGraph(data["beam"]);
        });
    }

    onAttentionChange() {
        this.http.post('http://46.101.224.19:5000/attentionUpdate', {
            sentence: this.encodeText(this.inputSentence),
            attentionOverrideMap: this.attentionOverrideMap,
            correctionMap: this.correctionMap,
            beam_size: this.beamSize,
            beam_length: this.beamLength,
            beam_coverage: this.beamCoverage,
            unk_map: this.unkMap,
        }).subscribe(data => {
            this.updateBeamGraph(data["beam"]);
        });
    }

    updateAttentionMatrix() {
        var margin = {top: 70, right: 20, bottom: 20, left: 100},
            width = 500 - margin.left - margin.right,
            height = 350 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        d3.selectAll("#attention-matrix-vis").remove();
        var svg = d3.select("#attention-matrix").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "attention-matrix-vis")
            .append("g")
            .attr("transform", "translate("
                + margin.left + "," + margin.top + ")");

        svg.append("text").attr("x", -15).attr("y", -50).text("Attention Matrix").style("font-weight", "bold");

        var range: any = ["lightgray", "#ff5010"];
        var colorScale: any = d3.scaleLinear().domain([0, 1]).range(range);

        var sourceWords = this.inputSentence.split(" ");
        var targetWords = this.translation;

        var attention = this.attention.slice();

        var rowsEnter = svg.selectAll(".row")
            .data(attention)
            .enter();

        var targetLegend = rowsEnter.append("g")
            .attr("class", "row")
            .attr("transform", (d, i) => {
                return "translate(-15," + (i * 20 + 12) + ")";
            })
            .append("text")
            .style("font-size", "12px")
            .style("text-anchor", "end")
            .text((d, i) => targetWords[i]);

        var sourceLegend = svg.selectAll(".source-word")
            .data(sourceWords)
            .enter()
            .append("g")
            .attr("transform", (d, i) => {
                return "translate(" + (i * 20 + 3) + ", -5)" + "rotate(90)";
            })
            .append("text")
            .style("font-size", "12px")
            .style("text-anchor", "end")
            .text((d, i) => sourceWords[i]);

        var rows = rowsEnter.append("g")
            .attr("class", "row")
            .attr("transform", (d, i) => {
                return "translate(0," + i * 20 + ")";
            });
        var squares = rows.selectAll(".cell")
            .data(d => d)
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", (d, i) => i * 20)
            .attr("width", width / 20 - 3)
            .attr("height", width / 20 - 3)
            .style("fill", d => colorScale(d));
    }

    onCurrentAttentionChange() {
        for (var i = 0; i < this.beamAttention.length; i++) {
            if (this.beamAttention[i] > this.ATTENTION_THRESHOLD) {
                d3.select("#source-word-text-" + i).style("font-weight", "bold");
            }
            let opacity = this.beamAttention[i] < 0.1 ? 0 : Math.sqrt(this.beamAttention[i]);
            d3.select("#source-word-box-" + i).style("opacity", opacity);
        }
    }

    clearAttentionSelection() {
        d3.selectAll(".source-word-box").style("opacity", 1);
        d3.selectAll(".source-word-text").style("font-weight", "normal");
    }

    calculateTextWidth(text) {
        text = text.replace("@@", "")

        var svg = !d3.select("#translation-vis").empty() ?
            d3.select("#translation-vis") : d3.select("body").append("svg").attr("id", "sample");
        var textSel: any = svg.append("text").text(text).style("font-size", "12px");
        var width = textSel.node().getComputedTextLength();
        textSel.remove();
        d3.select("#sample").remove();
        return width + 2;
    }


    mouseoverTargetWord(i, attention) {
        var svg = d3.select("#translation-vis");
        svg.selectAll("path").classed("fade-out", true);
        svg.selectAll("[target-id='" + i + "']")
            .classed("attention-selected", true);

        if (!attention[i]) {
            return;
        }

        for (var j = 0; j < attention[i].length; j++) {

            svg.select("#source-word-box-" + j).style("opacity", Math.sqrt(attention[i][j]));

            if (attention[i][j] > this.ATTENTION_THRESHOLD) {
                svg.select("#source-word-text-" + j).style("font-weight", "bold");
            }

        }
    }

    isValidTranslation() {
        return this.translation.length !== 0 && this.translation[this.translation.length - 1] === Constants.EOS;
    }

    lastMaxIndex(a) {
        var maxI = 0;
        for (var i = 1; i < a.length; i++) {
            if (a[i] >= a[maxI]) {
                maxI = i;
            }
        }
        return maxI;
    }

    updateTranslation(source: string, translation: string) {
        var that = this;
        var textWidth = 70;
        var leftMargin = 120;

        var maxTextLength = 10;
        var barPadding = 1;
        var targetBarPadding = 1;

        var attention = this.attention.slice();

        var sourceWords = source.split(" ");
        sourceWords.push("EOS")
        var targetWords = translation.split(" ");

        var xTargetValues = {0: 0};
        var wholeWordCount = 0;
        var furthestRelevantSourceIndex = 0;
        for (var i = 1; i < targetWords.length; i++) {
            xTargetValues[i] = xTargetValues[i - 1] + 0.5 * this.calculateTextWidth(targetWords[i])
                + 0.5 * this.calculateTextWidth(targetWords[i - 1]) + barPadding;
            if (!targetWords[i - 1].endsWith("@@")) {
                xTargetValues[i] += 3;
                wholeWordCount++;
            }
            for (var j = 0; j < attention[i].length; j++) {
                var maxJ = this.lastMaxIndex(attention[i]);
                if (attention[i][maxJ] > this.ATTENTION_THRESHOLD
                    && (maxJ !== attention[i].length - 1 || i === this.inputSentence.split(" ").length - 1)) {
                    furthestRelevantSourceIndex = Math.max(furthestRelevantSourceIndex, maxJ);
                }
            }
        }

        var xSourceValues = {0: 0};
        for (var i = 1; i < sourceWords.length; i++) {
            xSourceValues[i] = xSourceValues[i - 1] + 0.5 * this.calculateTextWidth(sourceWords[i])
                + 0.5 * this.calculateTextWidth(sourceWords[i - 1]) + barPadding;
            if (!sourceWords[i - 1].endsWith("@@")) {
                xSourceValues[i] += 3;
            }
        }

        var w1 = xSourceValues[sourceWords.length - 1] + 0.5 * this.calculateTextWidth(sourceWords.slice(-1)[0]);
        var w2 = xTargetValues[targetWords.length - 1] + 0.5 * this.calculateTextWidth(targetWords.slice(-1)[0]);
        var relevantW1 = xSourceValues[furthestRelevantSourceIndex] + 0.5 * this.calculateTextWidth(sourceWords[furthestRelevantSourceIndex]);

        if (wholeWordCount > 1 && targetWords.length > 2 && relevantW1 - (w2 + leftMargin) > 0) {
            let delta = relevantW1 - w2 - leftMargin;
            if (delta > 0) {
                targetBarPadding = delta / (wholeWordCount - 1)

                var wholeWordIndex = 0;
                for (var i = 0; i < targetWords.length; i++) {
                    xTargetValues[i] += wholeWordIndex * targetBarPadding;
                    if (!targetWords[i].endsWith("@@")) {
                        wholeWordIndex++;
                    }
                }
            }
        }

        var w = Math.max(w1, w2) + leftMargin;

        var margin = {top: 20, right: 20, bottom: 20, left: leftMargin},
            width = w - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        var attentionScale: any = d3.scalePow().domain([0, 1]).range([0, 5]);
        attentionScale = function (x) {
            return 3.2 * Math.sqrt(x);
        }

        // append the svg object to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        d3.selectAll("#translation-vis").remove();
        var svg = d3.select("#translation-box").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .attr("id", "translation-vis")
            .append("g")
            .attr("transform", "translate("
                + margin.left + "," + margin.top + ")");
        var topY = 10;
        var bottomY = 70;

        var targetWords = translation.split(" ");

        svg.append('text').attr("y", topY).attr("x", -textWidth - 50).style("font-weight", "bold")
            .style("text-anchor", "left")
            .text("Source");
        svg.append('text').attr("y", bottomY).attr("x", -textWidth - 50).style("font-weight", "bold")
            .style("text-anchor", "left")
            .text("Translation");


        var sourceEnter = svg.append('g').selectAll('text').data(sourceWords).enter();

        sourceEnter.append("rect")
            .attr("x", function (d, i) {
                return xSourceValues[i] - 0.5 * that.calculateTextWidth(d);
            })
            .attr("y", function (d, i) {
                return topY - 15;
            })
            .attr("width", function (d) {
                return that.calculateTextWidth(d);
            })
            .attr("height", 20)
            .classed("source-word-box", true)
            .attr("id", function (d, i) {
                return "source-word-box-" + i;
            })
            .on("mouseover", function (d, i) {
                svg.selectAll("path")
                    .classed("fade-out", true);
                svg.selectAll("[source-id='" + i + "']")
                    .classed("attention-selected", true);
                that.addEvent("source-hover", d);
                svg.select("#source-word-text-" + i).style("font-weight", "bold");
                for (var j = 0; j < attention.length; j++) {

                    svg.select("#target-word-box-" + j).style("opacity", Math.sqrt(attention[j][i]));

                    if (attention[j][i] > that.ATTENTION_THRESHOLD) {
                        svg.select("#target-word-text-" + j).style("font-weight", "bold");
                    }

                }
            })
            .on("mouseout", function (d, i) {
                svg.selectAll(".fade-out").classed("fade-out", false);
                svg.select("#source-word-text-" + i).style("font-weight", "normal");
                that.addEvent("source-hover-out", d);
                svg.selectAll('.attention-selected').classed("attention-selected", false);
                svg.selectAll(".target-word-box").style("opacity", 1);
                svg.selectAll(".target-word-text").style("font-weight", "normal");
            });

        sourceEnter.append("g")
            .attr("transform", function (d, i) {
                var x = xSourceValues[i];
                var y = topY;
                return "translate(" + x + "," + y + ")";
            })
            .append("text")
            .attr("transform", function (d) {
                var xScale = 1;
                return "scale(" + xScale + ",1)"
            })
            .classed("source-word-text", true)
            .attr("id", function (d, i) {
                return "source-word-text-" + i;
            })
            .text(function (d) {
                return that.decodeText(d);
            })
            .style("text-anchor", "middle");

        var targetEnter = svg.append('g').selectAll('text').data(targetWords).enter();

        targetEnter.append("rect")
            .attr("x", function (d, i) {
                return xTargetValues[i] - 0.5 * that.calculateTextWidth(d);
            })
            .attr("y", function (d, i) {
                return bottomY - 15;
            })
            .attr("width", function (d) {
                return that.calculateTextWidth(d);
            })
            .attr("height", 20)
            .classed("target-word-box", true)
            .attr("id", function (d, i) {
                return "target-word-box-" + i;
            })
            .on("mouseover", function (d, i) {
                svg.selectAll("path")
                    .classed("fade-out", true);
                svg.selectAll("[target-id='" + i + "']")
                    .classed("attention-selected", true);
                svg.select("#target-word-text-" + i).style("font-weight", "bold");
                that.addEvent("target-hover", d);

                for (var j = 0; j < attention[i].length; j++) {

                    svg.select("#source-word-box-" + j).style("opacity", Math.sqrt(attention[i][j]));

                    if (attention[i][j] > that.ATTENTION_THRESHOLD) {
                        svg.select("#source-word-text-" + j).style("font-weight", "bold");
                    }

                }
            })
            .on("mouseout", function (d, i) {
                svg.selectAll(".fade-out").classed("fade-out", false);
                svg.select("#target-word-text-" + i).style("font-weight", "normal");
                that.addEvent("target-hover-out", d);
                svg.selectAll('.attention-selected').classed("attention-selected", false);
                svg.selectAll(".source-word-box").style("opacity", 1);
                svg.selectAll(".source-word-text").style("font-weight", "normal");
            });

        targetEnter.append("g")
            .attr("transform", function (d, i) {
                var x = xTargetValues[i];
                var y = bottomY;
                return "translate(" + x + "," + y + ")";
            })
            .append("text")
            .attr("transform", function (d) {
                var xScale = 1;
                return "scale(" + xScale + ",1)"
            })
            .classed("target-word-text", true)
            .attr("id", function (d, i) {
                return "target-word-text-" + i;
            })
            .text(function (d) {
                if (d === Constants.EOS) {
                    return "EOS";
                }
                return that.decodeText(d);
            })
            .style("text-anchor", "middle");


        var tr = svg.append('g').selectAll('g').data(attention).enter().append("g");

        tr.each(function (d, i) {
            if (!d) {
                return;
            }
            d.j = i;
        })

        var j = -1;
        tr.selectAll('path').data(function (d) {
            return d;
        })
            .enter()
            .append("path")
            .classed("attention-line", true)
            .attr("d", function (d, i) {
                if (i == 0) {
                    j++;
                }

                d3.select(this).attr('source-id', i + "");
                d3.select(this).attr('target-id', j + "");

                var pos: any = [{x: xSourceValues[i], y: topY + 5}, {x: xSourceValues[i], y: topY + 15},
                    {
                        x: (xTargetValues[j] + xSourceValues[i]) / 2,
                        y: (topY + bottomY - 15) / 2
                    }, {
                        x: xTargetValues[j],
                        y: bottomY - 25,
                    }, {
                        x: xTargetValues[j],
                        y: bottomY - 15
                    }];
                var line = d3.line().curve(d3.curveBundle.beta(1))
                    .x(function (d: any) {
                        return d.x;
                    })
                    .y(function (d: any) {
                        return d.y;
                    });
                return line(pos);
            })
            .style("stroke-width", function (d) {
                return attentionScale(d) + "px";
            })
            .style("visibility", function (d, i) {
                return d < that.ATTENTION_THRESHOLD ? "hidden" : "visible";
            });
    }

    encodeText(text) {
        return text.replace(/'/g, "&apos;").replace(/"/g, '&quot;')
            .replace(/\u200b\u200b/g, "@@ ")
            .replace(/\u200b/g, "@@");
    }

    decodeText(text) {
        return text.replace(/&apos;/g, "'").replace(/&quot;/g, '"')
            .replace(/@@ /g, "\u200b\u200b")
            .replace(/@@/g, "\u200b");
    }

    updateBeamGraph(treeData) {
        this.beam = treeData;
        if (!this.beamTree) {
            this.beamTree = new BeamTree(treeData, this);
            this.beamTree.build();
        } else {
            this.beamTree.updateData(treeData);
        }
    }

    onSkip() {
        this.router.navigate(['/documents', this.documentId, "sentence", this.sentenceId]);
    }

    onAcceptTranslation() {
        this.http.post('http://46.101.224.19:5000/api/correctTranslation', {
            translation: this.translation.join(" "),
            beam: this.beam,
            attention: this.attention,
            document_id: this.documentId,
            sentence_id: this.sentenceId,
            document_unk_map: this.documentUnkMap
        }).subscribe(data => {
            //this.sideOpened = true;
            let snackBarRef = this.snackBar.open('Translation accepted!', '', {duration: 700});
            this.router.navigate(['/documents', this.documentId, "sentence", this.sentenceId]);
            /**
             if (this.experimentService) {
                this.experimentMetrics.sentence = this.sentence.join(" ");
                this.experimentMetrics.translation = this.translation.join(" ");
                this.experimentMetrics.events = this.events;
                this.experimentService.getNextSentence(this.experimentMetrics)
                    .subscribe(result => {
                        if (result.status !== "finished") {
                            this.router.navigate(["/" + result.experimentType, 'document',
                                result.documentId, "sentence", result.sentenceId]);
                        } else {
                            this.router.navigate(['/finish']);
                        }
                    });
            } else {

            }*/

        });
    }

    addEvent(type, val = "") {
        this.events.push({"type": type, "time": this.experimentMetrics.timeSpent, "val": val})
    }

    onTranslationEdit($event) {
        this.editedTranslation = this.encodeText($event);
        if (this.editedTranslation[this.editedTranslation.length - 1] === " ") {

            var prefix = (Constants.SOS + " " + this.editedTranslation.trim()).split(" ");
            this.correctionMap = {};
            this.correctionMap[prefix.slice(0, prefix.length - 1).join(" ")] = prefix[prefix.length - 1];
            this.onCorrectionChange("");
        }
    }

    onClick() {
        this.loading = true;
        this.correctionMap = {};
        this.attentionOverrideMap = {};
        this.http.post('http://46.101.224.19:5000', {
            sentence: this.encodeText(this.inputSentence),
            beam_size: this.beamSize,
            beam_length: this.beamLength,
            beam_coverage: this.beamCoverage,
        }).subscribe(data => {
            this.sentence = data["sentence"].split(" ");
            this.translation = this.decodeText(data["translation"]).split(" ");
            this.attention = data["attention"];
            this.beamAttention = [1, 0, 0, 0]
            this.loading = false;
            this.haveContent = true;
            this.updateBeamGraph(data["beam"]);
            this.updateTranslation(data["sentence"], data["translation"]);
            this.updateAttentionMatrix();
        });
    }

    showInfo() {
        console.log("Showing Info")
        this.dialog.open(InfoDialog, {
            width: "600px"
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

@Component({
    selector: 'info-dialog',
    templateUrl: 'info-dialog.html',
})
export class InfoDialog {

    shownValues = [];
    beamAttention = [];

    constructor(public dialogRef: MatDialogRef<InfoDialog>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}

@Component({
    selector: 'beam-node-dialog',
    templateUrl: 'beam-node-dialog.html',
})
export class BeamNodeDialog {

    shownValues = [];
    beamAttention = [];
    events = [];
    sentenceView;

    constructor(public dialogRef: MatDialogRef<BeamNodeDialog>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.beamAttention = data.attention;
        this.events = data.events;
        this.shownValues = this.beamAttention.slice();
        this.sentenceView = data.sentenceView;
    }

    onKeyDown(event) {
        this.sentenceView.addEvent("keydown", event.key);
    }

    onAttentionChange() {

    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
