import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule}   from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {MatSliderModule} from '@angular/material/slider';
import {MatInputModule} from '@angular/material/input';

import {AppComponent} from './app.component';
import {DocumentsOverviewComponent} from './documents-overview/documents-overview.component';
import {SentenceViewComponent} from './sentence-view/sentence-view.component';


const appRoutes: Routes = [
    {path: 'documents', component: DocumentsOverviewComponent},
    {path: 'document/:document_id/sentence/:sentence_id', component: SentenceViewComponent},
];

@NgModule({
    declarations: [
        AppComponent,
        DocumentsOverviewComponent,
        SentenceViewComponent
    ],
    imports: [
        BrowserModule, HttpClientModule, FormsModule, BrowserAnimationsModule,
        MatButtonModule, MatToolbarModule, MatInputModule, MatProgressSpinnerModule,
        MatIconModule, MatCardModule, MatSidenavModule, MatListModule, MatDividerModule,
        MatSliderModule, MatInputModule,
        RouterModule.forRoot(
            appRoutes, // <-- debugging purposes only
        )
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
