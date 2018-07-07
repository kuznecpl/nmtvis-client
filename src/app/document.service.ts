import {Injectable} from '@angular/core';
import {Document, Sentence} from './documents-overview/document';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DocumentService {

    private documents: Document[] = [new Document("1", "Dokument 1", "Das ist der Inhalt.ich bin nett."),
        new Document("2", "Dokument 2", "Ein Satz.")];
    private documentsUrl = "http://46.101.224.19:5000/api/documents"
    private documentUrl = "http://46.101.224.19:5000/api/document/"

    constructor(private http: HttpClient) {
    }

    getDocuments(): Observable<Document[]> {
        return this.http.get<Document[]>(this.documentsUrl);
    }

    getSentence(document_id, sentence_id): Observable<Sentence> {

        return this.http.get<Document>(this.documentUrl + document_id + "/sentence/" + sentence_id);
    }

}
