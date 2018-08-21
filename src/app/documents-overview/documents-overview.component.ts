import {Component, OnInit, Inject} from '@angular/core';
import {Document} from '../models/document';
import {DocumentService} from '../services/document.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {TextDisplayPipe} from '../pipes/text-display.pipe';
import * as d3 from 'd3';

@Component({
    selector: 'app-documents-overview',
    templateUrl: './documents-overview.component.html',
    styleUrls: ['./documents-overview.component.css']
})
export class DocumentsOverviewComponent implements OnInit {

    documents = [];
    allSentences = [];
    selectedDocument;
    selectedSentence;
    newDocumentName;
    showCorrected = true;
    metrics = [
        {name: "coverage_penalty", color: "lightblue", shortname: "CP"},
        {name: "coverage_deviation_penalty", color: "green", shortname: "CDP"},
        {name: "length", color: "lightred", shortname: "Length"},
        {name: "confidence", color: "#3f51b5", shortname: "Conf"}
    ];
    sentenceId;
    documentId;
    loading = true;
    topics = [{name: 'diagramm', active: false, occurrences: 0},
        {name: 'element', active: false, occurrences: 0},
        {name: 'computer', active: false, occurrences: 0}
    ];
    newKeyphrase;
    hoverTopic;

    constructor(readonly documentService: DocumentService, public dialog: MatDialog, private route: ActivatedRoute,
                private textPipe: TextDisplayPipe) {
        this.documentService.getDocuments()
            .subscribe(documents => {
                this.documents = documents;
                if (this.documents.length > 0) {
                    this.onClick(this.documents[0]);
                }
            });
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
        let source = this.textPipe.transform(sentence.source).split(" ");
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
    }

    onActiveTopicChange() {
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
                if (topic.active && el.text().trim().toLowerCase().indexOf(topic.name) >= 0) {
                    highlight = true;
                }
            }
        });
        this.topics = this.topics.slice();
    }

    sortSentences(metric: string, sortAscending: boolean) {
        this.selectedDocument.sentences = this.selectedDocument.sentences.sort((a, b) => {
            if (sortAscending) {
                return a["score"][metric] - b["score"][metric];
            } else {
                return b["score"][metric] - a["score"][metric];
            }
        }).slice();
    }


    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.documentId = params.get("document_id");
            this.sentenceId = params.get("sentence_id");

            if (!this.documentId || !this.sentenceId) {
                return;
            }

            this.documentService.getDocuments()
                .subscribe(documents => {
                    this.documents = documents;
                    for (var i = 0; i < this.documents.length; i++) {
                        if (this.documents[i].id === this.documentId) {
                            this.onClick(this.documents[i], () => {

                                for (var j = 0; j < this.selectedDocument.sentences.length; j++) {
                                    if (this.selectedDocument.sentences[j].id === this.sentenceId) {
                                        this.selectedSentence = this.selectedDocument.sentences[j];
                                        break;
                                    }
                                }

                                this.scrollParentToChild(document.getElementById("document-scroll"),
                                    document.getElementById("sentence-" + this.sentenceId));
                            });

                            return;
                        }
                    }
                });

        });
    }

    onBrushSelectionChange(sentences) {
        this.selectedDocument.sentences = sentences;
    }

    scrollToSentence(sentenceId) {
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
        return count + " of " + this.selectedDocument.sentences.length;
    }

    onSentenceClick(sentence) {
        sentence.corrected = !sentence.corrected;

        this.documentService.setCorrected(this.selectedDocument.id, sentence.id, sentence.corrected)
            .subscribe(result => {

            });
    }

    onClick(document, callback = () => {
    }) {
        this.selectedDocument = document;
        this.topics = document.keyphrases;
        this.loading = true;

        this.documentService.getSentences(document.id)
            .subscribe(sentences => {
                this.selectedDocument.sentences = sentences;
                this.allSentences = sentences;
                this.sortSentences("length", false);
                this.onShowCorrected();
                callback();
                this.loading = false;
            });
    }

    onRetrainClick() {
        this.documentService.retrain(this.selectedDocument.id)
            .subscribe(res => {
                console.log(res);
            })
    }

    onRetranslateClick() {
        this.documentService.retranslate(this.selectedDocument.id)
            .subscribe(res => {
                this.onClick(this.selectedDocument);
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
        if (this.showCorrected) {
            this.selectedDocument.sentences = this.allSentences;
            return;
        }

        //this.allSentences = this.selectedDocument.sentences;
        var sentences = [];

        for (var i = 0; i < this.selectedDocument.sentences.length; i++) {
            if (!this.selectedDocument.sentences[i].corrected) {
                sentences.push(this.selectedDocument.sentences[i]);
            }
        }
        this.selectedDocument.sentences = sentences;
    }


}

@Component({
    selector: 'document-upload-dialog',
    templateUrl: 'document-upload-dialog.html',
})
export class DocumentUploadDialog {

    httpUri = "http://46.101.224.19:5000/upload";

    constructor(public dialogRef: MatDialogRef<DocumentUploadDialog>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    get uri() {
        return this.httpUri + "?document_name=" + this.newDocumentName;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
