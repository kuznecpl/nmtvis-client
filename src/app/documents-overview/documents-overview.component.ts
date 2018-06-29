import {Component, OnInit} from '@angular/core';
import {Document} from './document';

@Component({
    selector: 'app-documents-overview',
    templateUrl: './documents-overview.component.html',
    styleUrls: ['./documents-overview.component.css']
})
export class DocumentsOverviewComponent implements OnInit {

    documents = [new Document("1", "Dokument 1", "Das ist der Inhalt. Er ist sehr gut!"),
        new Document("2", "Dokument 2", "Ein Satz.")];
    selectedDocument;

    constructor() {
    }

    onClick(document) {
        this.selectedDocument = document;
        console.log(document);
    }

    ngOnInit() {
    }

}
