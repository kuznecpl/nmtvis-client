import {Component, OnInit} from '@angular/core';
import {Document} from './document';
import {DocumentService} from '../document.service';

@Component({
    selector: 'app-documents-overview',
    templateUrl: './documents-overview.component.html',
    styleUrls: ['./documents-overview.component.css']
})
export class DocumentsOverviewComponent implements OnInit {

    documents = [];
    selectedDocument;
    newDocumentName;
    httpUri = "http://46.101.224.19:5000/upload";

    constructor(readonly documentService: DocumentService) {
        this.documentService.getDocuments()
            .subscribe(documents => this.documents = documents);
    }

    get uri() {
        return this.httpUri + "?document_name=" + this.newDocumentName;
    }

    OnInit() {
    }

    onClick(document) {
        this.selectedDocument = document;
    }

    ngOnInit() {
    }

}
