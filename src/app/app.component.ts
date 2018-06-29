import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import * as d3 from 'd3';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent {
    title = 'DNN Vis';


    constructor(private http: HttpClient) {
    }

    ngAfterContentInit() {

    }
}
