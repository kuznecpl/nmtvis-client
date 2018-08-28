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
        pages: [
            {
                name: "page1",
                elements: [
                    {
                        type: "text",
                        name: "occupation",
                        title: "What is your occupation?",
                        isRequired: true
                    },
                    {
                        type: "panel",
                        name: "language-panel",
                        elements: [
                            {
                                type: "rating",
                                name: "german",
                                title: "How do you rate your German language proficiency?",
                                minRateDescription: "Poor",
                                maxRateDescription: "Native Speaker"
                            },
                            {
                                type: "rating",
                                name: "english",
                                title: "How do you rate your English language proficiency?",
                                minRateDescription: "Poor",
                                maxRateDescription: "Native Speaker"
                            }
                        ],
                        title: "Language Skills"
                    }
                ]
            },
            {
                name: "page2",
                elements: [
                    {
                        type: "panel",
                        name: "functional",
                        elements: [
                            {
                                type: "rating",
                                name: "beamsearch1",
                                title: "The Beam Search View was helpful for exploring different translations.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                name: "beamsearch2",
                                title: "The Beam Search View was useful for correcting a machine-generated translation.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                name: "attentionview",
                                title: "The Attention View was helpful for analysing a translation.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                name: "metricsview",
                                title: "The Metrics View was useful for finding sentences that contain translation errors.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                name: "keyphraseview",
                                title: "The Keyphrase View was useful for finding sentences that contain translation errors.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            }
                        ],
                        title: "Functionality"
                    }
                ]
            },
            {
                name: "page3",
                elements: [
                    {
                        type: "panel",
                        name: "visualization",
                        elements: [
                            {
                                type: "rating",
                                name: "beamsearch-vis",
                                title: "It was difficult to understand the visual representations in the Beam Search View.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                name: "attentionview-vis",
                                title: "It was difficult to understand the visual representations in the Attention View.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                name: "metricsview-vis",
                                title: "It was easy to understand the visual representations in the Metrics View.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                name: "general-vis",
                                title: "It was difficult to interact with the visualizations.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            }
                        ],
                        title: "Visualization"
                    }
                ]
            },
            {
                name: "page4",
                elements: [
                    {
                        type: "panel",
                        name: "opinion",
                        elements: [
                            {
                                type: "comment",
                                name: "positive-opinion",
                                title: "What functionality or part of the system did you like and why?"
                            },
                            {
                                type: "comment",
                                name: "negative-opinion",
                                title: "What functionality or part of the system did you dislike and why?"
                            },
                            {
                                type: "comment",
                                name: "general-opinion",
                                title: "Do you have any other comments, feedback or ideas regarding the system?"
                            }
                        ],
                        title: "Free Form"
                    }
                ]
            }
        ]
    };
    showSubmitButton = false;
    documentId;
    sentenceId;
    experimentType;

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
        this.router.navigate(["/finish"]);
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
                    this.experimentType = result.experimentType;
                });
        });
        Survey
            .SurveyNG
            .render("surveyElement", {model: survey});
    }

}
