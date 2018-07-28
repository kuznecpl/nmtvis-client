import {Component, OnInit} from '@angular/core';
import {ExperimentService} from '../services/experiment.service';

@Component({
    selector: 'app-finish',
    templateUrl: './finish.component.html',
    styleUrls: ['./finish.component.css']
})
export class FinishComponent implements OnInit {

    metrics = [];
    survey = "";
    objectKey = Object.keys;

    constructor(private experimentService: ExperimentService) {
        experimentService.getExperimentData()
            .subscribe(result => {
                this.metrics = result.metrics;
                this.survey = result.survey;
            })
    }

    ngOnInit() {
    }

}
