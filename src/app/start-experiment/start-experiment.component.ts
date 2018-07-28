import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ExperimentService} from '../services/experiment.service';

@Component({
    selector: 'app-start-experiment',
    templateUrl: './start-experiment.component.html',
    styleUrls: ['./start-experiment.component.css']
})
export class StartExperimentComponent implements OnInit {

    json = {
        questions: [
            {
                name: "age",
                type: "text",
                inputType: "number",
                title: "How old are you?",
                isRequired: true
            },
            {
                type: "radiogroup",
                name: "gender",
                title: "What is your gender?",
                colCount: 3,
                isRequired: true,
                startWithNewLine: false,
                choices: [
                    "Male",
                    "Female"
                ]
            },
            {
                name: "occupation",
                type: "text",
                title: "What is your current occupation?",
                startWithNewLine: false,
                isRequired: true
            },
            {
                type: "rating",
                name: "german-skills",
                title: "How would you rate your German language proficiency?",
                minRateDescription: "Poor",
                maxRateDescription: "Native or Native-like",
                isRequired: true
            },
            {
                type: "rating",
                name: "english-skills",
                title: "How would you rate your English language proficiency?",
                minRateDescription: "Poor",
                maxRateDescription: "Native or Native-like",
                isRequired: true
            },
            {
                type: "rating",
                name: "vis-skills",
                title: "How much experience do you have with visualizations?",
                minRateDescription: "None",
                maxRateDescription: "A lot (Expert)",
                isRequired: true
            }
        ]
    };
    showSubmitButton = false;
    documentId;
    sentenceId;

    constructor(private experimentService: ExperimentService, private router: Router) {
        var defaultThemeColors = Survey
            .StylesManager
            .ThemeColors["default"];
        defaultThemeColors["$main-color"] = "#3f51b5";
        defaultThemeColors["$main-hover-color"] = "#3f51b5";
        defaultThemeColors["$text-color"] = "#4a4a4a";
        defaultThemeColors["$header-color"] = "#3f51b5";

        Survey
            .StylesManager
            .applyTheme();
    }

    onStartExperiment() {
        this.router.navigate(["/document", this.documentId, "sentence", this.sentenceId]);
    }

    ngOnInit() {
        var survey = new Survey.Model(this.json);
        survey.requiredText = "";
        survey.showCompletedPage = true;
        survey.completedHtml = "<span>Thank you for completing the survey!<br>" +
            "You can now start the user study by clicking below</span>";
        survey.onComplete.add(result => {
            this.experimentService.sendSurveyData(result.data)
                .subscribe(result => {
                    this.showSubmitButton = true;
                    this.documentId = result.documentId;
                    this.sentenceId = result.sentenceId;
                });
        });
        Survey
            .SurveyNG
            .render("surveyElement", {model: survey});
    }

}
