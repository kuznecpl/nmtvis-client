import {Component, OnInit, AfterContentInit, Inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {DocumentService} from '../services/document.service';

@Component({
    selector: 'app-plain-sentence-view',
    templateUrl: './plain-sentence-view.component.html',
    styleUrls: ['./plain-sentence-view.component.css']
})
export class PlainSentenceViewComponent implements OnInit {

    sentence = "";
    translation = "";
    keypresses = 0;
    clicks = 0;
    sourceCopyCount = 0;
    targetCopyCount = 0;
    targetPasteCount = 0;
    backspaceCount = 0;

    constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router,
                private documentService: DocumentService) {
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.documentId = params.get("document_id");
            this.sentenceId = params.get("sentence_id");

            this.documentService.getSentence(this.documentId, this.sentenceId)
                .subscribe(sentence
                    => {
                    this.sentence = sentence.inputSentence;
                    this.translation = sentence.translation;
                });
        });
    }

    decodeText(text) {
        return text.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
    }

    encodeText(text) {
        return text.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    }

    onTranslationClick() {
        this.clicks += 1;
    }

    onChange(event) {
        this.keypresses += 1;
    }

    onSourceKeydown(event) {
        if (event.key === "c" && event.ctrlKey) {
            this.sourceCopyCount += 1;
        }
    }

    onTargetKeydown(event) {
        if (event.key === "Backspace") {
            this.backspaceCount += 1;
        }
        if (event.key === "c" && event.ctrlKey) {
            this.targetCopyCount += 1;
        }
        if (event.key === "v" && event.ctrlKey) {
            this.targetPasteCount += 1;
        }
    }

    onClick() {
        this.loading = true;
        this.http.post('http://46.101.224.19:5000', {
            sentence: this.encodeText(this.sentence),
            beam_size: 3,
            beam_length: 0.5,
            beam_coverage: 0.5,
        }).subscribe(data => {
            this.sentence = data["sentence"];
            this.translation = this.decodeText(data["translation"]);
            this.loading = false;
        });
    }

}
