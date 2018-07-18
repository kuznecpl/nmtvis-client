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
import {MatTableModule} from '@angular/material/table';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {MatSliderModule} from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFileUploadModule} from 'angular-material-fileupload';
import {AppComponent} from './app.component';
import {DocumentsOverviewComponent, DocumentUploadDialog} from './documents-overview/documents-overview.component';
import {SentenceViewComponent} from './sentence-view/sentence-view.component';
import {BeamNodeDialog} from './sentence-view/sentence-view.component';
import {DocumentService} from './document.service';
import {SentencesVisComponent} from './documents-overview/sentences-vis/sentences-vis.component';


const appRoutes: Routes = [
    {path: 'documents', component: DocumentsOverviewComponent},
    {path: 'document/:document_id/sentence/:sentence_id', component: SentenceViewComponent},
];

@NgModule({
    declarations: [
        AppComponent,
        DocumentsOverviewComponent,
        SentenceViewComponent, BeamNodeDialog, SentencesVisComponent, DocumentUploadDialog
    ],
    imports: [
        BrowserModule, HttpClientModule, FormsModule, BrowserAnimationsModule, MatSnackBarModule,
        MatButtonModule, MatToolbarModule, MatInputModule, MatProgressSpinnerModule, MatCheckboxModule,
        MatIconModule, MatCardModule, MatTableModule, MatSidenavModule, MatListModule, MatDividerModule,
        MatSliderModule, MatInputModule, MatGridListModule, MatDialogModule, MatFileUploadModule,
        RouterModule.forRoot(
            appRoutes, // <-- debugging purposes only
        )
    ],
    entryComponents: [
        BeamNodeDialog, DocumentUploadDialog
    ],
    providers: [DocumentService],
    bootstrap: [AppComponent]
})
export class AppModule {
}
