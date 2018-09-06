import {Component, OnInit} from '@angular/core';
import {ExperimentService} from '../services/experiment.service';

@Component({
    selector: 'app-finish',
    templateUrl: './finish.component.html',
    styleUrls: ['./finish.component.css']
})
export class FinishComponent implements OnInit {

    survey = {};
    objectKey = Object.keys;

    textQuestions = ["negative-opinion", "positive-opinion", "improvement", "general-comments"]

    constructor(private experimentService: ExperimentService) {
        experimentService.getExperimentData()
            .subscribe(result => {
                console.log(result)
                this.survey = this.parseResults(result.survey);
                console.log(this.survey);
            })
    }

    parseResults(results) {
        if (!results || results.length === 0) {
            return {};
        }

        var questionResults = {};

        for (let result of results) {
            for (let question of Object.keys(result)) {
                if (!(question in questionResults)) {
                    questionResults[question] = [];
                }
                questionResults[question].push(result[question]);
            }
        }
        return questionResults;
    }

    ngOnInit() {
    }

}
