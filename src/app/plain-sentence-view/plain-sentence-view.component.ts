import {Component, OnInit, AfterContentInit, Inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {DocumentService} from '../services/document.service';
import {ExperimentService} from '../services/experiment.service';

@Component({
    selector: 'app-plain-sentence-view',
    templateUrl: './plain-sentence-view.component.html',
    styleUrls: ['./plain-sentence-view.component.css']
})
export class PlainSentenceViewComponent implements OnInit {

    sentence = "";
    translation = "";
    interval;
    timeSpent = 0;
    events = [];

    constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router,
                private documentService: DocumentService, private experimentService: ExperimentService) {
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.documentId = params.get("document_id");
            this.sentenceId = params.get("sentence_id");

            this.documentService.getSentence(this.documentId, this.sentenceId)
                .subscribe(sentence
                    => {
                    this.sentence = this.decodeText(sentence.inputSentence);
                    let translation = this.decodeText(sentence.translation);
                    this.translation = translation[0].toUpperCase() + translation.slice(1, -4);
                    this.timeSpent = 0;
                });
        });
    }

    decodeText(text) {
        text = text.replace(/&apos;/g, "'");
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/& quot ;/g, '"');
        return text;
    }

    ngAfterContentInit() {
        this.interval = setInterval(() => {
            this.timeSpent += 1;
        }, 500);
    }

    encodeText(text) {
        return text.replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    }

    onTranslationClick() {
        this.addEvent("mouseclick");
    }

    onChange(event) {

    }

    addEvent(type, val = "") {
        this.events.push({"type": type, "time": this.timeSpent, "val": val})
    }

    onSourceKeydown(event) {
        if (event.key === "c" && event.ctrlKey) {
            this.addEvent("source-copy");
        }
    }

    onSelectionChange(source, ev: any) {
        const start = ev.target.selectionStart;
        const end = ev.target.selectionEnd;
        let selection = ev.target.value.substr(start, end - start);
        this.addEvent(source + "-selection", selection);
    }

    onTargetKeydown(event) {
        if (event.key === "c" && event.ctrlKey) {
            this.addEvent("target-copy");
        }
        else if (event.key === "v" && event.ctrlKey) {
            this.addEvent("target-paste");
        }
        else if (event.key === "x" && event.ctrlKey) {
            this.addEvent("target-cut");
        }
        else {
            this.addEvent("keydown", event.key);
        }
    }

    onAcceptTranslation() {
        if (this.experimentService) {
            this.experimentService.getNextSentence({
                sentence: this.sentence,
                translation: this.translation,
                events: this.events,
                timeSpent: this.timeSpent,
            })
                .subscribe(result => {
                    if (result.status !== "finished") {
                        this.router.navigate(["/" + result.experimentType, 'document',
                            result.documentId, "sentence", result.sentenceId]);
                    } else {
                        this.router.navigate(['/finish']);
                    }
                });
        } else {
            this.router.navigate(['/documents', this.documentId, "sentence", this.sentenceId]);
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
