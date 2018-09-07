import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ExperimentService} from '../services/experiment.service';
import * as Survey from 'survey-angular';

@Component({
    selector: 'app-start-experiment',
    templateUrl: './start-experiment.component.html',
    styleUrls: ['./start-experiment.component.css']
})
export class StartExperimentComponent implements OnInit {

    json = {
        pages: [
            {
                name: "introduction-page",
                elements: [
                    {
                        type: "radiogroup",
                        name: "occupation",
                        title: "What is your occupation?",
                        commentText: "Other:",
                        isRequired: true,
                        hasOther: true,
                        choices: [
                            {
                                value: "researcher",
                                text: "Researcher"
                            },
                            {
                                value: "student",
                                text: "Student"
                            }
                        ],
                        colCount: 3
                    },
                    {
                        type: "radiogroup",
                        name: "institute",
                        title: "Are you affiliated with a research institute?",
                        commentText: "Other:",
                        isRequired: true,
                        hasOther: true,
                        choices: [
                            {
                                value: "ims",
                                text: "IMS"
                            },
                            {
                                value: "ims",
                                text: "VIS/VISUS"
                            },
                            {
                                value: "none",
                                text: "None"
                            }
                        ],
                        colCount: 4
                    },
                    {
                        type: "panel",
                        name: "other_skills",
                        elements: [
                            {
                                type: "rating",
                                isRequired: true,
                                name: "mt_knowledge",
                                title: "How much knowledge do you have about Machine Translation?",
                                rateMax: 7,
                                minRateDescription: "None",
                                maxRateDescription: "Expert Knowledge"
                            },
                            {
                                type: "rating",
                                name: "vis_knowledge",
                                isRequired: true,
                                title: "How much knowledge do you have about Visualizations?",
                                rateMax: 7,
                                minRateDescription: "None",
                                maxRateDescription: "Expert Knowledge"
                            }
                        ],
                        title: "Background"
                    },
                    {
                        type: "panel",
                        name: "language-panel",
                        elements: [
                            {
                                type: "rating",
                                name: "german",
                                isRequired: true,
                                title: "How do you rate your German language proficiency?",
                                rateMax: 7,
                                minRateDescription: "Poor",
                                maxRateDescription: "Native Speaker"
                            },
                            {
                                type: "rating",
                                name: "english",
                                isRequired: true,
                                title: "How do you rate your English language proficiency?",
                                rateMax: 7,
                                minRateDescription: "Poor",
                                maxRateDescription: "Native Speaker"
                            }
                        ],
                        title: "Language Skills"
                    }
                ]
            },
            {
                name: "functionality-page",
                elements: [
                    {
                        type: "panel",
                        name: "functional",
                        elements: [
                            {
                                type: "rating",
                                name: "overall",
                                isRequired: true,
                                title: "Overall, I am satisfied with the ease of completing the tasks in this scenario.",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                isRequired: true,
                                name: "prefer_large",
                                title: "I would prefer the system over a simple text field for translating a large document ( >100 sentences).",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            },
                            {
                                type: "rating",
                                name: "prefer_small",
                                isRequired: true,
                                title: "I would prefer the system over a simple text field for translating a small document ( <20 sentences).",
                                rateMax: 7,
                                minRateDescription: "strongly disagree ",
                                maxRateDescription: "strongly agree"
                            }
                        ]
                    }
                ]
            },
            {
                name: "metricsview-page",
                elements: [
                    {
                        type: "rating",
                        name: "metricvsview-finding",
                        isRequired: true,
                        title: "The Metrics View was useful for finding sentences that contain translation errors.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    },
                    {
                        type: "rating",
                        name: "metricsview-visual",
                        isRequired: true,
                        title: "It was easy to understand the visual representations in the Metrics View.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    },
                    {
                        type: "rating",
                        name: "metricsview-interaction",
                        isRequired: true,
                        title: "It was easy to interact with the Metrics View.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    }
                ]
            },
            {
                name: "keyphraseview-page",
                elements: [
                    {
                        type: "rating",
                        isRequired: true,
                        name: "keyphraseview-finding",
                        title: "The Keyphrase View was useful for finding sentences that contain translation errors.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    },
                    {
                        type: "rating",
                        isRequired: true,
                        name: "keyphraseview-visual",
                        title: "It was easy to understand the visual representations in the Keyphrase View.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    },
                    {
                        type: "rating",
                        isRequired: true,
                        name: "keyphraseview-interaction",
                        title: "It was easy to interact with the Keyphrase View.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    }
                ]
            },
            {
                name: "beamsearchview-page",
                elements: [
                    {
                        type: "rating",
                        name: "beamsearchview-exploring",
                        isRequired: true,
                        title: "The Beam Search View was helpful for exploring and correcting translations.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    },
                    {
                        type: "rating",
                        isRequired: true,
                        name: "beamsearchview-visual",
                        title: "It was easy to understand the visual representations in the Beam Search View.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    },
                    {
                        type: "rating",
                        isRequired: true,
                        name: "beamsearchview-interaction",
                        title: "It was easy to interact with the Beam Search View.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    }
                ],
                title: "Beam Search View"
            },
            {
                name: "attentionview-page",
                elements: [
                    {
                        type: "rating",
                        isRequired: true,
                        name: "attentionview-analysing",
                        title: "The Attention View was helpful for analysing translations.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    },
                    {
                        type: "rating",
                        name: "attentionview-visual",
                        isRequired: true,
                        title: "It was easy to understand the visual representations in the Attention View.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    },
                    {
                        type: "rating",
                        isRequired: true,
                        name: "attentionview-interaction",
                        title: "It was easy to interact with the Attention View.",
                        rateMax: 7,
                        minRateDescription: "strongly disagree ",
                        maxRateDescription: "strongly agree"
                    }
                ]
            },
            {
                name: "opinion-page",
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
                                name: "improvement",
                                title: "Do you have suggestions for improvements to be made for the system?"
                            },
                            {
                                type: "comment",
                                name: "general-comments",
                                title: "Do you have any other feedback or comments?"
                            }
                        ]
                    }
                ]
            }
        ],
        cookieName: "nmtvis-survey",
        showPageTitles: false,
        showPageNumbers: true,
        showProgressBar: "both",
        requiredText: "",
        questionTitleTemplate: "{title}"
    };
    showSubmitButton = false;
    documentId;
    sentenceId;
    experimentType;
    survey;

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

    ngOnDestroy(){
        this.cacheSurveyData();
    }

    cacheSurveyData() {
        localStorage.setItem("survey-data", JSON.stringify(this.survey.data));
    }

    loadCachedSurveyData() {
        if (localStorage.getItem("survey-data") !== null) {
            return JSON.parse(localStorage.getItem("survey-data"));
        }
        return {};
    }

    ngOnInit() {
        this.survey = new Survey.Model(this.json);
        this.survey.data = this.loadCachedSurveyData();
        this.survey.requiredText = "";
        this.survey.sendResultOnPageNext = true;
        this.survey.showCompletedPage = true;
        this.survey.completedHtml = "<span>Thank you for completing the survey!<br>" +
            "You can now start the user study by clicking below</span>";
        this.survey.onPartialSend.add(result => {
            this.cacheSurveyData();
            this.experimentService.sendSurveyData(result.data)
                .subscribe(result => {
                });
        });
        this.survey.onComplete.add(result => {
            this.experimentService.sendSurveyData(result.data)
                .subscribe((result: any) => {
                    this.showSubmitButton = true;
                    this.documentId = result.documentId;
                    this.sentenceId = result.sentenceId;
                    this.experimentType = result.experimentType;
                });
        });
        Survey
            .SurveyNG
            .render("surveyElement", {model: this.survey});
    }

}
