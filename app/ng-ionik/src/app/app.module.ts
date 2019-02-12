import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule} from '@angular/common/http'
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { GraphComponent } from './graph/graph.component';
import { GlobalsService } from './globals.service';
import { SlidingMenuComponent } from './common/sliding-menu/sliding-menu.component';

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    SlidingMenuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule
  ],
  providers: [
    GlobalsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
