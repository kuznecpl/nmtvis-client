import {Component, OnInit, Inject, AfterViewInit} from '@angular/core';
import {Document} from '../models/document';
import {DocumentService} from '../services/document.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {Constants} from '../constants';
import {TextDisplayPipe} from '../pipes/text-display.pipe';
import * as d3 from 'd3';

@Component({
    selector: 'app-documents-overview',
    templateUrl: './documents-overview.component.html',
    styleUrls: ['./documents-overview.component.css']
})
export class DocumentsOverviewComponent implements OnInit, AfterViewInit {

    documents = [];
    allSentences = [];
    selectedDocument;
    selectedSentence;
    newDocumentName;
    showCorrected = false;
    showFlagged = false;
    retrainText = "Retrain";
    retranslateText = "Retranslate";
    retraining = false;
    retranslating = false;
    IS_USER_STUDY = Constants.IS_USER_STUDY;

    numChanges = 0;
    metrics = [
        {name: "coverage_penalty", color: "lightblue", shortname: "CP"},
        {name: "coverage_deviation_penalty", color: "green", shortname: "CDP"},
        {name: "length", color: "lightred", shortname: "Length"},
        {name: "confidence", color: "#3f51b5", shortname: "Conf"}
    ];
    sentenceId;
    documentId;
    loading = false;
    topics = [{name: 'diagramm', active: false, occurrences: 0},
        {name: 'element', active: false, occurrences: 0},
        {name: 'computer', active: false, occurrences: 0}
    ];
    newKeyphrase;
    hoverTopic;
    defaultSortMetric = "order_id";
    defaultSortAscending = true;
    currentSortMetric = this.defaultSortMetric;
    currentSortAscending = true;
    defaultBrush = {};

    constructor(readonly documentService: DocumentService, public dialog: MatDialog, private route: ActivatedRoute,
                private textPipe: TextDisplayPipe) {

    }

    isHighlighted(word) {
        for (var topic of this.topics) {
            if (topic.active && word.trim().toLowerCase().indexOf(topic.name.toLowerCase()) >= 0) {
                return true;
            }
        }
        return false;
    }

    isHighlightedTarget(sentence, word, target_index) {
        let bpe_target = sentence.translation.slice(0, -4).split(" ");
        let source = this.textPipe.transform(sentence.source, false).split(" ");
        let target = this.textPipe.transform(sentence.translation, true).split(" ");
        let bpe_source = sentence.source.split(" ");
        let attention = sentence.attention;

        var targetToBpe = {};
        var currentTargetIndex = 0;
        for (var j = 0; j < bpe_target.length; j++) {
            if (!(currentTargetIndex in targetToBpe)) {
                targetToBpe[currentTargetIndex] = [];
            }
            targetToBpe[currentTargetIndex].push(j);
            if (!bpe_target[j].endsWith('@@')) {
                currentTargetIndex++;
            }
        }
        var target_bpe_indices = targetToBpe[target_index];
        var source_bpe_indices = [];

        // Get all source bpe indices of affected words
        for (let target_bpe_index of target_bpe_indices) {
            for (let j = 0; j < attention[target_bpe_index].length; j++) {
                if (attention[target_bpe_index][j] > 0.3) {
                    if (source_bpe_indices.indexOf(j) < 0) {
                        source_bpe_indices.push(j);
                    }
                }
            }
        }

        var bpeToSource = {};
        var currentSourceIndex = 0;
        for (var j = 0; j < bpe_source.length; j++) {
            bpeToSource[j] = currentSourceIndex;

            if (!bpe_source[j].endsWith('@@')) {
                currentSourceIndex++;
            }
        }

        var source_indices = [];
        for (let source_bpe_index of source_bpe_indices) {
            source_indices.push(bpeToSource[source_bpe_index]);
        }

        for (let source_index of source_indices) {
            if (source[source_index] && this.isHighlighted(source[source_index])) {
                return true;
            }
        }
        return false;
    }

    isTopicMatch(text, topic) {
        return text.trim().toLowerCase().indexOf(topic.name.toLowerCase()) >= 0;
    }

    addTopic(topicName) {
        this.topics.push({
            name: topicName,
            occurrences: 0,
            active: false,
        });
        this.newKeyphrase = "";
        this.computeTopicOccurrences();
    }

    computeTopicOccurrences() {
        for (let topic of this.topics) {
            topic.occurrences = 0;
            for (let sentence of this.selectedDocument.sentences) {
                if (this.isVisible(sentence) && this.isTopicMatch(sentence.source.replace(/@@ /g, ""), topic)) {
                    topic.occurrences++;
                }
            }
        }
    }

    ngAfterViewInit() {

    }

    hasActiveTopic(sentence) {
        for (var topic of this.topics) {
            if (topic.active && !this.isTopicMatch(sentence.source.replace(/@@ /g, ""), topic)) {
                return false;
            }
        }
        return true;
    }

    onActiveTopicChange() {
        /*
         var currentSentences = this.allSentences;
         var filteredSentences = [];
         var words = d3.selectAll('.source-word');
         var that = this;

         for (let sentence of currentSentences) {
         var hasAllTopics = true;
         for (var topic of that.topics) {
         if (topic.active && !this.isTopicMatch(sentence.source.replace(/@@ /g, ""), topic)) {
         hasAllTopics = false;
         break;
         }
         }
         if (hasAllTopics) {
         filteredSentences.push(sentence);
         }
         }
         this.selectedDocument.sentences = filteredSentences;

         words.each(function () {
         var el = d3.select(this);
         var highlight = false;

         for (var topic of that.topics) {
         if (topic.active && el.text().trim().toLowerCase().indexOf(topic.name.toLowerCase()) >= 0) {
         highlight = true;
         }
         }
         });*/
        this.topics = this.topics.slice();
        this.cacheTopics();
    }

    sortSentences(metric: string, sortAscending: boolean) {
        console.log("sortSentences(" + metric + "," + sortAscending + ")");
        this.currentSortMetric = metric;
        this.currentSortAscending = sortAscending;
        this.selectedDocument.sentences = this.selectedDocument.sentences.sort((a, b) => {
            if (sortAscending) {
                return a["score"][metric] - b["score"][metric];
            } else {
                return b["score"][metric] - a["score"][metric];
            }
        }).slice();
    }

    sortGivenSentences(sentences, metric: string, sortAscending: boolean) {
        return sentences.sort((a, b) => {
            if (sortAscending) {
                return a["score"][metric] - b["score"][metric];
            } else {
                return b["score"][metric] - a["score"][metric];
            }
        }).slice();
    }

    loadSortSettings() {
        if (localStorage.getItem("sortMetric") !== null) {
            this.defaultSortMetric = localStorage.getItem("sortMetric");
        }
        if (localStorage.getItem("sortAscending") !== null) {
            this.defaultSortAscending = localStorage.getItem("sortAscending") === 'true' ? true : false;
        }
    }

    loadShowFlagged() {
        if (this.selectedDocument && localStorage.getItem(this.selectedDocument.id + "-showFlagged") !== null) {
            this.showFlagged = localStorage.getItem(this.selectedDocument.id + "-showFlagged") === 'true' ? true : false;
        }
    }

    loadTopics() {
        if (this.selectedDocument && localStorage.getItem(this.selectedDocument.id + "-topics") !== null) {
            this.topics = JSON.parse(localStorage.getItem(this.selectedDocument.id + "-topics"));
        }
    }

    cacheBrush(brushMap) {
        localStorage.setItem(this.selectedDocument.id + "-brush", JSON.stringify(brushMap));
    }

    loadDefaultBrush() {
        this.defaultBrush = JSON.parse(localStorage.getItem(this.selectedDocument.id + "-brush"));
    }

    loadSelectedSentenceId() {
        if (localStorage.getItem(this.selectedDocument.id + "-selectedSentenceId")) {
            return localStorage.getItem(this.selectedDocument.id + "-selectedSentenceId");
        }
        return null;
    }

    cacheTopics() {
        if (this.selectedDocument) {
            localStorage.setItem(this.selectedDocument.id + "-topics", JSON.stringify(this.topics));
        }
    }

    ngOnDestroy() {
        localStorage.setItem("sortMetric", this.currentSortMetric);
        localStorage.setItem("sortAscending", "" + this.currentSortAscending);
        if (this.selectedDocument) {
            localStorage.setItem(this.selectedDocument.id + "-showFlagged", "" + this.showFlagged);
        }
        if (this.selectedSentence) {
            localStorage.setItem(this.selectedDocument.id + "-selectedSentenceId", "" + this.selectedSentence.id);
        }
        this.cacheTopics();
    }

    scrollToLastSelectedSentence() {
        let selectedSentenceId = this.loadSelectedSentenceId();
        if (selectedSentenceId) {
            for (var j = 0; j < this.selectedDocument.sentences.length; j++) {
                if (this.selectedDocument.sentences[j].id === selectedSentenceId) {
                    this.selectedSentence = this.selectedDocument.sentences[j];
                    break;
                }
            }
            this.scrollToSentence(selectedSentenceId);
        }
    }


    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.documentId = params.get("document_id");
            this.sentenceId = params.get("sentence_id");

            if (!this.documentId || !this.sentenceId) {
                this.documentService.getDocuments()
                    .subscribe(documents => {
                        this.documents = documents;
                        var that = this;
                        if (this.documents.length > 0) {
                            this.loadSortSettings();
                            this.onClick(this.documents[0], () => {
                                this.loadShowFlagged();
                                this.loadTopics();
                                setTimeout(function () {
                                    that.scrollToLastSelectedSentence();
                                    that.computeTopicOccurrences();
                                }, 2000);

                            });
                        }
                    });

                return;
            }

            this.loadSortSettings();

            this.documentService.getDocuments()
                .subscribe(documents => {
                    this.documents = documents;
                    var that = this;
                    for (var i = 0; i < this.documents.length; i++) {
                        if (this.documents[i].id === this.documentId) {
                            this.loadSortSettings();
                            this.onClick(this.documents[i], () => {
                                this.loadShowFlagged();
                                this.loadTopics();
                                setTimeout(function () {
                                    that.scrollToLastSelectedSentence();
                                    that.computeTopicOccurrences();
                                }, 2000);

                            });
                            return;
                        }
                    }
                });

        });
    }

    onBrushExtentChange(brushMap) {
        this.cacheBrush(brushMap);
        console.log("cached " + brushMap)
    }

    onBrushSelectionChange(sentences) {
        this.selectedDocument.sentences = this.sortGivenSentences(sentences, this.currentSortMetric, this.currentSortAscending);
        this.computeTopicOccurrences();
    }

    scrollToSentence(sentenceId) {
        console.log("Scrolling to " + sentenceId)
        this.scrollParentToChild(document.getElementById("document-scroll"),
            document.getElementById("sentence-" + sentenceId));
    }

    scrollParentToChild(parent, child) {
        if (!parent || !child) {
            return;
        }

        // Where is the parent on page
        var parentRect = parent.getBoundingClientRect();
        // What can you see?
        var parentViewableArea = {
            height: parent.clientHeight,
            width: parent.clientWidth
        };

        // Where is the child
        var childRect = child.getBoundingClientRect();
        // Is the child viewable?
        var isViewable = (childRect.top >= parentRect.top) && (childRect.top <= parentRect.top + parentViewableArea.height);

        // if you can't see the child try to scroll parent
        if (!isViewable) {
            // scroll by offset relative to parent
            parent.scrollTop = (childRect.top + parent.scrollTop) - parentRect.top
        }
    }

    isVisible(sentence) {
        if (!sentence) {
            return false;
        }
        return (sentence.flagged || !this.showFlagged)
            && this.hasActiveTopic(sentence) && (!this.showCorrected || !sentence.corrected);
    }

    get correctedSentences() {
        if (!this.selectedDocument || !this.selectedDocument.sentences) {
            return "";
        }

        var count = 0;
        for (var i = 0; i < this.selectedDocument.sentences.length; i++) {
            if (this.selectedDocument.sentences[i].corrected) {
                count++;
            }
        }
        return count;
    }

    onSentenceClick(sentence) {
        sentence.corrected = !sentence.corrected;

        this.documentService.setCorrected(this.selectedDocument.id, sentence.id, sentence.corrected)
            .subscribe(result => {

            });
    }

    cacheSentences() {
        //localStorage.setItem(this.selectedDocument.id + "-sentences", JSON.stringify(this.selectedDocument.sentences));
    }

    loadCachedSentences() {
        if (localStorage.getItem(this.selectedDocument.id + "-sentences") !== null) {
            //this.selectedDocument.sentences = JSON.parse(localStorage.getItem(this.selectedDocument.id + "-sentences"));
            //this.allSentences = JSON.parse(localStorage.getItem(this.selectedDocument.id + "-sentences"));
            //return true;
        }
        return false;
    }

    onClick(document, callback = () => {
    }) {
        this.selectedDocument = document;

        this.topics = document.keyphrases;
        this.loadTopics();
        this.loadDefaultBrush();
        //let result = this.loadCachedSentences();
        this.loading = true;

        this.documentService.getSentences(document.id)
            .subscribe(sentences => {
                this.loading = false;
                this.selectedDocument.sentences = sentences;
                this.computeTopicOccurrences();
                this.allSentences = sentences;
                this.cacheSentences();
                //this.allSentences = sentences;
                //this.onActiveTopicChange();
                //this.sortSentences(this.defaultSortMetric, this.defaultSortAscending);
                //this.onShowCorrected();
                callback();
                this.loading = false;
                this.computeTopicOccurrences();
            });
    }

    onRetrainClick() {
        this.retrainText = "Training...";
        this.retraining = true;
        this.documentService.retrain(this.selectedDocument.id)
            .subscribe(res => {
                this.retrainText = "Retrain";
                this.retraining = false;
            })
    }

    onRetranslateClick() {
        this.retranslateText = "Translating...";
        this.retranslating = true;
        this.documentService.retranslate(this.selectedDocument.id)
            .subscribe((res: any) => {
                this.onClick(this.selectedDocument);
                this.retranslateText = "Retranslate";
                this.numChanges = res.numChanges;
                this.retranslating = false;
            })
    }

    uploadClick() {
        var dialogRef = this.dialog.open(DocumentUploadDialog, {
            width: "400px",
            data: {},
        });

        dialogRef.afterClosed().subscribe(result => {

        });
    }

    onShowCorrected() {
        this.computeTopicOccurrences();
    }

    onShowFlagged(event) {
        this.computeTopicOccurrences();
    }


}

@Component({
    selector: 'document-upload-dialog',
    templateUrl: 'document-upload-dialog.html',
})
export class DocumentUploadDialog {

    httpUri = "http://46.101.224.19:5000/upload";
    documentName = "";

    constructor(public dialogRef: MatDialogRef<DocumentUploadDialog>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    get uri() {
        return this.httpUri + "?document_name=" + this.documentName;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
