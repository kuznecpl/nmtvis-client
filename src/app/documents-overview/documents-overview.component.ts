import {Component, OnInit, Inject} from '@angular/core';
import {Document} from './document';
import {DocumentService} from '../document.service';
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
    metrics = [{name: "confidence", color: "orange"}, {name: "coverage_penalty", color: "lightblue"}, {
        name: "coverage_deviation_penalty",
        color: "green"
    }]

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
            console.log(params);

            this.documentService.getSentence(this.documentId, this.sentenceId)
                .subscribe(sentence
                    => {
                    this.sentence = sentence.inputSentence.split(" ");
                    this.inputSentence = sentence.inputSentence.toLowerCase().replace(".", " .");
                    this.translation = sentence.translation.split(" ");
                    this.attention = sentence.attention;
                    this.updateTranslation();
                    this.updateAttentionMatrix();
                    this.updateBeamGraph(sentence.beam);
                });
        });
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

    onClick(document) {
        this.selectedDocument = document;

        this.documentService.getSentences(document.id)
            .subscribe(sentences => {
                this.selectedDocument.sentences = sentences;
                this.allSentences = sentences;
                this.sortSentences("confidence");
                this.onShowCorrected();
            });
    }

    uploadClick() {
        var dialogRef = this.dialog.open(DocumentUploadDialog, {
            width: "400px",
            data: {},
        });

        dialogRef.afterClosed().subscribe(result => {

        });
    }

    ngOnInit() {
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
