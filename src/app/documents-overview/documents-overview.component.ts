import {Component, OnInit, Inject} from '@angular/core';
import {Document} from '../models/document';
import {DocumentService} from '../services/document.service';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {ActivatedRoute} from '@angular/router';

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
        //{name: "confidence", color: "orange"},
        {name: "coverage_penalty", color: "lightblue", shortname: "CP"},
        {name: "coverage_deviation_penalty", color: "green", shortname: "CDP"},
        {name: "length", color: "lightred", shortname: "Length"},
        {name: "confidence", color: "#3f51b5", shortname: "Conf"}
    ];
    sentenceId;
    documentId;
    loading = true;

    constructor(readonly documentService: DocumentService, public dialog: MatDialog, private route: ActivatedRoute) {
        this.documentService.getDocuments()
            .subscribe(documents => {
                this.documents = documents;
                if (this.documents.length > 0) {
                    this.onClick(this.documents[0]);
                }
            });
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
        console.log("Brush " + sentences.length);
        this.selectedDocument.sentences = sentences;
    }


    scrollParentToChild(parent, child) {
        console.log(parent);
        console.log(child);
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

        this.allSentences = this.selectedDocument.sentences;
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
