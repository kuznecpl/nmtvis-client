import {Component, OnInit, AfterContentInit, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';
import * as d3 from 'd3';
import {BeamNode} from './beam-node';
import {BeamTree} from './beam-tree';
import {DocumentService} from '../services/document.service';
import {MatSnackBar} from '@angular/material';

@Component({
    selector: 'app-sentence-view',
    templateUrl: './sentence-view.component.html',
    styleUrls: ['./sentence-view.component.css']
})

export class SentenceViewComponent implements OnInit, AfterContentInit {
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
    attentionOverrideMap = {};
    correctionMap = {};
    unkMap = {};
    documentUnkMap = {};
    beamSize = 3;
    sentenceId;
    documentId;
    showAttentionMatrix = false;
    beamTree;
    beam;
    objectKey = Object.keys;
    sideOpened = false;

    interval;
    timeSpent = 0;
    clicks = 0;
    hovers = 0;
    corrections = 0;

    constructor(private http: HttpClient, private route: ActivatedRoute,
                private documentService: DocumentService, public dialog: MatDialog, public snackBar: MatSnackBar) {
    }

    ngOnInit() {

        this.route.paramMap.subscribe(params => {
            this.documentId = params.get("document_id");
            this.sentenceId = params.get("sentence_id");

            this.documentService.getSentence(this.documentId, this.sentenceId)
                .subscribe(sentence
                    => {
                    this.sentence = sentence.inputSentence.split(" ");
                    this.inputSentence = sentence.inputSentence.toLowerCase();
                    this.translation = sentence.translation.split(" ");
                    this.attention = sentence.attention;
                    this.documentUnkMap = sentence.document_unk_map;
                    this.updateTranslation();
                    this.updateAttentionMatrix();
                    this.updateBeamGraph(sentence.beam);
                });
            this.documentService.getSentences(this.documentId)
                .subscribe(sentences => {
                    this.documentSentences = sentences;
                });
        });
    }

    ngAfterContentInit() {
        this.interval = setInterval(() => {
            this.timeSpent += 1;
        }, 1000);
    }

    beamSizeChange(event) {
        this.beamSize = event.target.value;
        this.http.post('http://46.101.224.19:5000/beamUpdate', {
            sentence: this.inputSentence,
            beam_size: event.target.value,
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
            sentence: this.inputSentence,
            attentionOverrideMap: this.attentionOverrideMap,
            correctionMap: this.correctionMap,
            beam_size: this.beamSize,
            unk_map: this.unkMap,
        }).subscribe(data => {
            this.updateBeamGraph(data["beam"]);
            this.corrections += 1;
        });
    }

    onAttentionChange() {
        this.http.post('http://46.101.224.19:5000/attentionUpdate', {
            sentence: this.inputSentence,
            attentionOverrideMap: this.attentionOverrideMap,
            correctionMap: this.correctionMap,
            beam_size: this.beamSize,
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

        var colorScale = d3.scaleLinear().domain([0, 1]).range(["lightgray", "#ff5010"]);

        var sourceWords = this.inputSentence.split(" ");
        var targetWords = this.translation;

        var attention = this.attention;

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

    updateTranslation() {
        var that = this;
        var margin = {top: 20, right: 20, bottom: 20, left: 120},
            width = 1000 - margin.left - margin.right,
            height = 100 - margin.top - margin.bottom;

        var attentionScale = d3.scaleLinear().domain([0, 1]).range([0, 8]);

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
        var textWidth = 70;

        //var sourceWords = ["this", "is"];
        //var targetWords = ["das", "ist", "test"];

        var sourceWords = this.inputSentence.split(" ");
        var targetWords = this.translation;
        console.log("Translation is " + this.translation);

        //var attention = [[0, 1], [1, 0], [0.5, 0.5]];
        var attention = this.attention;

        var tr = svg.append('g').selectAll('g').data(attention).enter().append("g");

        tr.each(function (d, i) {
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

                var pos = [{x: textWidth * i, y: topY + 5}, {x: textWidth * i, y: (topY + bottomY - 15) / 2}, {
                    x: textWidth * j,
                    y: (topY + bottomY - 15) / 2
                }, {
                    x: j * textWidth,
                    y: bottomY - 15
                }];
                var line = d3.line().curve(d3.curveBundle)
                    .x(function (d: any) {
                        return d.x;
                    })
                    .y(function (d: any) {
                        return d.y;
                    });
                return line(pos);
            })
            .attr("stroke-width", function (d) {
                return attentionScale(d) + "px";
            })
            .attr("visibility", function (d, i) {
                return d < 0.3 ? "hidden" : "visible";
            });

        svg.append('text').attr("y", topY).attr("x", -textWidth - 50).style("font-weight", "bold")
            .style("text-anchor", "left")
            .text("Source");
        svg.append('text').attr("y", bottomY).attr("x", -textWidth - 50).style("font-weight", "bold")
            .style("text-anchor", "left")
            .text("Translation");


        var sourceEnter = svg.append('g').selectAll('text').data(sourceWords).enter();

        sourceEnter.append("rect")
            .attr("x", function (d, i) {
                return textWidth * (i - 0.5) + 5;
            })
            .attr("y", function (d, i) {
                return topY - 15;
            })
            .attr("width", textWidth - 10)
            .attr("height", 20)
            .classed("word-box-source", true)
            .on("mouseover", function (d, i) {
                svg.selectAll("[source-id='" + i + "']")
                    .classed("attention-selected", true);
            })
            .on("mouseout", function (d) {
                svg.selectAll('.attention-selected').classed("attention-selected", false);
            });

        sourceEnter.append("text")
            .text(function (d) {
                return that.decodeText(d);
            })
            .attr("x", function (d, i) {
                return textWidth * i;
            })
            .attr("y", topY)
            .style("text-anchor", "middle");


        var targetEnter = svg.append('g').selectAll('text').data(targetWords).enter()

        targetEnter.append("rect")
            .attr("x", function (d, i) {
                return textWidth * (i - 0.5) + 5;
            })
            .attr("y", function (d, i) {
                return bottomY - 15;
            })
            .attr("width", textWidth - 10)
            .attr("height", 20)
            .classed("word-box-target", true)
            .on("mouseover", function (d, i) {
                svg.selectAll("[target-id='" + i + "']")
                    .classed("attention-selected", true);
            })
            .on("mouseout", function (d) {
                svg.selectAll('.attention-selected').classed("attention-selected", false);
            });

        targetEnter.append("text")
            .text(function (d) {
                return that.decodeText(d);
            })
            .attr("x", function (d, i) {
                return textWidth * i;
            })
            .attr("y", bottomY)
            .style("text-anchor", "middle");
        ;
    }

    decodeText(text) {
        return text.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
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

    onAcceptTranslation() {

        this.http.post('http://46.101.224.19:5000/api/correctTranslation', {
            translation: this.translation.join(" "),
            beam: this.beam,
            attention: this.attention,
            document_id: this.documentId,
            sentence_id: this.sentenceId,
            document_unk_map: this.documentUnkMap
        }).subscribe(data => {
            this.sideOpened = true;
            let snackBarRef = this.snackBar.open('Translation accepted!', '', {duration: 700});
        });
    }

    onClick() {
        console.log(this.inputSentence);
        this.inputSentence = this.inputSentence.toLowerCase();
        this.loading = true;
        this.correctionMap = {};
        this.attentionOverrideMap = {};
        this.http.post('http://46.101.224.19:5000', {
            sentence: this.inputSentence,
            beam_size: this.beamSize
        }).subscribe(data => {
            this.sentence = data["sentence"].split(" ");
            this.translation = this.decodeText(data["translation"]).split(" ");
            this.attention = data["attention"];
            this.beamAttention = [1, 0, 0, 0]
            console.log(data);
            this.heatmap = "http://46.101.224.19:5000/heatmap?sentence=" + this.sentence;
            this.loading = false;
            this.haveContent = true;
            this.updateBeamGraph(data["beam"]);
            this.updateTranslation();
            this.updateAttentionMatrix();
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
    selector: 'beam-node-dialog',
    templateUrl: 'beam-node-dialog.html',
})
export class BeamNodeDialog {

    shownValues = [];
    beamAttention = [];

    constructor(public dialogRef: MatDialogRef<BeamNodeDialog>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.beamAttention = data.attention;
        this.shownValues = this.beamAttention.slice();
    }

    attentionChange(event, i) {
        var sum = 0;
        for (var i = 0; i < this.shownValues.length; i++) {
            sum += this.shownValues[i];
        }
        console.log("Sum " + sum);
        for (var i = 0; i < this.shownValues.length; i++) {
            this.beamAttention[i] = this.shownValues[i] / sum;
        }

    }

    onAttentionChange() {

    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
